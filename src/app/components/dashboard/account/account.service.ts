import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from 'src/app/common/config.service'
import { catchError, map } from 'rxjs/operators';
import { HandleError, HttpErrorHandler } from 'src/app/common/http-error-handler.service';


@Injectable({
    providedIn: 'root'
})
export class AccountService {
    private baseUrl = '';
    private serverApiKey = '';
    private accessToken = '';
    private handleError: HandleError;

    constructor(private http: HttpClient, private configService: ConfigService,
        httpErrorHandler: HttpErrorHandler) {
        this.handleError = httpErrorHandler.createHandleError('AccountService');
    }

    setupFutuClient(requestObj: object):Observable<string> {
        let config = this.configService.readConfig();
        if (config) {
            this.baseUrl = config.apiUrl;
            this.serverApiKey = config.serverApiKey;
        }
        let userCredentialString = localStorage.getItem('user-credential');
        if (userCredentialString) {
            var userCredential = JSON.parse(userCredentialString);
            this.accessToken = userCredential.access_token;
        }
        return this.http.post<string>(this.baseUrl + "/optionapi/v1/Account/AddFutuAccount", requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        })
            .pipe(
                catchError(this.handleError<string>('Account/AddFutuAccount'))
            );
    }

    turnOnVM() {
        let config = this.configService.readConfig();
        if (config) {
            this.baseUrl = config.apiUrl;
            this.serverApiKey = config.serverApiKey;
        }
        let userCredentialString = localStorage.getItem('user-credential');
        if (userCredentialString) {
            var userCredential = JSON.parse(userCredentialString);
            this.accessToken = userCredential.access_token;
        }
        this.http.post(this.baseUrl + "/autoinvestapi/v1/AwsVmManager/CreateVmForAmUser", null, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        })
            .pipe(
                catchError(this.handleError('autoinvestapi/turnOnVM'))
            );
    }

    getGuacamoleCredentials():Observable<any> {
        let config = this.configService.readConfig();
        if (config) {
            this.baseUrl = config.apiUrl;
            this.serverApiKey = config.serverApiKey;
        }
        let userCredentialString = localStorage.getItem('user-credential');
        if (userCredentialString) {
            var userCredential = JSON.parse(userCredentialString);
            this.accessToken = userCredential.access_token;
        }
        return this.http.get<any>(this.baseUrl + "/identityapi/Authentication/GetGuacamoleCredentials", {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        })
            .pipe(
                catchError(this.handleError<any>('/Authentication/GetGuacamoleCredentials'))
            );
    }

    getGuacamoleToken(requestObj: string):Observable<any> {
        let config = this.configService.readConfig();
        if (config) {
            this.baseUrl = config.apiUrl;
            this.serverApiKey = config.serverApiKey;
        }
        let userCredentialString = localStorage.getItem('user-credential');
        if (userCredentialString) {
            var userCredential = JSON.parse(userCredentialString);
            this.accessToken = userCredential.access_token;
        }
        return this.http.post<any>(this.baseUrl + "/guac/api/tokens",requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/x-www-form-urlencoded',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        })
            .pipe(
                catchError(this.handleError<any>('/Authentication/GetGuacamoleCredentials'))
            );
    }

}