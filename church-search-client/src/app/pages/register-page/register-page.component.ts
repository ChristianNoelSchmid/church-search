import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { RegisterData } from 'src/app/models';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.css']
})
export class RegisterPageComponent implements OnInit {

  public error?: string;
  public loading = false;
  
  public formGroup = new FormGroup({
    email: new FormControl(""),
    password: new FormControl(""),
    confirmPassword: new FormControl(""),
    aboutMe: new FormControl(""),
  });

  public showPassword = false;
  public userType?: string;

  public userInfo = {};

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
  }

  public onSubmit() {
    this.error = undefined;
    this.loading = true;

    const data = {
      user: this.formGroup.value,
      indiv: this.userType == "individual" ? this.userInfo : undefined,
      church: this.userType == "church" ? this.userInfo : undefined,
    } as RegisterData;

    if(this.userType == "individual") {
      this.authService.registerIndividual(data).subscribe(
        msg => { 
          if(msg != null) this.error = msg; 
          this.loading = false;
        }
      );
    } else {
      this.authService.registerChurch(data).subscribe(
        msg => { 
          if(msg != null) this.error = msg; 
          this.loading = false;
        }
      );
    }
  }
}
