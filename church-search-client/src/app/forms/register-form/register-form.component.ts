import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-register-form',
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.css']
})
export class RegisterFormComponent implements OnInit {
 
  public formGroup = new FormGroup({
    email: new FormControl(""),
    password: new FormControl(""),
    confirmPassword: new FormControl(""),
    about: new FormControl(""),
  });

  public showPassword = false;
  public userType?: string;

  public userInfo = {};

  constructor() { }

  ngOnInit(): void {
  }

  public onSubmit() {
    console.log({
      user: this.formGroup.value,
      indiv: this.userType == "individual" ? this.userInfo : undefined,
      church: this.userType == "church" ? this.userInfo : undefined,
    });
  }

}
