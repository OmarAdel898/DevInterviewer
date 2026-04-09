import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class InterviewService {
  private apiUrl = 'http://127.0.0.1:3000/interviews';
  private http = inject(HttpClient);

  getMyInterviews():Observable<any>{
    return this.http.get(`${this.apiUrl}`);
  }

  createInterview(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data);
  }

  getInterviewById(id:string):Observable<any>{
    return this.http.get(`${this.apiUrl}/${id}`);
  }
  updateInterviewCode(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, data);
  }

  startInterview(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/start`, {});
  }

  endInterview(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/end`, {});
  }

  assignProblems(id: string, problemIds: string[]): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/problems`, { problemIds });
  }

  removeAssignedProblem(id: string, problemId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/problems/${problemId}`);
  }

  getInterviewProblems(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/problems`);
  }

  deleteInterview(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
