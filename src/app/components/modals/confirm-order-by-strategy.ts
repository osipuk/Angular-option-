import { Component, Input, OnInit } from "@angular/core";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Howl } from "howler";
import { EMPTY, Observable, share } from "rxjs";
import { ContractOptionLeg } from "src/app/interface/contract-option-leg";
import { MarketData } from "src/app/interface/market-data";
import { Product } from "src/app/interface/product";
import { TradeService } from "src/app/_service/trade.service";
import { PlaceOrderByStrategyComponent } from "./place-order-by-strategy";

declare var $: any;

@Component({
    templateUrl: './confirm-order-by-strategy.html',
    styleUrls: ['./confirm-order-by-strategy.css']
  })
  export class ConfirmOrderByStrategyComponent implements OnInit {
    @Input() SelectedProduct?: Product;
    StockData$: Observable<MarketData>;
    
    ConfirmedStrategyOrder: any;
    StrategyOrderSuccessParameter: any;
    StrategyOrderRejectedParameter: any;
  
    constructor(public modal: NgbActiveModal, 
      private modalService: NgbModal,
      private tradeService: TradeService) {
            this.StockData$ = EMPTY;
        }

    ngOnInit(): void {
      if (this.SelectedProduct) {
        this.StockData$ = this.tradeService.getMarketData(this.SelectedProduct.ProductId).pipe(share());
      }
    }

    loadOptionModal(): void {    
      this.modal.dismiss();
      const modalRef = this.modalService.open(PlaceOrderByStrategyComponent, { size: 'lg'});
      modalRef.componentInstance.SelectedStrategy = this.ConfirmedStrategyOrder.strategy;  
      modalRef.componentInstance.SelectedProduct = this.SelectedProduct;
      // modalRef.componentInstance.MaxProfit = this.MaxProfit;
      // modalRef.componentInstance.MaxLoss = this.MaxLoss;
  }

    confirmSendStrategyOrder(): void {
        var account = this.ConfirmedStrategyOrder.account;
        var strategy = this.ConfirmedStrategyOrder.strategy;
        var action = this.ConfirmedStrategyOrder.action;
        var quantity = this.ConfirmedStrategyOrder.quantity;
        var limitPrice = this.ConfirmedStrategyOrder.limitPrice;
        var legs = this.ConfirmedStrategyOrder.legs;
    
        let requestObj = {
          AccountId: account.id,
          Broker: account?.brokerType,
          Strategy: strategy,
          Action: action,
          Symbol: this.SelectedProduct?.Symbol,
          Quantity: quantity,
          LimitPrice: parseFloat(limitPrice),
          Validity: "Day",
          OrderType: "Limit",
          Legs: legs
        };
    
        console.log("Confirm send strategy order...", JSON.stringify(requestObj));
        this.tradeService.placeStrategyOrder(requestObj).subscribe((result : any) => {
          console.log(JSON.stringify(result));
          if (result.status !== "REJECTED") {
            this.StrategyOrderSuccessParameter = {
              Strategy: strategy,
              Underlying: this.SelectedProduct?.Symbol
            };
            this.playSound("https://am708403.blob.core.windows.net/sounds/trading/feed.mp3");
            $('#OrderSuccess').modal('show');
          } else {
            this.StrategyOrderRejectedParameter = {
              Strategy: strategy,
              Underlying: this.SelectedProduct?.Symbol,
              RejectReason: "Unknown"
            };
            $('#StrategyOrderRejected').modal('show');
          }
        });
    
        // if (strategy.Name == 'DeltaNeutral') {
        //   let requestObj = {
        //     strategy: strategy,
        //     action: action,
        //     direction: action === "Buy" ? "Long" : "Short",
        //     quantity: quantity * 100,
        //     limitPrice: limitPrice,
        //     contract: this.ConfirmedStrategyOrder.symbol,
        //     symbol: this.ConfirmedStrategyOrder.symbol,
        //     type: "Limit",
        //     strikePrice: legs[0].StrikePrice,
        //     GUID: ""
        //   };
    
        //   console.log("Confirm send strategy order...", JSON.stringify(requestObj));
        //   this.tradeService.placeStockOrder(requestObj).subscribe();
        // }
        // for (let leg of legs) {
        //   let stringSP = leg.StrikePrice.toString().split('.');
        //   let strikePriceContract = stringSP[0].padStart(5, "0");
    
        //   if (stringSP[1])
        //     strikePriceContract = strikePriceContract.concat(stringSP[1].padEnd(3, "0"));
        //   else
        //     strikePriceContract = strikePriceContract.concat("000");
    
        //   let contract = this.ConfirmedStrategyOrder.symbol +
        //     new Date().toJSON().slice(0, 10).replace(/-/g, '') +
        //     'C' + strikePriceContract;
        //   let requestObj = {
        //     strategy: strategy,
        //     action: action,
        //     direction: action === "Buy" ? "Long" : "Short",
        //     quantity: leg.Quantity * 100,
        //     limitPrice: leg.LimitPrice,
        //     contract: contract,
        //     symbol: this.ConfirmedStrategyOrder.symbol,
        //     type: "Limit",
        //     strikePrice: leg.StrikePrice,
        //     GUID: ""
        //   };
    
        //   console.log("Confirm send strategy order...", JSON.stringify(requestObj));
        //   this.tradeService.placeStockOrder(requestObj).subscribe();
        // }
      }
    

    ////////////////////////////////////////////////////////////////////////////////
    getIronCondorBundlePrice(): number {
        var legs = this.ConfirmedStrategyOrder.legs;
        if (legs.length === 4) {
        var totalPrice = legs.filter((x: ContractOptionLeg) => { return x.Action === 'Buy';}).map((x: ContractOptionLeg) => { return x.LimitPrice;}).reduce((total: number, item: number) => {return total + item;})
            - legs.filter((x: ContractOptionLeg) => { return x.Action === 'Sell';}).map((x: ContractOptionLeg) => { return x.LimitPrice;}).reduce((total: number, item: number) => {return total + item;}); 
        return Math.round( totalPrice * 100 + Number.EPSILON ) / 100;
        }
        return 0;
    }
    
    playSound(audio: any){
        var sound = new Howl({
          src: [audio],
          html5: true
        });
        sound.play();
      }
  }