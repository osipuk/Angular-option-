import { Component, OnInit, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CalculatorPopupComponent } from '../components/modals/calculator-popup';
import { AnalyticsComponent } from '../components/dashboard';
import { ProductService } from '../_service/product.service';
import { EMPTY, Observable, take, share, of } from 'rxjs';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { StrategyExpiryParameter } from '../interface/strategy-expiry-parameter';
import { OptionsParameter } from '../interface/options-parameter';
import { UtilityService } from '../_service/utility.service';

import { MarketData } from '../interface/market-data';
import { TradeService } from '../_service/trade.service';
import { environment } from 'src/environments/environment';

declare var window: any;
const Site_URL = environment.Site_URL;


@Component({
  // standalone: true,
  selector: 'app-custom-dropdown',
  templateUrl: './custom-dropdown.component.html',
  styleUrls: ['./custom-dropdown.component.css'],
})

export class CustomDropdownComponent  {

  @Input() item: string=''; 
  @Input() data:any;  
  @Input() SelectedStrategy: string ='';
  
  OptionContract: string = '';
  SelectedProduct: any;

  Strategy: string = '';
  formModal: any;
  ByStrategyForm: FormGroup;
  
  isLoadingStrategyContractResult: Boolean = false;
  AvailableBrokerAccounts = [] as any;
  PlaceOrderStrategyList: any[] = [];
  ExpiryParameterList: StrategyExpiryParameter[];
  OptionParameterList: OptionsParameter[];
  CalendarSpreadExpiryParameterList: StrategyExpiryParameter[];
  StockData$: Observable<MarketData>;

  constructor(private modalService: NgbModal,
    private productService: ProductService,
    private formBuilder: FormBuilder,
    private utilityService: UtilityService,
    private tradeService: TradeService) {

      this.StockData$ = EMPTY;
      this.PlaceOrderStrategyList = utilityService.getStrategySelections();
      this.SelectedStrategy = this.PlaceOrderStrategyList[0].Name;
      // this.SelectedStrategyDisplay = this.PlaceOrderStrategyList[0].Display;  
      this.OptionParameterList = this.utilityService.getOptionParameters(this.Strategy);
      this.ExpiryParameterList = this.utilityService.getStrategyExpiryParameters();
      this.CalendarSpreadExpiryParameterList = this.utilityService.getCalendarSpreadExpiryParameters();
  
      this.ByStrategyForm = this.formBuilder.group(
        {
          SelectedAccount: this.AvailableBrokerAccounts[0],
          SelectedStrategy: [this.PlaceOrderStrategyList[0].Name],
          SelectedStock: [{}],
          SelectedExpiry: [this.ExpiryParameterList[0]],
          SelectedParameter: [this.OptionParameterList[0]],
          SelectedCalendarSpreadExpiry: [this.CalendarSpreadExpiryParameterList[0]],
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
    // this.initBrokerAccounts();
    // console.log(this.data.Underlying)
    // debugger
    this.productService.getProductFromSymbol(this.data?.Underlying ).pipe(take(1)).subscribe(result => {
      this.SelectedProduct = result.Data;
      if (result.Data) {
        var symbol = result.Data.Symbol;

        // Get data to show Underlying Price
        this.isLoadingStrategyContractResult = true;
        this.StockData$ = this.tradeService.getMarketData(result.Data.ProductId).pipe(share());

        // console.log(this.StockData$)
        this.StockData$.pipe(take(1)).subscribe(value => {
          var strategy = this.ByStrategyForm.get('SelectedStrategy')?.value;
          var amount = this.ByStrategyForm.get('Amount')?.value;
  
          if (strategy) {
            if (strategy.Name === 'DeltaNeutral') {
              this.ByStrategyForm.patchValue({ LimitPrice: value.LastTradedPrice });        
            }
            
            this.OptionParameterList = this.utilityService.getOptionParameters(strategy.Name);
            var legs = this.ByStrategyForm.controls["Legs"] as FormArray;
            legs.clear(); 
            {

              // console.log(value.LastTradedPrice)

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
    });
  }
  
  visualize(){
    this.formModal = new window.bootstrap.Modal(
      document.getElementById('myModalAnalytics')
    );
    this.formModal.show();
  }
  simulation(){
    this.formModal = new window.bootstrap.Modal(
      document.getElementById('myModalAnalytics1')
    );
    // const modalRef1 = this.modalService.open(AnalyticsComponent);
    // modalRef1.componentInstance.currentTab = 'payoffPrediction'; 
    this.formModal.show();
  }
  stockinfo(data_Underlying : string){
    // alert(data_Underlying);
    let url=`${Site_URL}/optionpi#/product/US/${data_Underlying}`;
    window.open(url,'_blank')
    console.log("hello");
  }
  chart(data_name : string){
    // alert(data_name);
    let search_name = data_name ;
    if(search_name.search('Group')>0){
      let num = search_name.search('Group');
      search_name = search_name.slice(0,num);
    }else if(search_name.search(',')>0){
      let num = search_name.search(',');
      search_name = search_name.slice(0,num);
    } else if(search_name.search('Corporation')>0){
      let num = search_name.search('Corporation');
      search_name = search_name.slice(0,num);
    } else if (search_name.search('and')>0){
      search_name = 'Alpha & Omega Semiconductor Ltd';
    }
    // alert(search_name);
    let url=`${Site_URL}/optionpi#/charts/${search_name}`;
    window.open(url,'_blank')
  }
  loadStrategyCalculatorModal() {
    console.log(this.data)
    const modalRef = this.modalService.open(CalculatorPopupComponent, { size: 'lg'});
        
    modalRef.componentInstance.SelectedProduct = this.SelectedProduct; 
    modalRef.componentInstance.SelectedStrategy = this.SelectedStrategy; 
    modalRef.componentInstance.SelectedStockDirection = this.ByStrategyForm.get('Action')?.value === "Buy" ? "Long" : "Short"; 
    modalRef.componentInstance.SelectedStockQuantity = this.ByStrategyForm.get('Quantity')?.value; 
    modalRef.componentInstance.SelectedLegs = this.ByStrategyForm.get('Legs')?.value; 
    modalRef.componentInstance.OptionContract = this.data.OptionContracts;
    modalRef.componentInstance.DropDownClicked = true;
  }

  extractContract(OptionContract: any): string {
    const contractParts  = OptionContract.split(' ');
    const contractIndex = contractParts.findIndex((part:any) => /^\d{4}-\d{2}-\d{2}$/.test(part));

    if (contractIndex !== -1) {
        const randomString = contractParts.slice(0, contractIndex).join(' ');
        return randomString;
    }

    return '';
  }
}
