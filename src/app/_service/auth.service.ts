import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { combineLatest, Observable } from 'rxjs';
import { ConfigService } from 'src/app/common/config.service'
import { catchError, map, switchMap } from 'rxjs/operators';
import { HandleError, HttpErrorHandler } from 'src/app/common/http-error-handler.service';
import { ApiToken } from '../interface/api-token';
import { Login } from '../interface/login';
import { FirebaseToken } from '../interface/firebase-token';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
  private baseUrl: string;
  private serverApiKey: string;
  private handleError: HandleError;
  private secret: string;

  constructor(
    private http: HttpClient,
    httpErrorHandler: HttpErrorHandler,
    private configService: ConfigService) {
      this.baseUrl = '';
      this.serverApiKey = '';
      this.secret = '';
      let config = this.configService.readConfig();
      if (config) {
        this.baseUrl = config.apiUrl;
        this.serverApiKey = config.serverApiKey;
        this.secret = config.secret;
      }

      this.handleError = httpErrorHandler.createHandleError('AuthService');
  }

  /** POST: reset password */
  resetPassword(email: string): Observable<{}> {
    return this.http.post<{}>(this.baseUrl + "/autoinvestapi/v1/Connection/ResetPassword", {
      Email: email
    }, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'ApiKey': this.serverApiKey
      })
    })
      .pipe(
        catchError(this.handleError<{}>('reset password'))
      );
  }

  /** POST: login account */
  login(account: Login): Observable<ApiToken> {
    const formData = new URLSearchParams();
    formData.set('username', account.username );
    formData.set('password', account.password );
    formData.set('grant_type', 'password' );
    formData.set('scope', 'openid profile roles offline_access read write' );
    formData.set('client_id', 'am_webclient' );
    formData.set('client_secret', this.secret );

    return this.http.post<ApiToken>(this.baseUrl + "/identity/connect/token ", formData, {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    })
  }

  refreshToken(): void {
    var currentCred = localStorage.getItem('user-credential');
    if (currentCred) {
      var token = JSON.parse(currentCred);
      this.refreshTokenInternal(token).pipe(
        switchMap((result: ApiToken) => {
          const jsonData = JSON.stringify(result)
          localStorage.setItem('user-credential', jsonData);
          return combineLatest([
            this.getTigerFirebaseToken(result.access_token),
            this.getFutuFirebaseToken(result.access_token),
            this.getIbFirebaseToken(result.access_token),
          ]);
        })
      ).subscribe({
          next: ([tigerToken, futuToken, ibToken]) => {
              localStorage.setItem('tiger_access_token', tigerToken.Token);
              localStorage.setItem('futu_access_token', futuToken.Token);
              localStorage.setItem('ib_access_token', ibToken.Token);
          },
          error: error => {
            this.handleError<{}>('Refresh token failed, ' + error.error.error_description);
          }        
      });
    }
    console.log("Token refresh successfully!");
  }

  refreshTokenInternal(apiToken: ApiToken): Observable<ApiToken> {
    const formData = new URLSearchParams();
    formData.set('client_id', 'am_webclient' );
    formData.set('client_secret', this.secret );
    formData.set('grant_type', 'refresh_token' );
    formData.set('refresh_token', apiToken.refresh_token );

    return this.http.post<ApiToken>(this.baseUrl + "/identity/connect/token ", formData, {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    })
  }

  /** POST: get custom firebase token from server */
  getTigerFirebaseToken(accessToken: string): Observable<FirebaseToken> {
    return this.http.post<FirebaseToken>(this.baseUrl + "/optionapi/v1/Authentication/CreateTigerOptionPiToken", {}, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        //'ApiKey': this.serverApiKey,
        'Authorization': 'Bearer ' + accessToken
      })
    })
      .pipe(
        catchError(this.handleError<FirebaseToken>('tiger login account'))
      );
  }

  /** POST: get custom firebase token from server */
  getFutuFirebaseToken(accessToken: string): Observable<FirebaseToken> {
    return this.http.post<FirebaseToken>(this.baseUrl + "/optionapi/v1/Authentication/CreateFutuOptionPiToken", {}, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        //'ApiKey': this.serverApiKey,
        'Authorization': 'Bearer ' + accessToken
      })
    })
      .pipe(
        catchError(this.handleError<FirebaseToken>('futu login account'))
      );
  }

  /** POST: get custom firebase token from server */
  getIbFirebaseToken(accessToken: string): Observable<FirebaseToken> {
    return this.http.post<FirebaseToken>(this.baseUrl + "/optionapi/v1/Authentication/CreateIbOptionPiToken", {}, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        //'ApiKey': this.serverApiKey,
        'Authorization': 'Bearer ' + accessToken
      })
    })
      .pipe(
        catchError(this.handleError<FirebaseToken>('ib login account'))
      );
  }
}
