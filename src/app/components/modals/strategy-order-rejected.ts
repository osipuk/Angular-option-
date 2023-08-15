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
    templateUrl: './strategy-order-rejected.html',
    styleUrls: ['./strategy-order-rejected.css']
  })
  export class StrategyOrderRejectedComponent implements OnInit {
    StockData$: Observable<MarketData>;
    StrategyOrderRejectedParameter: any;

    constructor() {
        this.StockData$ = EMPTY;
        this.StrategyOrderRejectedParameter = {
            Strategy: "",
            Underlying: "",
            RejectReason: ""
          };
      
    }

    ngOnInit(): void {
        throw new Error("Method not implemented.");
    }
  }