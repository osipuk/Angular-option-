import { Component, OnInit, Input, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, Subject, EMPTY, concat, of } from 'rxjs';
import { debounceTime, delay, switchMap, tap, catchError, map, share, take, filter, distinctUntilChanged } from 'rxjs/operators';
import { ProductService } from 'src/app/_service/product.service';
import { Product } from 'src/app/interface/product';
import { EventEmitter, Output } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as $ from 'jquery';
declare var window: any;
 

const Site_URL = environment.Site_URL;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  @Input() bradcrumb!: any;
  Products$: Observable<Product[]>;
  ProductInput$: Subject<string>;
  ProductSearchLoading: boolean;
  SelectedProduct?: Product;
  selectedTab:string = 'screener';
  MenuClicked:boolean = false;
  algoWinnerCounter : number = 0;
  token : any ;
  @Output() tabSelected: EventEmitter<string> = new EventEmitter<string>();

  constructor(
    private router: Router,
    private auth: AngularFireAuth,
    private productService: ProductService,
    private elementRef: ElementRef,
  ) {
    this.ProductInput$ = new Subject<string>();
    this.ProductSearchLoading = false;
    this.SelectedProduct = undefined;
    this.Products$ = this.ProductInput$.pipe(
      filter(res => {
        return res !== null && res.length >= 1
      }),
      distinctUntilChanged(),
      debounceTime(500),
      tap(() => this.ProductSearchLoading = true),
      switchMap(term => {
        return this.productService.searchProduct({
          Markets: ["US"],
          Keyword: term
        }).pipe(
          catchError(() => of([])), // empty list on error
          tap(() => this.ProductSearchLoading = false)
        )
      })
    );
  }

  displayName = '' as any;

  selectTab(tab: string) {
    this.tabSelected.emit(tab);
    $('.mobile-menubar').removeClass('display_block');
  }

  sidebar_show(): void {
    // alert("hello world");
    $('.LftMain').toggleClass('display_custom');
    $('.RgtMain').toggleClass('display_width');
  }

  hamburgerDropdown() {
    $('.mobile-menubar').toggleClass('display_block');
    console.log("hamburger clicked");
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    const mobileMenubar = this.elementRef.nativeElement.querySelector('.mobile-menubar');
    const hamburgerButton = this.elementRef.nativeElement.querySelector('.hamburger-button');
    const hamburgerMenuBar = this.elementRef.nativeElement.querySelector('.hamburger-menubar');
    
    if(target != mobileMenubar && target != hamburgerButton && target != hamburgerMenuBar && !mobileMenubar.contains(target)){
      $('.mobile-menubar').removeClass('display_block');
    }
  }

  logoutUser(): void {
    localStorage.removeItem('firebase-uid');
    localStorage.removeItem('displayname');
    localStorage.removeItem('user-credential');
    this.router.navigate(['/']);
  }

  searchProductTrackByFn(item: Product) {
    return item.ProductId;
  }
  
  onProductSelected(item: Product) {
    let algoWinnerAddress=`${Site_URL}/optionpi#/product/US/${item.Symbol}`;
    window.open(algoWinnerAddress,'_blank');
    // this.algoWinnerCounter++;
    // this.token = localStorage.getItem('user-credential');
    // // console.log(this.token.access_token,'dddd')
    // let token_val = JSON.parse(this.token).access_token;
    // console.log(token_val,'token_val');
    // const  newTab : any = window.open('', '_blank');
    // newTab.document.write('Connecting to AlgoWinner...');
    // //use iframe to pass token to algo winner
    // var iframe = document.createElement('iframe');
    // iframe.setAttribute('src', algoWinnerAddress + "/token");
    // iframe.setAttribute('id', 'redirect_iframe_new' + this.algoWinnerCounter);
    // iframe.style.width = 0 + 'px';
    // iframe.style.height = 0 + 'px';
    // document.body.appendChild(iframe);
    // let iframeEl : any = document.getElementById('redirect_iframe_new' + this.algoWinnerCounter);
    // window.addEventListener("message",
    //     function () {
    //       // if (event.data === "token_set" && event.source === iframeEl.contentWindow && event.origin === this.algoWinnerAddress) {

    //             if (newTab) {
    //                 newTab.location.href = algoWinnerAddress;
    //                 if (iframeEl) {
    //                     iframeEl.parentNode.removeChild(iframeEl);
    //                 }
    //             }
    //       // }
    //     }, false);
    // iframeEl.onload = function () {
    //     var iframeWin = iframeEl.contentWindow;
    //     iframeWin.postMessage(token_val, "*");
    // }
  }
  // goToAlgoWinnerNewTab(url:any){
    
  // }
 

  ngOnInit(): void {
    this.displayName = (localStorage.getItem('displayname') !== null ? localStorage.getItem('displayname') : '');
  }
}



 