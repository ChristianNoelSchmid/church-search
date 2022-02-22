import { Component, OnInit } from '@angular/core';
import { UserType } from '../models';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  public loggedIn = false;
  public message: string = "Account";
  public sidenavOpened: boolean = false;
  public loading: boolean = false;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.user.subscribe(user => {
      if(user == null) 
        this.message = "Account";
      else {
        this.loggedIn = true;
        if(user.userType == UserType.Church) 
          this.message = `Hello ${user.church.name}!`;
        else 
          this.message = `Hello ${user.indiv.firstName}!`
      }
    });
  }

  logout() {
    this.loading = true;
    this.authService.logoutUser().subscribe(() => {
      this.loggedIn = false;
      this.loading = false;
    });
  }
}
