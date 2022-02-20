import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, pipe, throwError } from 'rxjs';
import { Individual, MessageType, User, UserAndAccessToken } from '../models';
import { MessagesService } from './messages.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _user: Observable<UserAndAccessToken | null> = of(null);
  public get user() { return this._user; }

  constructor(private http: HttpClient, private messages: MessagesService) { }

  /*public registerIndividual(email: string, password: string, about: string, firstName: string, lastName: string) {
    this.http.post<User>('localhost:3000/auth/register/indiv', model)
      .pipe(
        catchError(error => this.handleError(error, null)),
        user => this._user = user
      );
  }

  public registerChurch(model: ChurchUser) {
    this.http.post<ChurchUser>('localhost:3000/auth/register/church', model)
      .pipe(
        catchError(error => this.handleError(error, null)),
        user => this._user = user
      );
  }*/

  public loginUser(model: { email: string, password: string }) {
    return this.http.post<UserAndAccessToken>('http://localhost:3000/auth/login', model)
      .pipe(
        catchError(error => this.handleError(error, null)),
        pipe(user => this._user = user)
      );
  }

  private handleError<T>(error: HttpErrorResponse, returnValue: T) {
    if(error.status == 0) {
      this.messages.queueMessage({ 
        messageType: MessageType.Error, 
        message: error.message 
      });
    } else {
      this.messages.queueMessage({ 
        messageType: MessageType.Error, 
        message: "An error has occured. Please try again later."
      });
    }

    return of(returnValue);
  }
}
