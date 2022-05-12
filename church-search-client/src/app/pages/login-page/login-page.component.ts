import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ValidationErrors } from '@angular/forms';
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

  /**
   * The FormGroup for the login input
   */
  public formGroup = new FormGroup({
    email: new FormControl('', {
      validators: [
        Validators.required,
        Validators.email
      ],
      updateOn: 'blur',
    }),
    password: new FormControl('', {
      validators: [
        Validators.required,
      ],
      updateOn: 'blur'
    }),
  });

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
  }

  onSubmit() {
    // Determine if an error in the input validation was found
    let errorFound = false;
    for (let k in this.formGroup.controls) {
      this.formGroup.controls[k].updateValueAndValidity();
      if (this.formGroup.controls[k].errors != null)
        errorFound = true;
    }

    if (errorFound) return;

    this.error = undefined;
    this.loading = true;

    this.authService.loginUser(this.formGroup.value).subscribe(message => {
      this.loading = false;
      if (message != null) {
        this.error = message;
      } else {
        this.router.navigate([".."]);
      }
    });
  }

  get emailInvalid() { 
    const email = this.formGroup.get('email')!;
    return email.invalid && email.touched;
  }
  get passwordInvalid() { 
    const password = this.formGroup.get('password')!; 
    return password.invalid && password.touched;
  }
}
