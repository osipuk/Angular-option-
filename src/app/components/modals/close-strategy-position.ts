import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { EMPTY, Observable } from "rxjs";
import { TradeService } from "src/app/_service/trade.service";
import { AccountSelection } from "src/app/interface/account-selection";
import { ContractOptionLeg } from "src/app/interface/contract-option-leg";
import { MarketData } from "src/app/interface/market-data";
import { Product } from "src/app/interface/product";

declare var $: any;

@Component({
    templateUrl: './close-strategy-position.html',
    styleUrls: ['./close-strategy-position.css']
})
export class CloseStrategyPositionComponent implements OnInit {
    @Input() SelectedBrokerAccount!: AccountSelection;
    @Input() StrategyPositionToClose: any;
    StockData$: Observable<MarketData>;
    ByStrategyForm: FormGroup;
    ConfirmedStrategyOrder: any;

    // Post Order Confirmation Pop-Up
    StrategyOrderSuccessParameter: any;
    StrategyOrderRejectedParameter: any;

    constructor(public modal: NgbActiveModal,
        private formBuilder: FormBuilder,
        private tradeService: TradeService) {
        this.StockData$ = EMPTY;
        this.ByStrategyForm = this.formBuilder.group(
            {
                SelectedAccount: this.SelectedBrokerAccount,
                SelectedStrategy: [undefined],
                SelectedStock: [{}],
                SelectedExpiry: [""],
                SelectedParameter: [],
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
        this.StrategyPositionToClose = {
            Product: "",
            Strategy: ""
        };
        this.ConfirmedStrategyOrder = {
            product: {},
            legs: []
        };
    }
    ngOnInit(): void {
    }

    submitStrategyOrder(): void {
        var account = this.SelectedBrokerAccount;
        var strategy = this.StrategyPositionToClose.Strategy;
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
            symbol: this.StrategyPositionToClose.Product,
            legs: legs
        };
    }

    getIronCondorBundlePrice(): number {
        var legs = this.ByStrategyForm.get('Legs')?.value;
        if (legs.length === 4) {
            var totalPrice = legs.filter((x: ContractOptionLeg) => { return x.Action === 'Buy'; }).map((x: ContractOptionLeg) => { return x.LimitPrice; }).reduce((total: number, item: number) => { return total + item; })
                - legs.filter((x: ContractOptionLeg) => { return x.Action === 'Sell'; }).map((x: ContractOptionLeg) => { return x.LimitPrice; }).reduce((total: number, item: number) => { return total + item; });
            return Math.round(totalPrice * 100 + Number.EPSILON) / 100;
        }
        return 0;
    }

    confirmSendStrategyOrder(): void {
        var account = this.SelectedBrokerAccount;
        var strategy = this.StrategyPositionToClose.Strategy;
        var action = this.ByStrategyForm.get('Action')?.value;
        var quantity = this.ByStrategyForm.get('Quantity')?.value;
        var limitPrice = this.ByStrategyForm.get('LimitPrice')?.value;
        var legs = this.ByStrategyForm.get('Legs')?.value;
    
        let requestObj = {
          AccountId: account.id,
          Broker: account?.brokerType,
          Strategy: strategy,
          Action: action,
          Symbol: this.StrategyPositionToClose.Product,
          Quantity: quantity,
          LimitPrice: parseFloat(limitPrice),
          Validity: "Day",
          OrderType: "Limit",
          Legs: legs
        };
    
        console.log("Confirm send strategy order...", JSON.stringify(requestObj));
        this.tradeService.placeStrategyOrder(requestObj).subscribe((result: any) => {
          console.log(JSON.stringify(result));
          if (result.status !== "REJECTED") {
            this.StrategyOrderSuccessParameter = {
              Strategy: strategy,
              Underlying: this.StrategyPositionToClose.Product
            };
            $('#OrderSuccess').modal('show');
          } else {
            this.StrategyOrderRejectedParameter = {
              Strategy: strategy,
              Underlying: this.StrategyPositionToClose.Product,
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
    
}