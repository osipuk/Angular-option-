import { Component, OnInit, Input, OnChanges, SimpleChanges, Inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError, Observable, EMPTY } from 'rxjs';

import { MainService } from './main.service';

import { MarketData } from 'src/app/interface/market-data';

@Component({
  selector: 'ow-main-tab',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, OnChanges  {
  @Input() uid!: string;
  @Input() tabValue: string;

  currentTab = 'screener';
  currentSubTab = '';
  currentRoute: any = '';
  
  tabObj: any = {
    currentTab: '',
    currentSubTab: '',
  }

  constructor(
    private mainService: MainService,
    private router: Router,
  ) {
    this.currentRoute = this.router.url;
    this.tabValue = '';
  }

  async ngOnInit(): Promise<void> {
    this.setTab('screener');
    //this.initMainTab(this.uid);
    // Initialize broker accounts here    
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tabValue']) {
      this.setTab(this.tabValue);
    }
  }

  setTab(tabName: string){
    this.currentTab = tabName;
    if(this.currentTab === 'trade'){
      this.currentSubTab = 'account-summary';
    }
  }

  redirectToSubTab(tabObj: any){
    this.currentTab = tabObj.tabName;
    this.currentSubTab = tabObj.subTabName;
  }

  initMainTab(uid: string){
    this.mainService.getMainTab(uid);
    // this.mainService.getMainTab(uid).snapshotChanges().pipe(
    //   map(changes =>
    //     changes.map(c =>
    //       ({ id: c.payload.doc.id, value: c.payload.doc.data() })
    //     )
    //   )
    // ).subscribe(data => {
    //   console.log("data: ", data);
    //   this.data = data;
    // });
  }

  private handleError(error: HttpErrorResponse) {
    console.log("error", error);
    if (error.status === 500) {
      // A client-side or network error occurred. Handle it accordingly.
      alert('Internal server error');
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      alert(error);
    }
    // Return an observable with a user-facing error message.
    return throwError(error);
  }

}