import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Howl } from "howler";
import { EMPTY, Observable } from "rxjs";
import { ContractOptionLeg } from "src/app/interface/contract-option-leg";
import { MarketData } from "src/app/interface/market-data";
import { Product } from "src/app/interface/product";
import { TradeService } from "src/app/_service/trade.service";
import { UtilityService } from "src/app/_service/utility.service";

declare var $: any;

@Component({
    templateUrl: './order-rejected.html',
    styleUrls: ['./order-rejected.css']
  })
  export class OrderRejectedComponent implements OnInit {
    OrderRejectedParameter: any;

    constructor() {
        this.OrderRejectedParameter = {
            Action: "",
            Quantity: 0,
            Symbol: "",
            OrderType: "",
            RejectReason: ""
          };
    }

    ngOnInit(): void {
        throw new Error("Method not implemented.");
    }
  }