import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginData, UserType } from 'src/app/models';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit {

  public error?: string;
  public loading = false;

  public formGroup = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
  }

  onSubmit() {
    this.error = undefined;
    this.loading = true;

    this.authService.loginUser(this.formGroup.value).subscribe(message => {
      this.loading = false;
      if(message != null) {
        this.error = message;
      } else {
        this.router.navigate([".."]);
      }
    });
  }

}
