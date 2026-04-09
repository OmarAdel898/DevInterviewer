import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Problem } from '../models/problem.model';

@Injectable({
  providedIn: 'root',
})
export class ProblemService {
  private apiUrl = 'http://127.0.0.1:3000/problems';
  private http = inject(HttpClient);

  getMyProblems(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  getProblemById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createProblem(payload: Partial<Problem>): Observable<any> {
    return this.http.post(`${this.apiUrl}`, payload);
  }

  updateProblem(id: string, payload: Partial<Problem>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, payload);
  }

  deleteProblem(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
