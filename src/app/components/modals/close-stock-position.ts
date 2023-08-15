import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { EMPTY, Observable } from "rxjs";
import { TradeService } from "src/app/_service/trade.service";
import { UtilityService } from "src/app/_service/utility.service";
import { AccountSelection } from "src/app/interface/account-selection";
import { MarketData } from "src/app/interface/market-data";
import { OrderType } from "src/app/interface/order-type";
import { Product } from "src/app/interface/product";
import { UnitType } from "src/app/interface/unit-type";

declare var $: any;

@Component({
    templateUrl: './close-stock-position.html',
    styleUrls: ['./close-stock-position.css']
})
export class CloseStockPositionComponent implements OnInit {
    @Input() SelectedBrokerAccount!: AccountSelection;
    @Input() StockPositionToClose: any;
    StockData$: Observable<MarketData>;
    StockOrderForm: FormGroup;
    ConfirmedStockOrder: any;
    StockOrderTypeList: OrderType[];
    StockUnitTypeList: UnitType[];

    // Post Order Confirmation Pop-Up
    OrderSuccessParameter: any;
    OrderRejectedParameter: any;

    constructor(public modal: NgbActiveModal,
        private formBuilder: FormBuilder,
        private utilityService: UtilityService,
        private tradeService: TradeService) {
        this.StockOrderTypeList = this.utilityService.getOrderTypeSelections();
        this.StockUnitTypeList = this.utilityService.getUnitTypeSelections();
        this.StockData$ = EMPTY;
        this.StockOrderForm = this.formBuilder.group(
            {
                SelectedAccount: this.SelectedBrokerAccount,
                SelectedStockAction: ["Buy"],
                StockQuantity: [1, [Validators.required]],
                SelectedStockOrderType: [this.StockOrderTypeList[0]],
                SelectedStockUnitType: [this.StockUnitTypeList[0]],
                StockLimitPrice: [100],
                StockStopPrice: [100],
                SelectedStockValidity: ["Day"]
            }
        );
        this.StockPositionToClose = {
            Product: "",
            Strategy: ""
        };
        this.ConfirmedStockOrder = {
            product: {},
        }
    }
    ngOnInit(): void {
    }

    increaseStockLimitPrice(): void {
        var price = this.StockOrderForm.get('StockLimitPrice');
        var tickIncrement = this.utilityService.getStockTickSize(price?.value, true);
        var newPrice = parseFloat((parseFloat(price?.value) + tickIncrement).toFixed(4));
        this.StockOrderForm.patchValue({ StockLimitPrice: newPrice });
    }

    decreaseStockLimitPrice(): void {
        var price = this.StockOrderForm.get('StockLimitPrice');
        var tickIncrement = this.utilityService.getStockTickSize(price?.value, false);
        var newPrice = parseFloat((parseFloat(price?.value) - tickIncrement).toFixed(4));
        this.StockOrderForm.patchValue({ StockLimitPrice: newPrice });
    }

    increaseStockStopPrice(): void {
        var price = this.StockOrderForm.get('StockStopPrice');
        var tickIncrement = this.utilityService.getStockTickSize(price?.value, true);
        var newPrice = parseFloat((parseFloat(price?.value) + tickIncrement).toFixed(4));
        this.StockOrderForm.patchValue({ StockStopPrice: newPrice });
    }

    decreaseStockStopPrice(): void {
        var price = this.StockOrderForm.get('StockStopPrice');
        var tickIncrement = this.utilityService.getStockTickSize(price?.value, false);
        var newPrice = parseFloat((parseFloat(price?.value) - tickIncrement).toFixed(4));
        this.StockOrderForm.patchValue({ StockStopPrice: newPrice });
    }

