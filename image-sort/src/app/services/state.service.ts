import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { NgToastService } from 'ng-angular-popup';

@Injectable({
  providedIn: 'root'
})
//service for handling loading states and errors
export class StateService {

  state :string = '';
  stateChange: Subject<string> = new Subject<string>();

  constructor(private spinner: NgxSpinnerService,
              private toast: NgToastService) {
    //show loading overlay based on state change           
    this.stateChange.subscribe((s)=>{
      this.state = s;
      if(s === ''){
        this.spinner.hide();
      }else{
        this.spinner.show();
      }
    });
  }
  //method for changing the state
  setState(newState:string){
    this.stateChange.next(newState);
  }

  //method for showing error messages
  handleError(msg:string){
    this.toast.error({detail:"Error",summary:msg,sticky:false,position:'tr', duration:"5000"});
    this.setState('');
  }

  //method for showing success messages
  showSuccess() {
    this.toast.success({detail:"Success!",summary:'Your images are sorted.',sticky:false,position:'tr', duration:"5000"});
    this.setState('');
  }
}
