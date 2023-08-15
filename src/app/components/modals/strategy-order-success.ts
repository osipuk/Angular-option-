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
    templateUrl: './strategy-order-success.html',
    styleUrls: ['./strategy-order-success.css']
  })
  export class StrategyOrderSuccessComponent implements OnInit {
    @Output() redirectToSubTab = new EventEmitter<{ tabName: string, subTabName: string }>();
    
    StockData$: Observable<MarketData>;
    StrategyOrderSuccessParameter: any;

    constructor() {
      this.StockData$ = EMPTY;
      this.StrategyOrderSuccessParameter = {
        Strategy: "",
        Underlying: ""
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