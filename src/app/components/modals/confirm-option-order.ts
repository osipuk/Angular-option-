import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { TradeService } from "src/app/_service/trade.service";
import { Product } from "src/app/interface/product";

declare var $: any;

@Component({
  templateUrl: './confirm-option-order.html',
  styleUrls: ['./confirm-option-order.css']
})
export class ConfirmOptionOrderComponent implements OnInit {
  @Input() ConfirmedOptionOrder: any;

  OptionOrderForm: FormGroup;
  AvailableBrokerAccounts = [] as any;

  SelectedProduct?: Product;
  SelectedOptionContract: string;

  // Post Order Confirmation Pop-Up
  OrderSuccessParameter: any;
  OrderRejectedParameter: any;

  constructor(public modal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private tradeService: TradeService) {
    this.OptionOrderForm = this.formBuilder.group(
      {
        SelectedAccount: this.AvailableBrokerAccounts[0],
        SelectedOptionAction: ["Buy"],
        OptionQuantity: [1, [Validators.required]],
        OptionLimitPrice: [1],
        OptionProduct: [""]
      }
    );

    this.SelectedOptionContract = "";
    this.SelectedProduct = undefined;

    this.ConfirmedOptionOrder = {};

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
  }

  ngOnInit(): void {
  }

  confirmSendOptionOrder(): void {
    var account = this.OptionOrderForm.get('SelectedAccount')?.value;
    var action = this.OptionOrderForm.get('SelectedOptionAction')?.value;
    //var product = this.OptionOrderForm.get('OptionProduct')?.value;
    var quantity = this.OptionOrderForm.get('OptionQuantity')?.value;
    var limitPrice = this.OptionOrderForm.get('OptionLimitPrice')?.value;

    var requestObj = {
      AccountId: account?.id,
      Broker: account?.brokerType,
      Action: action,
      Symbol: this.SelectedOptionContract,
      Quantity: quantity,
      LimitPrice: parseFloat(limitPrice),
      Validity: "Day",
      OrderType: "Limit",
      Underlying: this.SelectedProduct?.Symbol
    };

    console.log("Confirm send option order...", JSON.stringify(requestObj));
    this.tradeService.placeOptionOrder(requestObj).subscribe((result) => {
      console.log(JSON.stringify(result));
      if (result.status !== "REJECTED") {
        this.OrderSuccessParameter = {
          Action: action,
          Quantity: quantity,
          Symbol: this.SelectedOptionContract,
          OrderType: "Limit",
          LimitPrice: limitPrice
        };
        $('#OrderCreated').modal('show');
      } else {
        this.OrderRejectedParameter = {
          Action: action,
          Quantity: quantity,
          Symbol: this.SelectedOptionContract,
          OrderType: "Limit",
          LimitPrice: limitPrice,
          RejectReason: result.reason
        };
        $('#OrderRejected').modal('show');
      }
    });
  }
}