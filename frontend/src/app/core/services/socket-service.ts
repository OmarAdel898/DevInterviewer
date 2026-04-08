import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { io, Socket } from 'socket.io-client';
@Injectable({
  providedIn: 'root',
})
export class SocketService implements OnDestroy{
  private socket: Socket;
  private readonly url: string = 'http://127.0.0.1:3000'; 
  private activeInterviewId: string | null = null;

  constructor() {
    this.socket = io(this.url, {
      withCredentials: true,
      auth: (callback) => {
        callback({ token: localStorage.getItem('accessToken') || '' });
      },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to Real-time Server:', this.socket.id);

      if (this.activeInterviewId) {
        this.socket.emit('join-interview', this.activeInterviewId);
      }
    });
  }

  joinInterview(interviewId: string): void {
    if (!interviewId) {
      return;
    }

    this.activeInterviewId = interviewId;

    // Keep handshake auth fresh in case token changed after login/refresh.
    this.socket.auth = { token: localStorage.getItem('accessToken') || '' };

    if (this.socket.connected) {
      this.socket.emit('join-interview', interviewId);
    } else {
      this.socket.connect();
    }
  }

  emit(event: string, data: any) {
    this.socket.emit(event, data);
  }

  listen(eventName: string): Observable<any> {
    return new Observable((subscriber) => {
      const handler = (data: any) => {
        subscriber.next(data);
      };

      this.socket.on(eventName, handler);

      return () => {
        this.socket.off(eventName, handler);
      };
    })
  }
  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}
