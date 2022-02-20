import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BannerMessage } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {

  private _next: Observable<BannerMessage | null> = of(null);
  public get next() { return this._next; }

  constructor() { 
  }

  public queueMessage(message: BannerMessage) {
    console.log(message.message);
    this._next = of(message);
  }
}
