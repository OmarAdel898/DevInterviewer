import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { io, Socket } from 'socket.io-client';
@Injectable({
  providedIn: 'root',
})
export class SocketService implements OnDestroy{
  private socket: Socket;
  private readonly url: string = 'http://127.0.0.1:3000'; 

  constructor() {
    this.socket = io(this.url, {
      withCredentials: true,
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to Real-time Server:', this.socket.id);
    });
  }

  emit(event: string, data: any) {
    this.socket.emit(event, data);
  }

  listen(eventName: string): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data) => {
        subscriber.next(data);
      });
    })
  }
  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}
