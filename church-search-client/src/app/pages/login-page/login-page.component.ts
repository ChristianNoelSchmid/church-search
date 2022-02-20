import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { LoginData, UserType } from 'src/app/models';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit {

  public message?: string;

  public formGroup = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
  }

  onSubmit() {
    this.authService.loginUser(this.formGroup.value).subscribe(() =>
      this.authService.user.subscribe(
        user => { 
          if(user != null) {
            this.message = `Hello, ${user?.userType == UserType.Individual ? user?.indiv.firstName : user?.church.name }!`;
          }
        }
    ));
  }

}
