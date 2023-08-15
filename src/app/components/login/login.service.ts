import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorHandler, HandleError } from 'src/app/common/http-error-handler.service';

import { ConfigService } from 'src/app/common/config.service';
import { UserProfile } from 'src/app/interface/user-profile';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private baseUrl: string;
  private handleError: HandleError;

  constructor(
    private http: HttpClient,
    httpErrorHandler: HttpErrorHandler,
    private configService: ConfigService) {
      this.baseUrl = '';
      let config = this.configService.readConfig();
      if (config) {
        this.baseUrl = config.apiUrl;
      }

      this.handleError = httpErrorHandler.createHandleError('LoginService');
  }

  getUserProfile(accessToken: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.baseUrl + "/userinfoapi/v1/UserInfo/UserInfo", {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        //'ApiKey': this.serverApiKey,
        'Authorization': 'Bearer ' + accessToken
      })
    })
    .pipe(
      catchError(this.handleError<UserProfile>('GetUserProfile'))
    );
  }  
}
