import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css']
})
export class LoginFormComponent implements OnInit {

  public emailControl = new FormControl('');
  public passwordControl = new FormControl('');

  constructor() { }

  ngOnInit(): void {
  }
}
