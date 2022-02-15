import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-register-form',
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.css']
})
export class RegisterFormComponent implements OnInit {
  
  public emailControl = new FormControl("");
  public passwordControl = new FormControl("");
  public confirmPasswordControl = new FormControl("");
  public aboutControl = new FormControl("");

  public showPassword = false;
  public userType?: string;

  constructor() { }

  ngOnInit(): void {
  }

  public onBackToLoginPressed() {
  }

}
