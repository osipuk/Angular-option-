import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';

import { AuthGuard } from 'src/app/_service/auth-guard.service';
import { environment } from 'src/environments/environment';
const Site_URL = environment.Site_URL;
declare var window: any;

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SideBarComponent implements OnInit {
  currentRoute: string;
  algoWinnerCounter : number = 0;
  token_val : any ;
  iframeEl :any;
  constructor(private router: Router, private _authGuard: AuthGuard,) { 
    this.currentRoute = this.router.url;
  }

  currentTab = 'main';
  //displayName = '' as any;

  setTab(tabName: string){
    this.currentTab = tabName;
    if(tabName == "chart"){
      const algoWinnerAddress=`https://stagingtrade.algomerchant.com/optionpi#/charts`;
      //  window.open(url,'_blank')
      this.algoWinnerCounter++;
      this.token_val = localStorage.getItem('user-credential');
      const token = JSON.parse(this.token_val).access_token;
      // const token="7HYwBgSpLdg7C6GezBE0XKCGfdHZBmPm0DWsByziJ4U";
      const newTab = window.open('', '_blank');
       newTab.document.write('Connecting to AlgoWinner...');
       console.log(token,'token')
       console.log(algoWinnerAddress,'algoWinnerAddress');
       //use iframe to pass token to algo winner
       const iframe = document.createElement('iframe');
       iframe.setAttribute('src', `${algoWinnerAddress}/token`);
       iframe.setAttribute('id', `redirect_iframe_new${this.algoWinnerCounter}`);
       iframe.style.width = 0 + 'px';
       iframe.style.height = 0 + 'px';
       document.body.appendChild(iframe);

       this.iframeEl = document.getElementById(`redirect_iframe_new${this.algoWinnerCounter}`);
       console.log(iframe,'iframe');
       console.log(this.iframeEl,'iframeEl')
       window.addEventListener("message",
            (event:any) => {
              //  if (event.data === "token_set" && event.source === iframeEl.contentWindow && event.origin === algoWinnerAddress) {
                   if (newTab) {
                    console.log("ppppppppp")
                       newTab.location.href = algoWinnerAddress;
                       if (this.iframeEl) {
                           this.iframeEl.parentNode?.removeChild(this.iframeEl);
                       }
                   }
              //  }
           }, false);

           
      //   iframeEl.addEventListener("load", () => {
      //       console.log("Iframe Loaded123456");
      //       const iframeWin = iframeEl.contentWindow;
      //       iframeWin.postMessage(token, algoWinnerAddress);
      // });
       this.iframeEl.onload =  () => {
        console.log("222222222222111111111111");
           const iframeWin = this.iframeEl.contentWindow as Window;
           iframeWin.postMessage(token, "*");
       }
    }
  }

  logoutUser(): void {
    this._authGuard.logout();
    this.router.navigate(['/']);
  }

  ngOnInit(): void {
    //this.displayName = (localStorage.getItem('displayname') !== null ? localStorage.getItem('displayname') : '');
  }

}