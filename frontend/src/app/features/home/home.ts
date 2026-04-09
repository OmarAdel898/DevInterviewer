import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { InterviewService } from '../../core/services/interview-service';

interface InterviewOwner {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
}

interface InterviewItem {
  _id?: string;
  id?: string;
  title: string;
  candidateName: string;
  language: string;
  focus: string;
  time: string;
  status: 'pending' | 'in-progress' | 'completed' | string;
  owner?: string | InterviewOwner;
  candidate?: string | InterviewOwner;
  createdAt?: string;
}

type InterviewStatusFilter = 'all' | 'pending' | 'in-progress' | 'completed';
type InterviewLanguageFilter = 'all' | 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'csharp';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  @ViewChild('deleteInterviewModal') private deleteInterviewModal?: ElementRef<HTMLDialogElement>;

  private readonly interviewService = inject(InterviewService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected interviews: InterviewItem[] = [];
  protected isLoading = true;
  protected errorMessage: string | null = null;
  protected deleteErrorMessage: string | null = null;
  protected deleteSuccessMessage: string | null = null;
  protected deletingInterviewId: string | null = null;
  protected pendingDeleteInterview: InterviewItem | null = null;
  protected readonly pageSize = 10;
  protected currentPage = 1;
  protected searchQuery = '';
  protected selectedStatusFilter: InterviewStatusFilter = 'all';
  protected selectedLanguageFilter: InterviewLanguageFilter = 'all';
  protected readonly statusFilterOptions: Array<{ label: string; value: InterviewStatusFilter }> = [
    { label: 'All statuses', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' }
  ];
  protected readonly languageFilterOptions: Array<{ label: string; value: InterviewLanguageFilter }> = [
    { label: 'All languages', value: 'all' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' },
    { label: 'C++', value: 'cpp' },
    { label: 'C#', value: 'csharp' }
  ];
  protected readonly skeletonCards = [1, 2, 3, 4];

  ngOnInit(): void {
    this.loadInterviews();
  }

  protected loadInterviews(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.deleteErrorMessage = null;

    this.interviewService.getMyInterviews().subscribe({
      next: (res: any) => {
        const mapped = Array.isArray(res?.data) ? res.data : [];
        this.interviews = mapped;
        this.ensureValidCurrentPage();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching interviews:', err);
        this.errorMessage = this.extractErrorMessage(err, 'Could not load your interviews.');
        this.isLoading = false;
      },
    });
  }

  protected get assignedCount(): number {
    return this.interviews.length;
  }

  protected get upcomingCount(): number {
    const now = Date.now();
    return this.interviews.filter((interview) => {
      const interviewTime = new Date(interview.time).getTime();
      return !Number.isNaN(interviewTime) && interviewTime >= now;
    }).length;
  }

  protected get completedCount(): number {
    return this.interviews.filter((interview) => interview.status === 'completed').length;
  }

  protected get hasActiveListFilters(): boolean {
    return this.searchQuery.trim().length > 0
      || this.selectedStatusFilter !== 'all'
      || this.selectedLanguageFilter !== 'all';
  }

  protected get filteredInterviews(): InterviewItem[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.interviews.filter((interview) => {
      const status = String(interview.status ?? '').toLowerCase();
      const language = String(interview.language ?? '').toLowerCase();

      if (this.selectedStatusFilter !== 'all' && status !== this.selectedStatusFilter) {
        return false;
      }

      if (this.selectedLanguageFilter !== 'all' && language !== this.selectedLanguageFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const title = String(interview.title ?? '').toLowerCase();
      const candidateName = String(interview.candidateName ?? '').toLowerCase();

      return title.includes(query) || candidateName.includes(query) || language.includes(query);
    });
  }

  protected get filteredInterviewsCount(): number {
    return this.filteredInterviews.length;
  }

  protected get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredInterviewsCount / this.pageSize));
  }

  protected get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  protected get pagedInterviews(): InterviewItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredInterviews.slice(start, end);
  }

  protected get listSummaryLabel(): string {
    if (this.hasActiveListFilters) {
      return `${this.filteredInterviewsCount} shown / ${this.interviews.length} total`;
    }

    return `${this.interviews.length} total`;
  }

  protected updateSearchQuery(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.currentPage = 1;
  }

  protected updateStatusFilter(event: Event): void {
    const input = event.target as HTMLSelectElement;
    this.selectedStatusFilter = input.value as InterviewStatusFilter;
    this.currentPage = 1;
  }

  protected updateLanguageFilter(event: Event): void {
    const input = event.target as HTMLSelectElement;
    this.selectedLanguageFilter = input.value as InterviewLanguageFilter;
    this.currentPage = 1;
  }

  protected resetListFilters(): void {
    this.searchQuery = '';
    this.selectedStatusFilter = 'all';
    this.selectedLanguageFilter = 'all';
    this.currentPage = 1;
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  protected goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  protected goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  protected getInterviewId(interview?: InterviewItem | null): string {
    return interview?._id || interview?.id || '';
  }

  protected getPendingDeleteTitle(): string {
    return this.pendingDeleteInterview?.title?.trim() || 'this interview';
  }

  protected getOwnerName(interview: InterviewItem): string {
    const owner = interview.owner;

    if (owner && typeof owner === 'object') {
      const ownerName = owner.fullName?.trim();
      if (ownerName) {
        return ownerName;
      }
    }

    return 'Interview owner';
  }

  protected getOwnerEmail(interview: InterviewItem): string | null {
    const owner = interview.owner;

    if (owner && typeof owner === 'object') {
      const ownerEmail = owner.email?.trim();
      return ownerEmail || null;
    }

    return null;
  }

  protected statusBadgeClass(status: string): string {
    if (status === 'completed') {
      return 'badge-success badge-outline';
    }

    if (status === 'in-progress') {
      return 'badge-warning badge-outline';
    }

    return 'badge-ghost';
  }

  protected canJoinInterview(interview: InterviewItem): boolean {
    return interview.status === 'in-progress';
  }

  protected getJoinButtonLabel(interview: InterviewItem): string {
    if (interview.status === 'pending') {
      return 'Waiting start';
    }

    if (interview.status === 'completed') {
      return 'Ended';
    }

    return 'Join room';
  }

  protected getJoinDisabledReason(interview: InterviewItem): string {
    if (interview.status === 'pending') {
      return 'Interviewer has not started this interview yet.';
    }

    if (interview.status === 'completed') {
      return 'This interview has already ended.';
    }

    return '';
  }

  protected canDeleteInterview(interview: InterviewItem): boolean {
    const currentUserId = this.authService.currentUser()?.id;

    if (!currentUserId) {
      return false;
    }

    const owner = interview.owner;

    if (typeof owner === 'string') {
      return owner === currentUserId;
    }

    if (owner && typeof owner === 'object') {
      return owner._id === currentUserId || owner.id === currentUserId;
    }

    return false;
  }

  protected deleteInterview(interview: InterviewItem): void {
    const interviewId = this.getInterviewId(interview);

    if (!interviewId || this.deletingInterviewId) {
      return;
    }

    this.pendingDeleteInterview = interview;
    this.deleteErrorMessage = null;
    this.deleteSuccessMessage = null;
    this.deleteInterviewModal?.nativeElement.showModal();
  }

  protected closeDeleteInterviewModal(): void {
    this.deleteInterviewModal?.nativeElement.close();
    this.pendingDeleteInterview = null;
  }

  protected confirmDeleteInterview(): void {
    const interviewId = this.getInterviewId(this.pendingDeleteInterview);

    if (!interviewId || this.deletingInterviewId) {
      return;
    }

    this.deletingInterviewId = interviewId;
    this.deleteErrorMessage = null;
    this.deleteSuccessMessage = null;

    this.interviewService.deleteInterview(interviewId).subscribe({
      next: () => {
        this.interviews = this.interviews.filter((item) => this.getInterviewId(item) !== interviewId);
        this.ensureValidCurrentPage();
        this.deleteSuccessMessage = 'Interview deleted successfully.';
        this.deletingInterviewId = null;
        this.closeDeleteInterviewModal();
      },
      error: (err) => {
        this.deleteErrorMessage = this.extractErrorMessage(err, 'Failed to delete interview.');
        this.deletingInterviewId = null;
        this.closeDeleteInterviewModal();
      }
    });
  }

  protected joinRoom(interview: InterviewItem): void {
    if (!this.canJoinInterview(interview)) {
      return;
    }

    const interviewId = this.getInterviewId(interview);

    if (!interviewId) {
      return;
    }

    this.router.navigate(['/interview', interviewId]);
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    const maybeHttpError = error as { error?: { message?: unknown } };
    const message = maybeHttpError?.error?.message;

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    return fallback;
  }

  private ensureValidCurrentPage(): void {
    const maxPage = Math.max(1, Math.ceil(this.filteredInterviewsCount / this.pageSize));
    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }
  }
}