    submitStockOrder(): void {
        var account = this.SelectedBrokerAccount;
        var action = this.StockPositionToClose.Action;
        var orderType = this.StockOrderForm.get('SelectedStockOrderType')?.value;
        var quantity = this.StockPositionToClose.Quantity;
        var unitType = this.StockOrderForm.get('SelectedStockUnitType')?.value;
        var validity = this.StockOrderForm.get('SelectedStockValidity')?.value;
        var limitPrice = this.StockOrderForm.get('StockLimitPrice')?.value;
        var stopPrice = this.StockOrderForm.get('StockStopPrice')?.value;

        var requestObj = {
            account: account.id,
            action: action,
            orderType: orderType.Name,
            quantity: quantity,
            limitPrice: 0,
            stopPrice: 0,
            validity: validity,
            product: this.StockPositionToClose.Product
        };
        if (orderType.Name === 'Limit') {
            requestObj.limitPrice = limitPrice;
        } else if (orderType.Name === 'Stop') {
            requestObj.stopPrice = stopPrice;
        }
        if (unitType.Name === 'Lot') {
            requestObj.quantity *= 100;
        } else if (unitType.Name === 'KLot') {
            requestObj.quantity *= 1000;
        }

        console.log("Submitting stock order...", JSON.stringify(requestObj));
        this.ConfirmedStockOrder = {
            account: account.id,
            broker: account.brokerType,
            action: requestObj.action,
            orderType: requestObj.orderType,
            quantity: quantity,
            limitPrice: requestObj.limitPrice,
            stopPrice: requestObj.stopPrice,
            validity: requestObj.validity,
            unitType: unitType.Name,
            product: requestObj.product
        }
    }

    confirmSendStockOrder(): void {
        var account = this.SelectedBrokerAccount;
        var action = this.StockPositionToClose.Action;
        var orderType = this.StockOrderForm.get('SelectedStockOrderType')?.value;
        var quantity = this.StockOrderForm.get('StockQuantity')?.value;
        var unitType = this.StockOrderForm.get('SelectedStockUnitType')?.value;
        var validity = this.StockOrderForm.get('SelectedStockValidity')?.value;
        var limitPrice = this.StockOrderForm.get('StockLimitPrice')?.value;
        var stopPrice = this.StockOrderForm.get('StockStopPrice')?.value;
    
        var requestObj = {
          AccountId: account?.id,
          Broker: account?.brokerType,
          Action: action,
          Symbol: this.StockPositionToClose.Product.Symbol,
          Quantity: quantity,
          Validity: validity,
          OrderType: orderType.Name,
          StopPrice: 0,
          LimitPrice: 0
        };
        if (orderType.Name === 'Limit') {
          requestObj.LimitPrice = parseFloat(limitPrice);
        } else if (orderType.Name === 'Stop') {
          requestObj.StopPrice = parseFloat(stopPrice);
        }
        if (unitType.Name === 'Lot') {
          requestObj.Quantity *= 100;
        } else if (unitType.Name === 'KLot') {
          requestObj.Quantity *= 1000;
        }
    
        console.log("Confirm send stock order...", JSON.stringify(requestObj));
        this.tradeService.placeStockOrder(requestObj).subscribe((result) => {
          console.log(JSON.stringify(result));
          if (result.status !== "REJECTED") {
            this.OrderSuccessParameter = {
              Action: action,
              Quantity: quantity,
              Symbol: this.StockPositionToClose.Symbol,
              OrderType: orderType.Name
            };
            if (orderType.Name === 'Limit') {
              this.OrderSuccessParameter.LimitPrice = limitPrice;
            } else if (orderType.Name === 'Stop') {
              this.OrderSuccessParameter.StopPrice = stopPrice;
            }
            $('#OrderCreated').modal('show');
          } else {
            this.OrderRejectedParameter = {
              Action: action,
              Quantity: quantity,
              Symbol: this.StockPositionToClose.Symbol,
              OrderType: orderType.Name,
              RejectReason: result.reason
            };
            if (orderType.Name === 'Limit') {
              this.OrderRejectedParameter.LimitPrice = limitPrice;
            } else if (orderType.Name === 'Stop') {
              this.OrderRejectedParameter.StopPrice = stopPrice;
            }
            $('#OrderRejected').modal('show');
          }
        });
      }
}