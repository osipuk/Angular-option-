import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from 'src/app/common/config.service'
import { catchError, map } from 'rxjs/operators';
import { HandleError, HttpErrorHandler } from 'src/app/common/http-error-handler.service';
import { ComputeLegState } from 'src/app/interface/compute-leg-state'; 
import { CalculatePLRequest } from '../interface/calculate-pl-request';
import { ComputeMaxPlRequest } from '../interface/compute-max-pl-request';
import { MaxProfitLossResult } from '../interface/max-profit-loss-result';
import { ComputePayOffMetricsRequest } from '../interface/compute-metrics-for-analyzePayoff';
import { ComputeAnalyzePayoffResult } from '../interface/compute-analyzePayoff-result';
import { ComputeAnalyzePayoffModalValuationResult } from '../interface/compute-analyzeModalValuation-result';
import { CalculatePayoffRequest } from '../interface/calculate-payoff-request';
import { CalculateModelValuationRequest } from '../interface/calculate-modelValuation-request';
import { CalculateModelValuationResult } from '../interface/calculate-modelValuation-result';

@Injectable({
    providedIn: 'root'
})
export class CalculatorService {
    private baseUrl: string;
    private serverApiKey: string;
    private accessToken: string;
    private handleError: HandleError;

    constructor(private http: HttpClient, private configService: ConfigService,
        httpErrorHandler: HttpErrorHandler) {        
        this.handleError = httpErrorHandler.createHandleError('TradeService');
        this.baseUrl = '';
        this.serverApiKey = '';
        this.accessToken = '';
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
    }

    /** POST: Place Stock Order */
    getCurrentState(requestObj: ComputeMaxPlRequest): Observable<ComputeLegState> {
        return this.http.post<ComputeLegState>(this.baseUrl + "/optionapi/v1/Calculator/ComputeCurrentState", requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        }).pipe(
            catchError(this.handleError<ComputeLegState>('/Calculator/ComputeCurrentState'))
        );
    }

    /** POST: Get Metrics For Analyze Payoff */
    getMetricsForAnalyzePayoff(requestObj: ComputePayOffMetricsRequest): Observable<ComputeAnalyzePayoffResult> {
        return this.http.post<ComputeAnalyzePayoffResult>(this.baseUrl + "/optionapi/v1/Calculator/GetMetricsForAnalyzePayoff", requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        }).pipe(
            catchError(this.handleError<ComputeAnalyzePayoffResult>('/Calculator/GetMetricsForAnalyzePayoff'))
        );
    }

    /** POST: Get Metrics For Analyze ModalValuation */
    getMetricsForAnalyzeModalValuation(requestObj: ComputePayOffMetricsRequest): Observable<ComputeAnalyzePayoffModalValuationResult> {
        return this.http.post<ComputeAnalyzePayoffResult>(this.baseUrl + "/optionapi/v1/Calculator/GetMetricsForAnalyzeModelValuation", requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        }).pipe(
            catchError(this.handleError<ComputeAnalyzePayoffResult>('/Calculator/GetMetricsForAnalyzeModelValuation'))
        );
    }

    getMaxProfitLoss(requestObj: ComputeMaxPlRequest): Observable<MaxProfitLossResult> {
        return this.http.post<MaxProfitLossResult>(this.baseUrl + "/optionapi/v1/Calculator/ComputeMaxProfitLoss", requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        }).pipe(
            catchError(this.handleError<MaxProfitLossResult>('/Calculator/ComputeMaxProfitLoss'))
        );
    }

    calculateProfit(requestObj: CalculatePLRequest): Observable<number> {
        return this.http.post<number>(this.baseUrl + "/optionapi/v1/Calculator/CalculatePL", requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        }).pipe(
            catchError(this.handleError<number>('/Calculator/CalculatePL'))
        );
    }

    calculatePayoff(requestObj: CalculatePayoffRequest): Observable<number> {
        return this.http.post<number>(this.baseUrl + "/optionapi/v1/Calculator/ComputePayoff", requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        }).pipe(
            catchError(this.handleError<number>('/Calculator/ComputePayoff'))
        );
    }

    calculateModelValuation(requestObj: CalculateModelValuationRequest): Observable<CalculateModelValuationResult> {
        return this.http.post<CalculateModelValuationResult>(this.baseUrl + "/optionapi/v1/Calculator/ComputeModelValuation", requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        }).pipe(
            catchError(this.handleError<CalculateModelValuationResult>('/Calculator/ComputeModelValuation'))
        );
    }
}
