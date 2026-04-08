import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { SocketService } from '../../core/services/socket-service';
import { InterviewService } from '../../core/services/interview-service';
import { CompilerService } from '../../core/services/compiler-service';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, finalize, switchMap, tap } from 'rxjs';

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

@Component({
  selector: 'app-interview-room',
  standalone: true,
  imports: [],
  templateUrl: './interview-room.html',
  styleUrl: './interview-room.css',
})
export class InterviewRoom implements OnInit {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private socketService = inject(SocketService);
  private interview = inject(InterviewService);
  private compiler = inject(CompilerService);
  private localCodeChanges$ = new Subject<string>();

  interviewId = '';
  selectedLanguage = signal<'javascript' | 'python'>('javascript');
  code = signal(JS_STARTER_CODE);
  output = signal('');
  isRunning = signal(false);
  saveState = signal<SaveState>('idle');
  lastSavedLabel = signal<string>('');

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

    this.socketService.joinInterview(this.interviewId);

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

    this.interview
      .getInterviewById(this.interviewId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const serverCode = res?.data?.code;
          if (typeof serverCode === 'string' && serverCode.trim().length > 0) {
            this.code.set(serverCode);
          }
          this.saveState.set('saved');
          this.lastSavedLabel.set(new Date().toLocaleTimeString());
        },
        error: () => this.saveState.set('error'),
      });
  }

  run() {
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
    this.code.set(newCode);
    this.saveState.set('pending');

    this.socketService.emit('code-change', {
      interviewId: this.interviewId,
      code: newCode,
    });

    this.localCodeChanges$.next(newCode);
  }

  onLanguageChange(language: 'javascript' | 'python'): void {
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
}
