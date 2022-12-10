import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { NgToastService } from 'ng-angular-popup';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  state :string = '';

  stateChange: Subject<string> = new Subject<string>();

  constructor(private spinner: NgxSpinnerService,
              private toast: NgToastService) {
    this.stateChange.subscribe((s)=>{
      this.state = s;
      if(s === ''){
        this.spinner.hide();
      }else{
        this.spinner.show();
      }
    });
  }

  setState(newState:string){
    this.stateChange.next(newState);
  }

  handleError(msg:string){
    //duration fixed in node module
    this.toast.error({detail:"Error",summary:msg,sticky:false,position:'tr', duration:"5000"});
    this.setState('');
  }

  showSuccess() {
    this.toast.success({detail:"Success!",summary:'Your images are sorted.',sticky:false,position:'tr', duration:"5000"});
    this.setState('');
  }
}
