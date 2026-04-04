import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
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

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly interviewService = inject(InterviewService);
  private readonly router = inject(Router);

  protected interviews: InterviewItem[] = [];
  protected isLoading = true;
  protected errorMessage: string | null = null;
  protected readonly skeletonCards = [1, 2, 3, 4];

  ngOnInit(): void {
    this.loadInterviews();
  }

  protected loadInterviews(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.interviewService.getMyInterviews().subscribe({
      next: (res: any) => {
        const mapped = Array.isArray(res?.data) ? res.data : [];
        this.interviews = mapped;
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

  protected getInterviewId(interview: InterviewItem): string {
    return interview._id || interview.id || '';
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

  protected joinRoom(interview: InterviewItem): void {
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
}
