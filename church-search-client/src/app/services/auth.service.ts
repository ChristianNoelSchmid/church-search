import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, pipe, tap, throwError } from 'rxjs';
import { LoginData, MessageType, UserAndAccessToken, RegisterData } from '../models';
import { MessagesService } from './messages.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _user: Observable<UserAndAccessToken | null> = of(null);
  public get user() { return this._user; }

  constructor(private http: HttpClient, private messagesService: MessagesService) { }

  public registerIndividual(data: RegisterData): Observable<string | null> {
    console.log(data);
    return this.http.post<string | null>('http://localhost:3000/users/create/indiv', data)
      .pipe(
        map(() => null),
        catchError((error: HttpErrorResponse) => {
          if(error.status == 400) return of(error.error);
          return this.handleError(error, null);
        }),
      );
  }

  public registerChurch(model: RegisterData): Observable<string | null> {
    return this.http.post<string | null>('http://localhost:3000/users/create/church', model)
      .pipe(
        map(() => null),
        catchError((error: HttpErrorResponse) => {
          if(error.status == 400) return of(error.error);
          return this.handleError(error, null)
        }),
      );
  }

  public loginUser(data: LoginData): Observable<string | null> {
    return this.http.post<UserAndAccessToken>('http://localhost:3000/auth/login', data)
      .pipe(
        tap(user => this._user = of(user)),
        // If there was no Error, map to null
        map(_ => null),
        catchError((error: HttpErrorResponse) => {
            if(error.status == 400) return of(error.error);
            else return this.handleError(error, null);
          }
        ),
      );
  }

  private handleError<T>(error: HttpErrorResponse, returnValue: T) {
    if(error.status == 0) {
      this.messagesService.queueMessage({ 
        messageType: MessageType.Error, 
        message: error.message 
      });
    } else {
      this.messagesService.queueMessage({ 
        messageType: MessageType.Error, 
        message: "An error has occured. Please try again later."
      });
    }

    return of(returnValue);
  }
}
