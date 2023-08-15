import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, share, take } from 'rxjs';
import { ContractOptionLeg } from 'src/app/interface/contract-option-leg';
import { MarketData } from 'src/app/interface/market-data';
import { Product } from 'src/app/interface/product';
import { TradeService } from 'src/app/_service/trade.service';
import { UtilityService } from '../../_service/utility.service';
import { CalculatorPopupComponent } from './calculator-popup';
import { ConfirmOrderByStrategyComponent } from './confirm-order-by-strategy';

declare var $: any;

@Component({
  templateUrl: './place-order-by-strategy.html',
  styleUrls: ['./place-order-by-strategy.css']
})
export class PlaceOrderByStrategyComponent implements OnInit {
  @Input() SelectedStrategy: string;
  @Input() SelectedStrategyDisplay: string;
  @Input() SelectedProduct?: Product;
  @Input() OptionContract?: string;

  // @Input() MaxProfit?: any;
  // @Input() MaxLoss?: any;
  
  AvailableBrokerAccounts = [] as any;
  StockData$: Observable<MarketData>;
  ByStrategyForm: FormGroup;
  ConfirmedStrategyOrder: any;
  isLoadingStrategyContractResult: Boolean = false;

  constructor(public modal: NgbActiveModal, 
    private modalService: NgbModal,
    private utilityService: UtilityService,
    private tradeService: TradeService,
    private formBuilder: FormBuilder) {
    this.StockData$ = EMPTY;
    var strategyList = utilityService.getStrategySelections();
    this.SelectedStrategy = strategyList[0].Name;
    this.SelectedStrategyDisplay = strategyList[0].Display;
    this.ByStrategyForm = this.formBuilder.group(
      {
        SelectedAccount: this.AvailableBrokerAccounts[0],
        SelectedStrategy: [strategyList[0].Name],
        SelectedStrategyDisplay:[strategyList[0].Display],
        SelectedStock: [{}],
        MaxLoss: [100],
        MaxGain: [300],
        Probability: [10],
        Amount: [2000],
        Legs: this.formBuilder.array(
          [this.formBuilder.group(
            { Action: "", OrderType: "", Direction: "", Rights: "", Quantity: "", StrikePrice: 0, Expiry: "", LimitPrice: 0, FairValue: 0 })]
        ),
        Action: 'Buy',
        Direction: 'Long',
        Quantity: 1,
        LimitPrice: 280
      }
    );
  }

  ngOnInit(): void {
    this.initBrokerAccounts();
    if (this.SelectedProduct) {
      var symbol = this.SelectedProduct.Symbol;

      // Get data to show Underlying Price
      this.isLoadingStrategyContractResult = true;
      this.StockData$ = this.tradeService.getMarketData(this.SelectedProduct.ProductId).pipe(share());
      this.StockData$.pipe(take(1)).subscribe(value => {
        var strategy = this.ByStrategyForm.get('SelectedStrategy')?.value;
        var amount = this.ByStrategyForm.get('Amount')?.value;

        if (strategy) {
          if (strategy === 'DeltaNeutral') {
            this.ByStrategyForm.patchValue({ LimitPrice: value.LastTradedPrice });        
          }
          
          var legs = this.ByStrategyForm.controls["Legs"] as FormArray;
          legs.clear();

          // if (this.screenerOptions === "Optimal_Strategy") {
          //   var data = this.screenerService.getAiContracts({
          //     Strategy: strategy.Name, 
          //     Symbol: symbol,
          //     Amount: amount
          //   });
          //   data.subscribe(value => {
          //     legs.clear();
          //     var group = value.Legs.map(x => this.formBuilder.group(
          //       {
          //         Action: x.Action,
          //         OrderType: x.OrderType,
          //         Direction: x.Direction,
          //         Rights: x.Rights,
          //         Quantity: x.Quantity,
          //         StrikePrice: x.StrikePrice,
          //         Expiry: x.Expiry,
          //         LimitPrice: x.LimitPrice,
          //         FairValue: x.FairValue
          //       }
          //     ));
          //     group.forEach(Leg => legs.push(Leg));
          //     this.isLoadingStrategyContractResult = false;
          //   });
          // }
          // else 
          {
            var data2 = this.utilityService.getSampleContract(strategy, symbol, value.LastTradedPrice);
            data2.subscribe(value => {
              legs.clear();
              var group = value.map(x => this.formBuilder.group(
                {
                  Action: x.Action,
                  OrderType: x.OrderType,
                  Direction: x.Direction,
                  Rights: x.Rights,
                  Quantity: x.Quantity,
                  StrikePrice: x.StrikePrice,
                  Expiry: x.Expiry,
                  LimitPrice: x.LimitPrice,
                  FairValue: x.FairValue
                }
              ));
              group.forEach(Leg => legs.push(Leg));
              this.isLoadingStrategyContractResult = false;
            });
          }
        }
      });
    }
  }

  async initBrokerAccounts(){       
    var allBrokerAccounts = [];
    if (localStorage.getItem('accountSelections') !== null) {
      allBrokerAccounts = JSON.parse(localStorage.getItem('accountSelections') || '[]');
    }
    this.AvailableBrokerAccounts = allBrokerAccounts.filter(function (x: any) {
      return true;
      // return x.brokerType === 'Tiger';
    })
    this.ByStrategyForm.patchValue({ SelectedAccount: this.AvailableBrokerAccounts[0] });
  }

