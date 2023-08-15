import { Component, OnInit, Input, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, EMPTY } from 'rxjs';
import { MarketData } from 'src/app/interface/market-data';
import { ConfigService } from 'src/app/common/config.service'
import { Product } from 'src/app/interface/product';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FIRESTORE_REFERENCES } from 'src/app/core/firebase.module';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OptionChainComponent } from 'src/app/components/modals/option-chain';

declare var $: any;

@Component({
  selector: 'ow-main-trade-tab',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.css']
})
export class TradeComponent implements OnInit {

  @Input() currentTab: string = 'account-summary';
  @Input() currentTradeTab: string = 'by-product';
  @Input() currentProductListTab: string = 'product-list-option';

  SelectedFirestoreInstance: AngularFirestore;
  SelectedBroker: any;
  SelectedBrokerAccount: any;
  brokerTypes = [] as any;
  allBrokerAccounts = [] as any;
  brokerAccounts = [] as any;

  StockData$: Observable<MarketData>;

  isLoading: Boolean = false;
  
  // Post Order Confirmation Pop-Up
  OrderSuccessParameter: any;
  OrderRejectedParameter: any;
  StrategyOrderSuccessParameter: any;
  StrategyOrderRejectedParameter: any;

  AvailableBrokerAccounts = [] as any;

  placeOrderLastTradedPrice: any = 0;

  constructor(
    private router: Router,
    private auth: AngularFireAuth,
    private firestore: AngularFirestore,
    private configService: ConfigService,
    private modalService: NgbModal,
    @Inject(FIRESTORE_REFERENCES.TIGER_FIRESTORE) private readonly tigerFirestore: AngularFirestore,
    @Inject(FIRESTORE_REFERENCES.FUTU_FIRESTORE) private readonly futuFirestore: AngularFirestore,
    @Inject(FIRESTORE_REFERENCES.IB_FIRESTORE) private readonly ibFirestore: AngularFirestore,
  ) {
    this.StockData$ = EMPTY;

    // Post Order Confirmation Pop-Up
    this.OrderSuccessParameter = {
      Action: "",
      Quantity: 0,
      Symbol: "",
      OrderType: ""
    };
    this.OrderRejectedParameter = {
      Action: "",
      Quantity: 0,
      Symbol: "",
      OrderType: "",
      RejectReason: ""
    };
    this.StrategyOrderSuccessParameter = {
      Strategy: "",
      Underlying: ""
    };
    this.StrategyOrderRejectedParameter = {
      Strategy: "",
      Underlying: "",
      RejectReason: ""
    };

    this.SelectedFirestoreInstance = this.firestore;
  }

  ngOnInit(): void {
    this.initBrokerAccounts();
  }

  seeMyOrders(){
    $('#OrderCreated').modal('hide');
    $('#OrderSuccess').modal('hide');
    this.currentTab = "active-orders";
  }

  searchProductTrackByFn(item: Product) {
    return item.ProductId;
  }
  
  onAccountChanged(accountId: string) {

  }

  onBrokerTypeChanged(broker: any) {
    this.brokerAccounts = this.allBrokerAccounts.filter(function (x: any) {
      return x.brokerType === broker.name;
    })
    this.SelectedBrokerAccount = this.brokerAccounts[0];
    // switch (this.SelectedBrokerAccount.brokerType) {
    //   case 'Tiger':
    //     this.SelectedFirestoreInstance = this.SelectedBrokerAccount.brokerType;
    //     break;
    //   case 'FUTU':
    //     this.SelectedFirestoreInstance = this.futuFirestore;
    //     break;
    // }
  }

  async initBrokerAccounts(){
    this.brokerTypes = [
      {
        id: 1,
        name: 'Interactive Brokers',
        image: '//am708403.blob.core.windows.net/images/optionpi/img/Interactive.png',
        link: '',
      },
      {
        id: 2,
        name: 'Tiger',
        image: '//am708403.blob.core.windows.net/images/optionpi/img/tiger.png',
        link: 'https://www.tigersecurities.com/login?invite=QUANT&ne=https://quant.itigerup.com/developer#developer',
      },
      // {
      //   id: 3,
      //   name: 'FUTU',
      //   image: '//am708403.blob.core.windows.net/images/optionpi/img/futu.png',
      //   link: '',
      // },
      
    ]
    
    this.SelectedBroker = this.brokerTypes[0];
    this.allBrokerAccounts = [];
    if (localStorage.getItem('accountSelections') !== null) {
      this.allBrokerAccounts = JSON.parse(localStorage.getItem('accountSelections') || '[]');
    }
    this.brokerAccounts = this.allBrokerAccounts.filter(function (x: any) {
      return x.brokerType === 'Interactive Brokers';
    })
    console.log( this.allBrokerAccounts)
    this.AvailableBrokerAccounts = this.allBrokerAccounts.filter(function (x: any) {
      
      return x.brokerType != "FUTU" ;
      // return x.brokerType === 'Tiger';
    })

    this.SelectedBrokerAccount = this.brokerAccounts[0];
  }

  setTab(tabName: string){
    this.currentTab = tabName;
  }

  confirmLiquidateAll(): void {
    console.log("Executing Liquidate All Operation");
  }

  preselectAccount(): void {
    const modalRef = this.modalService.open(OptionChainComponent, { size: 'xl'});
    modalRef.componentInstance.SelectedBrokerAccount = this.SelectedBrokerAccount;
  }
}