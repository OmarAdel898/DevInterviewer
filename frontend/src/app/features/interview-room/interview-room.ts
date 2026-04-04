import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SocketService } from '../../core/services/socket-service';
import { InterviewService } from '../../core/services/interview-service';
import { CompilerService } from '../../core/services/compiler-service';
@Component({
  selector: 'app-interview-room',
  imports: [],
  templateUrl: './interview-room.html',
  styleUrl: './interview-room.css',
})
export class InterviewRoom implements OnInit{
  private route=inject(ActivatedRoute);
  private socketService = inject(SocketService);
  private interview=inject(InterviewService);
  private compiler=inject(CompilerService);
  interviewId='';
  code=signal('//loading code...');
  output=signal('');
  ngOnInit(): void {
    this.interviewId=this.route.snapshot.params['id'];
    this.socketService.emit('join-interview',this.interviewId);
    this.socketService.listen('receive-code').subscribe((newCode: string) => {
      this.code.set(newCode);
    });
    this.interview.getInterviewById(this.interviewId).subscribe({
      next:(res)=>{
        this.code.set(res.data.code);
      }
    })
  }
  run(){
    this.compiler.compileCode('javascript',this.code()).subscribe({
      next:(res)=>{
        this.output.set(res.output);
      }
    });
  }
  onCodeUpdate(newCode: string) {
    this.code.set(newCode);
    this.socketService.emit('code-change', { 
      interviewId: this.interviewId, 
      code: newCode 
    });
  }

  onSave(){
    this.interview.updateInterviewCode(this.interviewId,{code:this.code()}).subscribe({
      next:(res)=>{
        console.log('Code saved successfully');
      }
    });
  }

}
