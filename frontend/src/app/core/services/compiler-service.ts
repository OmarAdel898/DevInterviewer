import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CompilerService {
  private http=inject(HttpClient);
  private url:string='http://127.0.0.1:3000/compile';
  compileCode(language: string, code: string, interviewId?: string):Observable<any> {
    return this.http.post(`${this.url}/run`, { language, code, interviewId });
  }
} 
