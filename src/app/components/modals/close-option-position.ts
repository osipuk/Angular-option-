import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { EMPTY, Observable } from "rxjs";
import { TradeService } from "src/app/_service/trade.service";
import { UtilityService } from "src/app/_service/utility.service";
import { AccountSelection } from "src/app/interface/account-selection";
import { ContractOptionLeg } from "src/app/interface/contract-option-leg";
import { MarketData } from "src/app/interface/market-data";
import { Product } from "src/app/interface/product";

declare var $: any;

@Component({
    templateUrl: './close-option-position.html',
    styleUrls: ['./close-option-position.css']
})
export class CloseOptionPositionComponent implements OnInit {
    @Input() SelectedBrokerAccount!: AccountSelection;
    @Input() OptionPositionToClose: any;
    StockData$: Observable<MarketData>;
    OptionData: MarketData;
    OptionOrderForm: FormGroup;
    ConfirmedOptionOrder: any;

    // Post Order Confirmation Pop-Up
    OrderSuccessParameter: any;
    OrderRejectedParameter: any;

    constructor(public modal: NgbActiveModal,
        private formBuilder: FormBuilder,
        private utilityService: UtilityService,
        private tradeService: TradeService) {
        this.StockData$ = EMPTY;
        this.OptionData = {
            AskPrice: 0,
            AskSize: 0,
            AskTime: "",
            BidPrice: 0,
            BidSize: 0,
            BidTime: "",
            AssetClass: "Options",
            TradeVenue: "UnitedStates",
            Timestamp: "",
            Symbol: "",
            ProductId: 0,
            LastTradedPrice: 0,
            LastTradedSize: 0,
            LastTradedTime: "",
            Open: 0,
            High: 0,
            Low: 0,
            PrevClose: 0,
            CumulativeVolume: 0,
            MidPrice: 0
        };
        this.OptionOrderForm = this.formBuilder.group(
            {
                SelectedAccount: this.SelectedBrokerAccount,
                SelectedOptionAction: ["Buy"],
                OptionQuantity: [1, [Validators.required]],
                OptionLimitPrice: [1],
                OptionProduct: [""],
            }
        );
        this.OptionPositionToClose = {
            Product: "",
            Strategy: ""
        };
        this.ConfirmedOptionOrder = {
            product: {},
        }

    }
    ngOnInit(): void {
    }

    submitOptionOrder(): void {
        var account = this.SelectedBrokerAccount;
        var action = this.OptionPositionToClose.Action;
        //var product = this.OptionOrderForm.get('OptionProduct')?.value;
        var quantity = this.OptionPositionToClose.Quantity;
        var limitPrice = this.OptionOrderForm.get('OptionLimitPrice')?.value;

        var requestObj = {
            account: account.id,
            action: action,
            symbol: this.OptionPositionToClose.Product,
            quantity: quantity * 100,
            limitPrice: limitPrice,
            validity: "Day"
        }

        console.log("Submitting option order...", JSON.stringify(requestObj));
        this.ConfirmedOptionOrder = {
            account: account.id,
            broker: account.brokerType,
            action: requestObj.action,
            orderType: "Limit",
            quantity: quantity,
            limitPrice: requestObj.limitPrice,
            validity: "Day",
            unitType: "Lot",
            product: requestObj.symbol
        }
    }

    increaseOptionLimitPrice(): void {
        var price = this.OptionOrderForm.get('OptionLimitPrice');
        var tickIncrement = this.utilityService.getOptionTickSize(price?.value, true);
        var newPrice = parseFloat((parseFloat(price?.value) + tickIncrement).toFixed(4));
        this.OptionOrderForm.patchValue({ OptionLimitPrice: newPrice });
    }

    decreaseOptionLimitPrice(): void {
        var price = this.OptionOrderForm.get('OptionLimitPrice');
        var tickIncrement = this.utilityService.getOptionTickSize(price?.value, false);
        var newPrice = parseFloat((parseFloat(price?.value) - tickIncrement).toFixed(4));
        this.OptionOrderForm.patchValue({ OptionLimitPrice: newPrice });
    }

    confirmSendOptionOrder(): void {
        var account = this.SelectedBrokerAccount;
        var action = this.OptionPositionToClose.Action;
        //var product = this.OptionOrderForm.get('OptionProduct')?.value;
        var quantity = this.OptionPositionToClose.Quantity;
        var limitPrice = this.OptionOrderForm.get('OptionLimitPrice')?.value;
    
        var requestObj = {
          AccountId: account?.id,
          Broker: account?.brokerType,
          Action: action,
          Symbol: this.OptionPositionToClose.Product,
          Quantity: quantity,
          LimitPrice: parseFloat(limitPrice),
          Validity: "Day",
          OrderType: "Limit",
          Underlying: this.OptionPositionToClose.Underlying
        };
    
        console.log("Confirm send option order...", JSON.stringify(requestObj));
        this.tradeService.placeOptionOrder(requestObj).subscribe((result) => {
          console.log(JSON.stringify(result));
          if (result.status !== "REJECTED") {
            this.OrderSuccessParameter = {
              Action: action,
              Quantity: quantity,
              Symbol: this.OptionPositionToClose.Product,
              OrderType: "Limit",
              LimitPrice: limitPrice
            };
            $('#OrderCreated').modal('show');
          } else {
            this.OrderRejectedParameter = {
              Action: action,
              Quantity: quantity,
              Symbol: this.OptionPositionToClose.Product,
              OrderType: "Limit",
              LimitPrice: limitPrice,
              RejectReason: result.reason
            };
            $('#OrderRejected').modal('show');
          }
        });
      }
}