  reloadStrategyData() {
    if (this.SelectedProduct) {
      var symbol = this.SelectedProduct.Symbol;

      // Get data to show Underlying Price     
      this.StockData$ = this.tradeService.getMarketData(this.SelectedProduct.ProductId).pipe(share());
      this.isLoadingStrategyContractResult = true;
      this.StockData$.pipe(take(1)).subscribe(value => {
        var strategy = this.ByStrategyForm.get('SelectedStrategy')?.value;
        var amount = this.ByStrategyForm.get('Amount')?.value;

        if (strategy) {
          if (strategy === 'DeltaNeutral') {
            this.ByStrategyForm.patchValue({ LimitPrice: value.LastTradedPrice });        
          }

          var legs = this.ByStrategyForm.controls["Legs"] as FormArray;
          legs.clear();

          // if (this.screenerOptions === "Optimal_Strategy") {
          //  var data = this.screenerService.getAiContracts({
          //    Strategy: strategy.Name, 
          //    Symbol: symbol,
          //    Amount: amount
          //  });
          //  data.subscribe(value => {
          //    legs.clear();
          //    var group = value.Legs.map(x => this.formBuilder.group(
          //      {
          //        Action: x.Action,
          //        OrderType: x.OrderType,
          //        Direction: x.Direction,
          //        Rights: x.Rights,
          //        Quantity: x.Quantity,
          //        StrikePrice: x.StrikePrice,
          //        Expiry: x.Expiry,
          //        LimitPrice: x.LimitPrice,
          //        FairValue: x.FairValue
          //      }
          //    ));
          //    group.forEach(Leg => legs.push(Leg));
          //    this.isLoadingStrategyContractResult = false;
          //  });
          // }
          // else
          {
            var data2 = this.utilityService.getSampleContract(strategy, symbol, value.LastTradedPrice);
            data2.subscribe(value => {
              legs.clear();
              var group = value.map(x => this.formBuilder.group(
                {
                  Action: x.Action,
                  OrderType: x.OrderType,
                  Direction: x.Direction,
                  Rights: x.Rights,
                  Quantity: x.Quantity,
                  StrikePrice: x.StrikePrice,
                  Expiry: x.Expiry,
                  LimitPrice: x.LimitPrice,
                  FairValue: x.FairValue
                }
              ));
              group.forEach(Leg => legs.push(Leg));
              this.isLoadingStrategyContractResult = false;
            });
          }
        }
      });
    }
  }

  submitStrategyOrder(): void {
    var account = this.ByStrategyForm.get('SelectedAccount')?.value;
    var strategy = this.ByStrategyForm.get('SelectedStrategy')?.value;
    var action = this.ByStrategyForm.get('Action')?.value;
    var quantity = this.ByStrategyForm.get('Quantity')?.value;
    var limitPrice = this.ByStrategyForm.get('LimitPrice')?.value;
    var legs = this.ByStrategyForm.get('Legs')?.value;

    var requestObj = {
      account: account.id,
      strategy: strategy,
      action: action,
      direction: action === "Buy" ? "Long" : "Short",
      quantity: quantity,
      limitPrice: limitPrice,
      legs: legs
    };
    console.log("Submitting strategy order...", JSON.stringify(requestObj));
    this.ConfirmedStrategyOrder = {
      account: account.id,
      broker: account.brokerType,
      strategy: requestObj.strategy,
      action: requestObj.action,
      direction: requestObj.direction,
      quantity: requestObj.quantity,
      limitPrice: requestObj.limitPrice,
      symbol: this.SelectedProduct?.Symbol,
      legs: legs
    };
    this.modal.dismiss();
    const modalRef = this.modalService.open(ConfirmOrderByStrategyComponent, { size: 'lg'});
        modalRef.componentInstance.ConfirmedStrategyOrder = this.ConfirmedStrategyOrder;  
        modalRef.componentInstance.SelectedProduct = this.SelectedProduct;  
  }

  loadStrategyCalculatorModal() {
    this.modal.dismiss();
    const modalRef = this.modalService.open(CalculatorPopupComponent, { size: 'lg'});
    modalRef.componentInstance.SelectedProduct = this.SelectedProduct; 
    modalRef.componentInstance.SelectedStrategy = this.SelectedStrategyDisplay; 
    modalRef.componentInstance.SelectedStockDirection = this.ByStrategyForm.get('Action')?.value === "Buy" ? "Long" : "Short"; 
    modalRef.componentInstance.SelectedStockQuantity = this.ByStrategyForm.get('Quantity')?.value; 
    modalRef.componentInstance.SelectedLegs = this.ByStrategyForm.get('Legs')?.value; 
    modalRef.componentInstance.OptionContract = this.OptionContract;

    // debugger
  }

  ////////////////////////////////////////////////////////////////////////////////
  getIronCondorBundlePrice(): number {
    var legs = this.ByStrategyForm.get('Legs')?.value;
    if (legs.length === 4) {
      var totalPrice = legs.filter((x: ContractOptionLeg) => { return x.Action === 'Buy';}).map((x: ContractOptionLeg) => { return x.LimitPrice;}).reduce((total: number, item: number) => {return total + item;})
        - legs.filter((x: ContractOptionLeg) => { return x.Action === 'Sell';}).map((x: ContractOptionLeg) => { return x.LimitPrice;}).reduce((total: number, item: number) => {return total + item;}); 
      return Math.round( totalPrice * 100 + Number.EPSILON ) / 100;
    }
    return 0;
  }  
}