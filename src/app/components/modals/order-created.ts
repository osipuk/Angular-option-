import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
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
    templateUrl: './order-created.html',
    styleUrls: ['./order-created.css']
  })
  export class OrderCreatedComponent implements OnInit {
    OrderSuccessParameter: any;
    @Output() redirectToSubTab = new EventEmitter<{ tabName: string, subTabName: string }>();

    constructor() {
        this.OrderSuccessParameter = {
            Action: "",
            Quantity: 0,
            Symbol: "",
            OrderType: ""
          };
    }

    ngOnInit(): void {
        throw new Error("Method not implemented.");
    }

    seeMyOrders(){
        $('#OrderCreated').modal('hide');
        $('#OrderSuccess').modal('hide');
        this.redirectToSubTab.emit({tabName: "trade", subTabName: "active-orders"});
      }
  }
