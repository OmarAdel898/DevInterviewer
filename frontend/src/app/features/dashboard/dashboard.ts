import { Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { InterviewService } from '../../core/services/interview-service';
import { User } from '../../core/models/user.model';

interface LaunchRoomFormState {
  title: string;
  language: 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'csharp';
  focus: string;
  time: string;
  candidateEmail: string;
}

interface CreateInterviewPayload {
  title: string;
  candidateName: string;
  language: LaunchRoomFormState['language'];
  focus: string;
  time: string;
  candidate: string;
}


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  @ViewChild('launchRoomModal') private launchRoomModal?: ElementRef<HTMLDialogElement>;

  private readonly interviewService = inject(InterviewService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.authService.currentUser;
  protected readonly userFirstName = computed(() => {
    const fullName = this.user()?.fullName;
    return fullName ? fullName.split(' ')[0] : 'User';
  });

  protected readonly stats = [
    { label: 'Upcoming interviews', value: 8 },
    { label: 'Active interviewers', value: 14 },
    { label: 'Candidates in pipeline', value: 32 }
  ];

  protected readonly sessions = signal<any[]>([]);
  protected readonly isLoading = signal(true);

  protected readonly skeletonCards = [1, 2, 3, 4, 5, 6];
  protected readonly supportedLanguages: Array<{ label: string; value: LaunchRoomFormState['language'] }> = [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' },
    { label: 'C++', value: 'cpp' },
    { label: 'C#', value: 'csharp' }
  ];

  protected readonly launchRoomForm = signal<LaunchRoomFormState>({
    title: '',
    language: 'javascript',
    focus: '',
    time: '',
    candidateEmail: ''
  });

  protected readonly selectedCandidate = signal<User | null>(null);
  protected readonly isCandidateLookupLoading = signal(false);
  protected readonly candidateLookupError = signal<string | null>(null);
  protected readonly candidateLookupSuccess = signal<string | null>(null);
  protected readonly isCandidateEmailLocked = signal(false);

  protected readonly isCreatingInterview = signal(false);
  protected readonly createInterviewError = signal<string | null>(null);
  protected readonly createdRoomId = signal<string | null>(null);
  protected readonly hasCopiedRoomId = signal(false);
  protected readonly deletingInterviewId = signal<string | null>(null);
  protected readonly deleteInterviewError = signal<string | null>(null);
  protected readonly deleteInterviewSuccess = signal<string | null>(null);

  private loadingTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadInterviews();
    this.loadingTimer = setTimeout(() => this.isLoading.set(false), 900);
  }
  loadInterviews() {
    this.isLoading.set(true);
    this.deleteInterviewError.set(null);
    this.interviewService.getMyInterviews().subscribe({
      next: (res) => {
        this.sessions.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load interviews', err);
        this.isLoading.set(false);
      }
    });
  }
  joinRoom(interviewId: string) {
    this.router.navigate(['/interview', interviewId]);
  }

  protected getSessionId(session: any): string {
    return session?._id || session?.id || '';
  }

  protected deleteRoom(session: any): void {
    const interviewId = this.getSessionId(session);

    if (!interviewId || this.deletingInterviewId()) {
      return;
    }

    const interviewTitle = session?.title?.trim() || 'this interview';
    const shouldDelete = window.confirm(`Delete "${interviewTitle}"? This cannot be undone.`);

    if (!shouldDelete) {
      return;
    }

    this.deletingInterviewId.set(interviewId);
    this.deleteInterviewError.set(null);
    this.deleteInterviewSuccess.set(null);

    this.interviewService.deleteInterview(interviewId).subscribe({
      next: () => {
        this.sessions.update((current) => current.filter((item) => this.getSessionId(item) !== interviewId));
        this.deleteInterviewSuccess.set('Interview deleted successfully.');
        this.deletingInterviewId.set(null);
      },
      error: (error) => {
        this.deleteInterviewError.set(this.extractErrorMessage(error, 'Failed to delete interview.'));
        this.deletingInterviewId.set(null);
      }
    });
  }

  protected openLaunchRoomModal(): void {
    this.resetLaunchRoomForm();
    this.launchRoomModal?.nativeElement.showModal();
  }

  protected closeLaunchRoomModal(): void {
    this.launchRoomModal?.nativeElement.close();
  }

  protected updateLaunchRoomField(field: keyof LaunchRoomFormState, event: Event): void {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    const nextValue = input.value;

    this.launchRoomForm.update((current) => {
      if (field === 'language') {
        return { ...current, language: nextValue as LaunchRoomFormState['language'] };
      }

      return { ...current, [field]: nextValue };
    });

    if (field === 'candidateEmail') {
      this.selectedCandidate.set(null);
      this.isCandidateEmailLocked.set(false);
      this.candidateLookupError.set(null);
      this.candidateLookupSuccess.set(null);
      this.createdRoomId.set(null);
      this.hasCopiedRoomId.set(false);
    }

    if (field !== 'candidateEmail') {
      this.createInterviewError.set(null);
    }
  }

  protected lookupCandidateByEmail(): void {
    const email = this.launchRoomForm().candidateEmail.trim().toLowerCase();

    if (!email) {
      this.candidateLookupError.set('Please enter the candidate email first.');
      this.selectedCandidate.set(null);
      return;
    }

    this.launchRoomForm.update((current) => ({ ...current, candidateEmail: email }));
    this.isCandidateLookupLoading.set(true);
    this.candidateLookupError.set(null);
    this.candidateLookupSuccess.set(null);
    this.selectedCandidate.set(null);
    this.createInterviewError.set(null);
    this.createdRoomId.set(null);

    this.authService.getUserByEmail(email).subscribe({
      next: (response) => {
        this.isCandidateLookupLoading.set(false);

        if (response.user.role !== 'user') {
          this.candidateLookupError.set('Only users with role "user" can be assigned as candidates.');
          return;
        }

        this.selectedCandidate.set(response.user);
        this.isCandidateEmailLocked.set(true);
        this.candidateLookupSuccess.set(`Candidate ${response.user.fullName} is ready.`);
      },
      error: (error) => {
        this.isCandidateLookupLoading.set(false);
        this.selectedCandidate.set(null);
        this.isCandidateEmailLocked.set(false);
        this.candidateLookupSuccess.set(null);
        this.candidateLookupError.set(this.extractErrorMessage(error, 'Could not find that user.'));
      }
    });
  }

  protected unlockCandidateEmail(): void {
    this.isCandidateEmailLocked.set(false);
    this.selectedCandidate.set(null);
    this.candidateLookupError.set(null);
    this.candidateLookupSuccess.set(null);
    this.createInterviewError.set(null);
    this.createdRoomId.set(null);
    this.hasCopiedRoomId.set(false);
  }

  protected createRoom(): void {
    const formState = this.launchRoomForm();
    const candidate = this.selectedCandidate();

    if (!candidate) {
      this.createInterviewError.set('Find a candidate by email before creating the room.');
      return;
    }

    const title = formState.title.trim();
    const focus = formState.focus.trim();
    const scheduleDate = new Date(formState.time);

    if (!title || !focus || !formState.time) {
      this.createInterviewError.set('Please complete title, focus, and schedule before creating.');
      return;
    }

    if (Number.isNaN(scheduleDate.getTime())) {
      this.createInterviewError.set('Please provide a valid date and time.');
      return;
    }

    const payload: CreateInterviewPayload = {
      title,
      candidateName: candidate.fullName,
      language: formState.language,
      focus,
      time: scheduleDate.toISOString(),
      candidate: candidate.id
    };

    this.isCreatingInterview.set(true);
    this.createInterviewError.set(null);
    this.createdRoomId.set(null);
    this.hasCopiedRoomId.set(false);

    this.interviewService.createInterview(payload).subscribe({
      next: (response: any) => {
        this.isCreatingInterview.set(false);

        const roomId = response?.data?._id || response?.data?.id || null;
        this.createdRoomId.set(roomId);
        this.loadInterviews();
      },
      error: (error) => {
        this.isCreatingInterview.set(false);
        this.createInterviewError.set(this.extractErrorMessage(error, 'Failed to create interview room.'));
      }
    });
  }

  protected async copyRoomId(): Promise<void> {
    const roomId = this.createdRoomId();
    if (!roomId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(roomId);
      this.hasCopiedRoomId.set(true);
      setTimeout(() => this.hasCopiedRoomId.set(false), 1500);
    } catch {
      this.createInterviewError.set('Room ID could not be copied. Please copy it manually.');
    }
  }

  private resetLaunchRoomForm(): void {
    this.launchRoomForm.set({
      title: '',
      language: 'javascript',
      focus: '',
      time: '',
      candidateEmail: ''
    });
    this.selectedCandidate.set(null);
    this.isCandidateLookupLoading.set(false);
    this.candidateLookupError.set(null);
    this.candidateLookupSuccess.set(null);
    this.isCandidateEmailLocked.set(false);
    this.isCreatingInterview.set(false);
    this.createInterviewError.set(null);
    this.createdRoomId.set(null);
    this.hasCopiedRoomId.set(false);
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    const maybeHttpError = error as { error?: { message?: unknown } };
    const message = maybeHttpError?.error?.message;

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    return fallback;
  }

  ngOnDestroy(): void {
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
