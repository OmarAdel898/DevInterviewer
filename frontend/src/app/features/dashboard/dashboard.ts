import { Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { InterviewService } from '../../core/services/interview-service';
import { ProblemService } from '../../core/services/problem-service';
import { Problem } from '../../core/models/problem.model';
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

type ProblemDifficulty = 'easy' | 'medium' | 'hard';

interface ProblemFormState {
  title: string;
  description: string;
  difficulty: ProblemDifficulty;
  language: LaunchRoomFormState['language'];
  starterCode: string;
  topics: string;
}

type InterviewStatusFilter = 'all' | 'pending' | 'in-progress' | 'completed';
type InterviewLanguageFilter = 'all' | LaunchRoomFormState['language'];


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  @ViewChild('launchRoomModal') private launchRoomModal?: ElementRef<HTMLDialogElement>;
  @ViewChild('deleteRoomModal') private deleteRoomModal?: ElementRef<HTMLDialogElement>;
  @ViewChild('assignProblemsModal') private assignProblemsModal?: ElementRef<HTMLDialogElement>;

  private readonly interviewService = inject(InterviewService);
  private readonly problemService = inject(ProblemService);
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
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 10;
  protected readonly searchQuery = signal('');
  protected readonly selectedStatusFilter = signal<InterviewStatusFilter>('all');
  protected readonly selectedLanguageFilter = signal<InterviewLanguageFilter>('all');
  protected readonly statusFilterOptions: Array<{ label: string; value: InterviewStatusFilter }> = [
    { label: 'All statuses', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' }
  ];

  protected readonly skeletonCards = [1, 2, 3, 4, 5, 6];
  protected readonly supportedLanguages: Array<{ label: string; value: LaunchRoomFormState['language'] }> = [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' },
    { label: 'C++', value: 'cpp' },
    { label: 'C#', value: 'csharp' }
  ];
  protected readonly problemDifficultyOptions: Array<{ label: string; value: ProblemDifficulty }> = [
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' }
  ];
  protected readonly languageFilterOptions: Array<{ label: string; value: InterviewLanguageFilter }> = [
    { label: 'All languages', value: 'all' },
    ...this.supportedLanguages
  ];
  protected readonly hasActiveListFilters = computed(() => {
    return this.searchQuery().trim().length > 0
      || this.selectedStatusFilter() !== 'all'
      || this.selectedLanguageFilter() !== 'all';
  });
  protected readonly filteredSessions = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const selectedStatus = this.selectedStatusFilter();
    const selectedLanguage = this.selectedLanguageFilter();

    return this.sessions().filter((session) => {
      const status = String(session?.status ?? '').toLowerCase();
      const language = String(session?.language ?? '').toLowerCase();

      if (selectedStatus !== 'all' && status !== selectedStatus) {
        return false;
      }

      if (selectedLanguage !== 'all' && language !== selectedLanguage) {
        return false;
      }

      if (!query) {
        return true;
      }

      const title = String(session?.title ?? '').toLowerCase();
      const candidateName = String(session?.candidateName ?? '').toLowerCase();

      return title.includes(query) || candidateName.includes(query) || language.includes(query);
    });
  });
  protected readonly filteredSessionsCount = computed(() => this.filteredSessions().length);
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredSessionsCount() / this.pageSize)));
  protected readonly pageNumbers = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, index) => index + 1);
  });
  protected readonly pagedSessions = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredSessions().slice(start, end);
  });
  protected readonly listSummaryLabel = computed(() => {
    if (this.hasActiveListFilters()) {
      return `${this.filteredSessionsCount()} shown / ${this.sessions().length} total`;
    }

    return `${this.sessions().length} scheduled`;
  });

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
  protected readonly pendingDeleteSession = signal<any | null>(null);

  protected readonly problems = signal<Problem[]>([]);
  protected readonly isProblemsLoading = signal(false);
  protected readonly problemForm = signal<ProblemFormState>({
    title: '',
    description: '',
    difficulty: 'medium',
    language: 'javascript',
    starterCode: '',
    topics: ''
  });
  protected readonly isCreatingProblem = signal(false);
  protected readonly createProblemError = signal<string | null>(null);
  protected readonly createProblemSuccess = signal<string | null>(null);
  protected readonly deletingProblemId = signal<string | null>(null);
  protected readonly problemActionError = signal<string | null>(null);
  protected readonly problemActionSuccess = signal<string | null>(null);

  protected readonly selectedInterviewForAssignment = signal<any | null>(null);
  protected readonly currentAssignedProblems = signal<Problem[]>([]);
  protected readonly selectedProblemIds = signal<string[]>([]);
  protected readonly isAssignmentLoading = signal(false);
  protected readonly isAssigningProblems = signal(false);
  protected readonly removingAssignedProblemId = signal<string | null>(null);
  protected readonly assignProblemsError = signal<string | null>(null);
  protected readonly assignProblemsSuccess = signal<string | null>(null);

  private loadingTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadInterviews();
    this.loadProblems();
    this.loadingTimer = setTimeout(() => this.isLoading.set(false), 900);
  }
  loadInterviews() {
    this.isLoading.set(true);
    this.deleteInterviewError.set(null);
    this.interviewService.getMyInterviews().subscribe({
      next: (res) => {
        const mapped = Array.isArray(res?.data) ? res.data : [];
        this.sessions.set(mapped);
        this.clampCurrentPage();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load interviews', err);
        this.isLoading.set(false);
      }
    });
  }

  loadProblems(): void {
    this.isProblemsLoading.set(true);
    this.problemActionError.set(null);

    this.problemService.getMyProblems().subscribe({
      next: (res) => {
        const mapped = Array.isArray(res?.data) ? res.data : [];
        this.problems.set(mapped);
        this.isProblemsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load problems', err);
        this.problemActionError.set(this.extractErrorMessage(err, 'Failed to load problem bank.'));
        this.isProblemsLoading.set(false);
      }
    });
  }

  joinRoom(interviewId: string) {
    this.router.navigate(['/interview', interviewId]);
  }

  protected getProblemId(problem: any): string {
    return problem?._id || problem?.id || '';
  }

  protected getProblemTopics(problem: any): string[] {
    if (!Array.isArray(problem?.topics)) {
      return [];
    }

    return problem.topics
      .filter((topic: unknown) => typeof topic === 'string')
      .map((topic: string) => topic.trim())
      .filter((topic: string) => topic.length > 0);
  }

  protected getAssignedProblemCount(session: any): number {
    if (!Array.isArray(session?.assignedProblems)) {
      return 0;
    }

    return this.mapAssignedProblems(session.assignedProblems).length;
  }

  protected getAssignedProblemCountLabel(session: any): string {
    const count = this.getAssignedProblemCount(session);
    return count === 1 ? '1 problem assigned' : `${count} problems assigned`;
  }

  protected updateProblemField(field: keyof ProblemFormState, event: Event): void {
    const input = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const nextValue = input.value;

    this.problemForm.update((current) => {
      if (field === 'difficulty') {
        return { ...current, difficulty: nextValue as ProblemDifficulty };
      }

      if (field === 'language') {
        return { ...current, language: nextValue as LaunchRoomFormState['language'] };
      }

      return { ...current, [field]: nextValue };
    });

    this.createProblemError.set(null);
    this.createProblemSuccess.set(null);
    this.problemActionError.set(null);
    this.problemActionSuccess.set(null);
  }

  protected createProblem(): void {
    const formState = this.problemForm();
    const title = formState.title.trim();
    const description = formState.description.trim();

    if (title.length < 3 || description.length < 10) {
      this.createProblemError.set('Problem title must be at least 3 characters and description at least 10 characters.');
      return;
    }

    const topics = formState.topics
      .split(',')
      .map((topic) => topic.trim())
      .filter((topic) => topic.length > 0);

    this.isCreatingProblem.set(true);
    this.createProblemError.set(null);
    this.createProblemSuccess.set(null);
    this.problemActionError.set(null);
    this.problemActionSuccess.set(null);

    this.problemService.createProblem({
      title,
      description,
      difficulty: formState.difficulty,
      language: formState.language,
      starterCode: formState.starterCode,
      topics
    }).subscribe({
      next: (response) => {
        const createdProblem = response?.data;

        if (createdProblem) {
          this.problems.update((current) => [createdProblem, ...current]);
        }

        this.isCreatingProblem.set(false);
        this.createProblemSuccess.set('Problem saved to your bank.');
        this.problemActionSuccess.set('Problem bank updated.');
        this.problemForm.set({
          title: '',
          description: '',
          difficulty: 'medium',
          language: 'javascript',
          starterCode: '',
          topics: ''
        });
      },
      error: (error) => {
        this.isCreatingProblem.set(false);
        this.createProblemError.set(this.extractErrorMessage(error, 'Failed to create problem.'));
      }
    });
  }

  protected deleteProblem(problem: Problem): void {
    const problemId = this.getProblemId(problem);

    if (!problemId || this.deletingProblemId()) {
      return;
    }

    this.deletingProblemId.set(problemId);
    this.problemActionError.set(null);
    this.problemActionSuccess.set(null);

    this.problemService.deleteProblem(problemId).subscribe({
      next: () => {
        this.problems.update((current) => current.filter((item) => this.getProblemId(item) !== problemId));
        this.currentAssignedProblems.update((current) => current.filter((item) => this.getProblemId(item) !== problemId));
        this.selectedProblemIds.update((current) => current.filter((id) => id !== problemId));
        this.deletingProblemId.set(null);
        this.problemActionSuccess.set('Problem deleted successfully.');
        this.loadInterviews();
      },
      error: (error) => {
        this.problemActionError.set(this.extractErrorMessage(error, 'Failed to delete problem.'));
        this.deletingProblemId.set(null);
      }
    });
  }

  protected openAssignProblemsModal(session: any): void {
    const interviewId = this.getSessionId(session);

    if (!interviewId) {
      return;
    }

    this.selectedInterviewForAssignment.set(session);
    this.currentAssignedProblems.set([]);
    this.selectedProblemIds.set([]);
    this.assignProblemsError.set(null);
    this.assignProblemsSuccess.set(null);
    this.isAssignmentLoading.set(true);
    this.assignProblemsModal?.nativeElement.showModal();

    this.interviewService.getInterviewById(interviewId).subscribe({
      next: (response) => {
        const interview = response?.data || session;
        const assignedProblems = this.mapAssignedProblems(interview?.assignedProblems || []);
        const assignedIds = assignedProblems
          .map((problem) => this.getProblemId(problem))
          .filter((id) => id.length > 0);

        this.selectedInterviewForAssignment.set(interview);
        this.currentAssignedProblems.set(assignedProblems);
        this.selectedProblemIds.set(assignedIds);
        this.syncInterviewAssignmentInList(interviewId, assignedProblems);
        this.isAssignmentLoading.set(false);
      },
      error: (error) => {
        this.assignProblemsError.set(this.extractErrorMessage(error, 'Failed to load current interview assignments.'));
        this.isAssignmentLoading.set(false);
      }
    });
  }

  protected closeAssignProblemsModal(): void {
    this.assignProblemsModal?.nativeElement.close();
    this.selectedInterviewForAssignment.set(null);
    this.currentAssignedProblems.set([]);
    this.selectedProblemIds.set([]);
    this.isAssignmentLoading.set(false);
    this.assignProblemsError.set(null);
    this.assignProblemsSuccess.set(null);
    this.removingAssignedProblemId.set(null);
    this.isAssigningProblems.set(false);
  }

  protected isProblemSelected(problemId: string): boolean {
    return this.selectedProblemIds().includes(problemId);
  }

  protected toggleProblemSelection(problemId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const checked = input.checked;

    this.selectedProblemIds.update((current) => {
      if (checked) {
        if (current.includes(problemId)) {
          return current;
        }
        return [...current, problemId];
      }

      return current.filter((id) => id !== problemId);
    });

    this.assignProblemsError.set(null);
    this.assignProblemsSuccess.set(null);
  }

  protected saveAssignedProblems(): void {
    const interview = this.selectedInterviewForAssignment();
    const interviewId = this.getSessionId(interview);

    if (!interviewId) {
      this.assignProblemsError.set('Interview not found for assignment.');
      return;
    }

    const uniqueProblemIds = [...new Set(this.selectedProblemIds())];

    if (uniqueProblemIds.length === 0) {
      this.assignProblemsError.set('Select at least one problem before saving assignments.');
      return;
    }

    this.isAssigningProblems.set(true);
    this.assignProblemsError.set(null);
    this.assignProblemsSuccess.set(null);

    this.interviewService.assignProblems(interviewId, uniqueProblemIds).subscribe({
      next: (response) => {
        const updatedInterview = response?.data || interview;
        const assignedProblems = this.mapAssignedProblems(updatedInterview?.assignedProblems || []);
        const assignedIds = assignedProblems
          .map((problem) => this.getProblemId(problem))
          .filter((id) => id.length > 0);

        this.selectedInterviewForAssignment.set(updatedInterview);
        this.currentAssignedProblems.set(assignedProblems);
        this.selectedProblemIds.set(assignedIds);
        this.syncInterviewAssignmentInList(interviewId, assignedProblems);
        this.assignProblemsSuccess.set('Problems assigned successfully.');
        this.isAssigningProblems.set(false);
      },
      error: (error) => {
        this.assignProblemsError.set(this.extractErrorMessage(error, 'Failed to assign selected problems.'));
        this.isAssigningProblems.set(false);
      }
    });
  }

  protected removeAssignedProblemFromInterview(problem: Problem): void {
    const interviewId = this.getSessionId(this.selectedInterviewForAssignment());
    const problemId = this.getProblemId(problem);

    if (!interviewId || !problemId || this.removingAssignedProblemId()) {
      return;
    }

    this.removingAssignedProblemId.set(problemId);
    this.assignProblemsError.set(null);
    this.assignProblemsSuccess.set(null);

    this.interviewService.removeAssignedProblem(interviewId, problemId).subscribe({
      next: (response) => {
        const updatedInterview = response?.data || this.selectedInterviewForAssignment();
        const assignedProblems = this.mapAssignedProblems(updatedInterview?.assignedProblems || []);
        const assignedIds = assignedProblems
          .map((assignedProblem) => this.getProblemId(assignedProblem))
          .filter((id) => id.length > 0);

        this.selectedInterviewForAssignment.set(updatedInterview);
        this.currentAssignedProblems.set(assignedProblems);
        this.selectedProblemIds.set(assignedIds);
        this.syncInterviewAssignmentInList(interviewId, assignedProblems);
        this.assignProblemsSuccess.set('Assigned problem removed successfully.');
        this.removingAssignedProblemId.set(null);
      },
      error: (error) => {
        this.assignProblemsError.set(this.extractErrorMessage(error, 'Failed to remove assigned problem.'));
        this.removingAssignedProblemId.set(null);
      }
    });
  }

  protected getSessionId(session: any): string {
    return session?._id || session?.id || '';
  }

  protected getPendingDeleteTitle(): string {
    const session = this.pendingDeleteSession();
    return session?.title?.trim() || 'this interview';
  }

  protected updateSearchQuery(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.currentPage.set(1);
  }

  protected updateStatusFilter(event: Event): void {
    const input = event.target as HTMLSelectElement;
    this.selectedStatusFilter.set(input.value as InterviewStatusFilter);
    this.currentPage.set(1);
  }

  protected updateLanguageFilter(event: Event): void {
    const input = event.target as HTMLSelectElement;
    this.selectedLanguageFilter.set(input.value as InterviewLanguageFilter);
    this.currentPage.set(1);
  }

  protected resetListFilters(): void {
    this.searchQuery.set('');
    this.selectedStatusFilter.set('all');
    this.selectedLanguageFilter.set('all');
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
  }

  protected goToPreviousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  protected goToNextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  protected deleteRoom(session: any): void {
    const interviewId = this.getSessionId(session);

    if (!interviewId || this.deletingInterviewId()) {
      return;
    }

    this.pendingDeleteSession.set(session);
    this.deleteInterviewError.set(null);
    this.deleteInterviewSuccess.set(null);
    this.deleteRoomModal?.nativeElement.showModal();
  }

  protected closeDeleteRoomModal(): void {
    this.deleteRoomModal?.nativeElement.close();
    this.pendingDeleteSession.set(null);
  }

  protected confirmDeleteRoom(): void {
    const session = this.pendingDeleteSession();
    const interviewId = this.getSessionId(session);

    if (!interviewId || this.deletingInterviewId()) {
      return;
    }

    this.deletingInterviewId.set(interviewId);
    this.deleteInterviewError.set(null);
    this.deleteInterviewSuccess.set(null);

    this.interviewService.deleteInterview(interviewId).subscribe({
      next: () => {
        this.sessions.update((current) => current.filter((item) => this.getSessionId(item) !== interviewId));
        this.clampCurrentPage();
        this.deleteInterviewSuccess.set('Interview deleted successfully.');
        this.deletingInterviewId.set(null);
        this.closeDeleteRoomModal();
      },
      error: (error) => {
        this.deleteInterviewError.set(this.extractErrorMessage(error, 'Failed to delete interview.'));
        this.deletingInterviewId.set(null);
        this.closeDeleteRoomModal();
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

  private mapAssignedProblems(assignedProblems: any[]): Problem[] {
    if (!Array.isArray(assignedProblems)) {
      return [];
    }

    return assignedProblems
      .map((item) => item?.problem || item)
      .filter((problem) => this.getProblemId(problem).length > 0);
  }

  private syncInterviewAssignmentInList(interviewId: string, assignedProblems: Problem[]): void {
    this.sessions.update((current) => {
      return current.map((session) => {
        if (this.getSessionId(session) !== interviewId) {
          return session;
        }

        return {
          ...session,
          assignedProblems: assignedProblems.map((problem) => ({ problem }))
        };
      });
    });
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

  private clampCurrentPage(): void {
    const maxPage = Math.max(1, Math.ceil(this.filteredSessionsCount() / this.pageSize));
    if (this.currentPage() > maxPage) {
      this.currentPage.set(maxPage);
    }
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
