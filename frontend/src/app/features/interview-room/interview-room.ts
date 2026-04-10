import { Component, computed, DestroyRef, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { SocketService } from '../../core/services/socket-service';
import { InterviewService } from '../../core/services/interview-service';
import { CompilerService } from '../../core/services/compiler-service';
import { AuthService } from '../../core/services/auth-service';
import { Router } from '@angular/router';
import { EMPTY, Subject, Subscription, catchError, debounceTime, distinctUntilChanged, finalize, interval, startWith, switchMap, tap } from 'rxjs';

const JS_STARTER_CODE = `function containsDuplicate(nums) {
  const seen = new Set();
  for (const num of nums) {
    if (seen.has(num)) return true;
    seen.add(num);
  }
  return false;
}`;

const PY_STARTER_CODE = `def contains_duplicate(nums):
    seen = set()
    for num in nums:
        if num in seen:
            return True
        seen.add(num)
    return False`;

type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';
type InterviewStatus = 'pending' | 'in-progress' | 'completed';

interface AssignedProblem {
  problem?: {
    _id?: string;
    title?: string;
    description?: string;
    difficulty?: string;
    language?: string;
    starterCode?: string;
    topics?: string[];
  };
  assignedAt?: string;
  assignedBy?: string;
}

interface RoomParticipant {
  userId: string;
  fullName: string;
  role: 'admin' | 'interviewer' | 'user' | string;
  connections: number;
}

@Component({
  selector: 'app-interview-room',
  standalone: true,
  imports: [],
  templateUrl: './interview-room.html',
  styleUrl: './interview-room.css',
})
export class InterviewRoom implements OnInit, OnDestroy {
  @ViewChild('completeInterviewModal') private completeInterviewModal?: ElementRef<HTMLDialogElement>;

  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private socketService = inject(SocketService);
  private interview = inject(InterviewService);
  private compiler = inject(CompilerService);
  private authService = inject(AuthService);
  private localCodeChanges$ = new Subject<string>();
  private waitingPollSubscription: Subscription | null = null;
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;

  interviewId = '';
  selectedLanguage = signal<'javascript' | 'python'>('javascript');
  code = signal(JS_STARTER_CODE);
  output = signal('');
  interviewTitle = signal('this interview');
  interviewOwnerId = signal('');
  interviewStatus = signal<InterviewStatus>('pending');
  assignedProblems = signal<AssignedProblem[]>([]);
  selectedProblemIndex = signal(0);
  waitingMessage = signal('Waiting for interviewer to start the interview...');
  participants = signal<RoomParticipant[]>([]);
  isPresenceLoaded = signal(false);
  isRunning = signal(false);
  isStatusUpdating = signal(false);
  statusError = signal<string | null>(null);
  saveState = signal<SaveState>('idle');
  lastSavedLabel = signal<string>('');

  currentUserRole = computed(() => this.authService.currentUser()?.role || 'user');
  currentUserId = computed(() => this.authService.currentUser()?.id || '');
  isOwner = computed(() => this.currentUserId() !== '' && this.currentUserId() === this.interviewOwnerId());
  onlineCount = computed(() => this.participants().length);
  activeProblem = computed(() => {
    return this.assignedProblems()[this.selectedProblemIndex()]?.problem || null;
  });
  hasAssignedProblems = computed(() => this.assignedProblems().length > 0);
  isWaitingForStart = computed(() => this.interviewStatus() === 'pending' && !this.isOwner());
  isLockedByLifecycle = computed(() => this.interviewStatus() === 'completed' || this.isWaitingForStart());

  canCompleteInterview = computed(() => {
    return this.isOwner() && this.interviewStatus() === 'in-progress';
  });

  canStartInterview = computed(() => this.isOwner() && this.interviewStatus() === 'pending');

  isInterviewCompleted = computed(() => this.interviewStatus() === 'completed');

  lineNumbers = computed(() => {
    const totalLines = Math.max(1, this.code().split('\n').length);
    return Array.from({ length: totalLines }, (_, index) => index + 1);
  });

  saveStatusLabel = computed(() => {
    switch (this.saveState()) {
      case 'pending':
        return 'Unsaved';
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return 'Synced';
    }
  });

  ngOnInit(): void {
    this.interviewId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.interviewId) {
      return;
    }

    this.localCodeChanges$
      .pipe(
        debounceTime(800),
        distinctUntilChanged(),
        tap(() => this.saveState.set('saving')),
        switchMap((updatedCode) =>
          this.interview.updateInterviewCode(this.interviewId, { code: updatedCode }).pipe(
            tap(() => {
              this.saveState.set('saved');
              this.lastSavedLabel.set(new Date().toLocaleTimeString());
            }),
            catchError(() => {
              this.saveState.set('error');
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    this.socketService
      .listen('receive-code')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((newCode: string) => {
        this.code.set(newCode);
      });

    this.socketService
      .listen('receive-output')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload: { interviewId: string; output: string }) => {
        if (!payload) return;
        if (payload.interviewId && payload.interviewId !== this.interviewId) return;
        this.output.set(payload.output || '');
      });

    this.socketService
      .listen('receive-status')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload: { interviewId: string; status: InterviewStatus }) => {
        if (!payload) return;
        if (payload.interviewId && payload.interviewId !== this.interviewId) return;

        this.onInterviewStatusChanged(this.normalizeStatus(payload.status));
      });

    this.socketService
      .listen('interview-started')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload: { interviewId: string }) => {
        if (!payload) return;
        if (payload.interviewId && payload.interviewId !== this.interviewId) return;

        this.onInterviewStatusChanged('in-progress');
      });

    this.socketService
      .listen('interview-ended')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload: { interviewId: string }) => {
        if (!payload) return;
        if (payload.interviewId && payload.interviewId !== this.interviewId) return;

        this.onInterviewStatusChanged('completed');
      });

    this.socketService
      .listen('interview-waiting')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload: { interviewId: string; message?: string }) => {
        if (!payload) return;
        if (payload.interviewId && payload.interviewId !== this.interviewId) return;

        this.waitingMessage.set(payload.message || 'Waiting for interviewer to start the interview...');
      });

    this.socketService
      .listen('receive-presence')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload: { interviewId: string; participants: RoomParticipant[] }) => {
        if (!payload) return;
        if (payload.interviewId && payload.interviewId !== this.interviewId) return;

        const nextParticipants = Array.isArray(payload.participants) ? payload.participants : [];
        this.participants.set(nextParticipants);
        this.isPresenceLoaded.set(true);
      });

    this.interview
      .getInterviewById(this.interviewId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.applyInterviewData(res?.data || {});
        },
        error: (err) => {
          this.saveState.set('error');
          this.statusError.set(this.extractErrorMessage(err, 'Unable to access this interview room.'));

          const maybeStatus = (err as { status?: number })?.status;
          if (maybeStatus === 403 || maybeStatus === 404) {
            this.output.set('Access denied. You are not assigned to this interview room. Redirecting...');
            this.redirectTimer = setTimeout(() => {
              this.router.navigate(['/my-interviews']);
            }, 1500);
          }
        },
      });
  }

  ngOnDestroy(): void {
    this.stopWaitingPoll();
    this.socketService.leaveInterview(this.interviewId);

    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
      this.redirectTimer = null;
    }
  }

  run() {
    if (this.isLockedByLifecycle()) {
      this.output.set(this.isInterviewCompleted()
        ? 'Interview is completed. Running code is disabled.'
        : 'Waiting for interviewer to start the interview.');
      return;
    }

    if (this.isRunning()) {
      return;
    }

    if (!this.code().trim()) {
      this.output.set('Write some code first.');
      return;
    }

    this.isRunning.set(true);
    this.output.set('Running...');

    this.compiler
      .compileCode(this.selectedLanguage(), this.code(), this.interviewId)
      .pipe(finalize(() => this.isRunning.set(false)))
      .subscribe({
        next: (res) => {
          this.output.set(res.output);
        },
        error: (err) => {
          this.output.set(err?.error?.output || err?.error?.message || 'Run failed');
        },
      });
  }

  onCodeUpdate(newCode: string) {
    if (this.isLockedByLifecycle()) {
      return;
    }

    this.code.set(newCode);
    this.saveState.set('pending');

    this.socketService.emit('code-change', {
      interviewId: this.interviewId,
      code: newCode,
    });

    this.localCodeChanges$.next(newCode);
  }

  onLanguageChange(language: 'javascript' | 'python'): void {
    if (this.isLockedByLifecycle()) {
      return;
    }

    const previousStarter = this.selectedLanguage() === 'javascript' ? JS_STARTER_CODE : PY_STARTER_CODE;
    const nextStarter = language === 'javascript' ? JS_STARTER_CODE : PY_STARTER_CODE;

    this.selectedLanguage.set(language);

    if (!this.code().trim() || this.code() === previousStarter) {
      this.onCodeUpdate(nextStarter);
    }
  }

  onClearOutput(): void {
    if (this.isRunning()) {
      return;
    }

    this.output.set('');
  }

  onSave() {
    if (this.isLockedByLifecycle()) {
      return;
    }

    this.saveState.set('saving');

    this.interview.updateInterviewCode(this.interviewId, { code: this.code() }).subscribe({
      next: () => {
        this.saveState.set('saved');
        this.lastSavedLabel.set(new Date().toLocaleTimeString());
      },
      error: () => {
        this.saveState.set('error');
      },
    });
  }

  startInterview(): void {
    if (!this.canStartInterview() || this.isStatusUpdating()) {
      return;
    }

    this.isStatusUpdating.set(true);
    this.statusError.set(null);

    this.interview
      .startInterview(this.interviewId)
      .pipe(
        finalize(() => this.isStatusUpdating.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.onInterviewStatusChanged('in-progress');
          this.output.set('Interview started successfully.');
        },
        error: (err) => {
          this.statusError.set(this.extractErrorMessage(err, 'Failed to start interview.'));
        }
      });
  }

  openCompleteInterviewModal(): void {
    if (!this.canCompleteInterview() || this.isStatusUpdating()) {
      return;
    }

    this.statusError.set(null);
    this.completeInterviewModal?.nativeElement.showModal();
  }

  closeCompleteInterviewModal(): void {
    this.completeInterviewModal?.nativeElement.close();
  }

  confirmCompleteInterview(): void {
    if (this.interviewStatus() === 'completed' || this.isStatusUpdating()) {
      return;
    }

    this.isStatusUpdating.set(true);
    this.statusError.set(null);

    this.interview
      .endInterview(this.interviewId)
      .pipe(
        finalize(() => this.isStatusUpdating.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.onInterviewStatusChanged('completed');
          this.closeCompleteInterviewModal();
          this.output.set('Interview marked as completed.');
        },
        error: (err) => {
          this.statusError.set(this.extractErrorMessage(err, 'Failed to mark interview as completed.'));
          this.closeCompleteInterviewModal();
        },
      });
  }

  selectProblem(index: number): void {
    if (index < 0 || index >= this.assignedProblems().length) {
      return;
    }

    this.selectedProblemIndex.set(index);
  }

  private applyInterviewData(interviewData: any): void {
    const serverCode = interviewData.code;
    if (typeof serverCode === 'string' && serverCode.trim().length > 0) {
      this.code.set(serverCode);
    }

    const serverLanguage = typeof interviewData.language === 'string' ? interviewData.language.toLowerCase() : '';
    this.selectedLanguage.set(serverLanguage === 'python' ? 'python' : 'javascript');

    if (typeof interviewData.title === 'string' && interviewData.title.trim()) {
      this.interviewTitle.set(interviewData.title.trim());
    }

    const owner = interviewData.owner;
    if (typeof owner === 'string') {
      this.interviewOwnerId.set(owner);
    } else if (owner && typeof owner === 'object') {
      this.interviewOwnerId.set(owner._id || owner.id || '');
    }

    const assignedProblems = Array.isArray(interviewData.assignedProblems) ? interviewData.assignedProblems : [];
    this.assignedProblems.set(assignedProblems);

    if (this.selectedProblemIndex() >= assignedProblems.length) {
      this.selectedProblemIndex.set(0);
    }

    this.onInterviewStatusChanged(this.normalizeStatus(interviewData.status));

    this.saveState.set('saved');
    this.lastSavedLabel.set(new Date().toLocaleTimeString());
  }

  private onInterviewStatusChanged(nextStatus: InterviewStatus): void {
    this.interviewStatus.set(nextStatus);

    if (nextStatus === 'in-progress') {
      this.stopWaitingPoll();
      this.socketService.joinInterview(this.interviewId);
      return;
    }

    if (nextStatus === 'pending') {
      if (this.isOwner()) {
        this.socketService.joinInterview(this.interviewId);
        this.stopWaitingPoll();
      } else {
        this.startWaitingPoll();
      }

      return;
    }

    this.stopWaitingPoll();
    this.isRunning.set(false);
    this.saveState.set('saved');
    this.closeCompleteInterviewModal();
    this.socketService.leaveInterview(this.interviewId);

    if (!this.isOwner()) {
      this.waitingMessage.set('Interview has ended. Redirecting you to My Interviews...');
      this.scheduleCandidateRedirect();
    }
  }

  private startWaitingPoll(): void {
    if (this.waitingPollSubscription) {
      return;
    }

    this.waitingPollSubscription = interval(3000)
      .pipe(
        startWith(0),
        switchMap(() => this.interview.getInterviewById(this.interviewId)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          const status = this.normalizeStatus(res?.data?.status);
          if (status !== 'pending') {
            this.applyInterviewData(res?.data || {});
            this.stopWaitingPoll();
          }
        },
        error: () => {
          this.stopWaitingPoll();
        }
      });
  }

  private stopWaitingPoll(): void {
    if (!this.waitingPollSubscription) {
      return;
    }

    this.waitingPollSubscription.unsubscribe();
    this.waitingPollSubscription = null;
  }

  private scheduleCandidateRedirect(): void {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }

    this.redirectTimer = setTimeout(() => {
      this.router.navigate(['/my-interviews']);
    }, 4000);
  }

  private normalizeStatus(status: unknown): InterviewStatus {
    if (status === 'in-progress' || status === 'completed') {
      return status;
    }

    return 'pending';
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    const maybeHttpError = error as { error?: { message?: unknown } };
    const message = maybeHttpError?.error?.message;

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    return fallback;
  }
}
