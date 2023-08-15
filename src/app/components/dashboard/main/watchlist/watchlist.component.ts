import { Component, OnInit, Input, HostListener, ViewEncapsulation, ElementRef, ViewChild, AfterViewChecked, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, switchMap, tap, catchError, share, take, filter, distinctUntilChanged } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { OptionsStrategy } from 'src/app/interface/options-strategy';
import { OrderType } from 'src/app/interface/order-type';
import { UnitType } from 'src/app/interface/unit-type';
import { OptionSnapshot } from 'src/app/interface/option-snapshot';
import { ExpiryDatesSelection } from 'src/app/interface/expiry-dates-selection';
import { WatchlistService } from './watchlist.service';
import { TradeService } from 'src/app/_service/trade.service';
import { OptionsService } from 'src/app/_service/options.service';
import { ConfigService } from 'src/app/common/config.service'
import { Observable, Subject, EMPTY, of } from 'rxjs';
import { MarketData } from 'src/app/interface/market-data';
import { ProductService } from 'src/app/_service/product.service';
import { UtilityService } from 'src/app/_service/utility.service';
import { Product } from 'src/app/interface/product';
import { Howl } from 'howler';
import { GetWatchListDataResult } from 'src/app/interface/options-watchlist-result';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlaceOrderByStrategyComponent } from 'src/app/components/modals/place-order-by-strategy';

declare var $: any;

@Component({
  selector: 'ow-main-watchlist-tab',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class WatchlistComponent implements OnInit, AfterViewChecked {
  @Input() currentTab: string = '';
  @Input() currentTradeTab: string = 'by-product';
  @Input() currentProductListTab: string = 'product-list-option';

  GetWatchListDataResult: GetWatchListDataResult;

  SelectedStrategy: OptionsStrategy;
  StrategyList: OptionsStrategy[];
  CurrentPage: number;
  TotalPage: number;
  ItemPerPage: number;
  IsFirstPage: boolean;
  IsLastPage: boolean;
  Pages: number[];

  hoveredData: any;
  item: any;

  // Order pop-up
  OptionExpiryDates$: Observable<ExpiryDatesSelection>;
  SelectedOptionExpiryDate: string;

  stockDataFilterForm: FormGroup;
  StockOrderTypeList: OrderType[];
  StockUnitTypeList: UnitType[];
  StockData$: Observable<MarketData>;
  OptionSnapshot$: Observable<OptionSnapshot[]>;

  SelectedProduct?: Product;
  Products$: Observable<Product[]>;
  ProductInput$: Subject<string>;
  ProductSearchLoading: boolean;

  showMobileAddContractList:boolean = false;
  ErrorMessage: string = '';
  AddWatchlistResult: boolean = false;
  // ConfirmAddWatchlist: boolean = false;
  selectedLegNums: number;
  legsList : string[];
  LegNumOfSelectedStrategy : number;

  OptionContractList: string[];
  SelectedOptionContract: string;
  OptionContracts$: Observable<Product[]>;
  OptionContractInput$: Subject<string>;
  OptionContractSearchLoading: boolean;
  selectedType: any = 'All';
  OptionSnapshotData: any = [];
  OptionSnapshotDataClone: any = [];

  @ViewChild('table4ScrollElement') private table4Scroll: ElementRef;
  @ViewChild('table1ScrollElement') private table1Scroll: ElementRef;
  @ViewChild('table2ScrollElement') private table2Scroll: ElementRef;
  @ViewChild('table3ScrollElement') private table3Scroll: ElementRef;
  dynamicStyleTable4: any = { "margin-top": "0" };
  dynamicStyleTable1: any = { "margin-top": "0" };
  dynamicStyleTable2: any = { "margin-top": "0" };
  dynamicStyleTable3: any = { "margin-top": "0" };
  OptionTable4Classes: any = 'outer-side OptionTable4 d-none';
  OptionTable1Classes: any = 'outer-body OptionTable1 width1 width2';
  OptionTable2Classes: any = 'outer-side OptionTable2';
  OptionTable3Classes: any = 'outer-body OptionTable3 width1 width2';

  hoveredWatch: any;

  isLoading: Boolean = false;
  isLoadingScreenerResult: Boolean = false;

  currentSortedColumn = {
    name: 'Name',
    type: 'DESC'
  }

  callTableColumns: any = [];
  callTableColumnsDefault: any = [];
  callTableColumnsReverse: any = [];
  putTableColumns: any = [];

  placeOrderColumns: any;

  placeOrderLastTradedPrice: any = 0;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private auth: AngularFireAuth,
    private watchlistService: WatchlistService,
    private tradeService: TradeService,
    private optionsService: OptionsService,
    private productService: ProductService,
    private utilityService: UtilityService,
    private configService: ConfigService,
    private modalService: NgbModal,
  ) {
    this.placeOrderColumns = [];

    this.callTableColumns = [
      { key: 'BidVolume', label: 'Bid Vol.' },
      { key: 'Bid', label: 'Bid' },
      { key: 'Ask', label: 'Ask' },
      { key: 'AskVolume', label: 'Ask Vol.' },
      { key: 'Last', label: 'Last' },
      { key: 'PctChange', label: 'Change %' },
      { key: 'BreakEvenPct', label: 'Break Even %' },
      { key: 'DailyVol', label: 'Daily Vol.' },
      { key: 'OpenInt', label: 'OpenInt' },
      { key: 'OtmProbabilityPct', label: 'Otm Pro.' },
      { key: 'IVol', label: 'IVol' },
      { key: 'Delta', label: 'Delta' },
      { key: 'Gamma', label: 'Gamma' },
      { key: 'Vega', label: 'Vega' },
      { key: 'Theta', label: 'Theta' }
    ];

    this.putTableColumns = [
      { key: 'BidVolume', label: 'Bid Vol.' },
      { key: 'Bid', label: 'Bid' },
      { key: 'Ask', label: 'Ask' },
      { key: 'AskVolume', label: 'Ask Vol.' },
      { key: 'Last', label: 'Last' },
      { key: 'PctChange', label: 'Change %' },
      { key: 'BreakEvenPct', label: 'Break Even %' },
      { key: 'DailyVol', label: 'Daily Vol.' },
      { key: 'OpenInt', label: 'OpenInt' },
      { key: 'OtmProbabilityPct', label: 'Otm Pro.' },
      { key: 'IVol', label: 'IVol' },
      { key: 'Delta', label: 'Delta' },
      { key: 'Gamma', label: 'Gamma' },
      { key: 'Vega', label: 'Vega' },
      { key: 'Theta', label: 'Theta' }
    ];

    let callColumnsArr = this.callTableColumns;
    this.callTableColumnsDefault = [... this.callTableColumns];
    this.callTableColumnsReverse = callColumnsArr.reverse();   

    this.table4Scroll = <any>'';
    this.table1Scroll = <any>'';
    this.table2Scroll = <any>'';
    this.table3Scroll = <any>'';

    this.selectedLegNums = 0;
    this.legsList = ["Buy Put", "Sell Put", "Sell Call", "Buy Call"];
    this.LegNumOfSelectedStrategy = 4;
    this.SelectedProduct = undefined;
    this.ProductInput$ = new Subject<string>();
    this.ProductSearchLoading = false;
    this.Products$ = this.ProductInput$.pipe(
      filter(res => {
        return res !== null && res.length >= 1
      }),
      distinctUntilChanged(),
      debounceTime(500),
      tap(() => this.ProductSearchLoading = true),
      switchMap(term => {
        return this.productService.searchProduct({
          Markets: ["US"],
          Keyword: term
        }).pipe(
          catchError(() => of([])), // empty list on error
          tap(() => this.ProductSearchLoading = false)
        )
      }),
      share()
    );

    this.SelectedOptionContract = "";
    this.OptionContractList = ["Buy Put", "Sell Put", "Sell Call", "Buy Call"];
    this.OptionContractInput$ = new Subject<string>();
    this.OptionContractSearchLoading = false;
    this.OptionContracts$ = this.OptionContractInput$.pipe(
      filter(res => {
        return res !== null && res.length >= 1
      }),
      distinctUntilChanged(),
      debounceTime(500),
      tap(() => this.OptionContractSearchLoading = true),
      switchMap(term => {
        return this.productService.searchProduct({
          Markets: ["US"],
          Keyword: term
        }).pipe(
          catchError(() => of([])), // empty list on error
          tap(() => this.OptionContractSearchLoading = false)
        )
      })
    );

    var stgList = utilityService.getStrategySelections();
    this.StrategyList = stgList;

    this.SelectedStrategy = this.StrategyList[0];
    
    this.GetWatchListDataResult = { Data:[], TotalData:0, TotalDataFiltered:0 };

    this.CurrentPage = 1;
    this.TotalPage = 1
    this.ItemPerPage = 10;
    this.IsFirstPage = true;
    this.IsLastPage = true;
    this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
    this.StockOrderTypeList = this.utilityService.getOrderTypeSelections();
    this.StockUnitTypeList = this.utilityService.getUnitTypeSelections();

    this.OptionExpiryDates$ = EMPTY;
    this.SelectedOptionExpiryDate = "";
    this.StockData$ = EMPTY;
    this.OptionSnapshot$ = EMPTY;

        this.stockDataFilterForm = this.formBuilder.group(
      {
        volume_grater_then: [""],
        volume_less_then: [""],
        delta_grater_then: [""],
        delta_less_then: [""],
        open_interest_grater_then: [""],
        open_interest_less_then: [""]
      }
    );
  }

  @HostListener('window:scroll', ['$event']) scrollTable4Handler($event: any) {
    let table4ScrollTop = this.table4Scroll.nativeElement.scrollTop;

    this.table1Scroll.nativeElement.scrollTop = table4ScrollTop;
    this.table3Scroll.nativeElement.scrollTop = table4ScrollTop;
  }

  @HostListener('window:scroll', ['$event']) scrollTable1Handler($event: any) {
    let table1ScrollTop = this.table1Scroll.nativeElement.scrollTop;

    if (this.selectedType == 'Call') {
      this.table4Scroll.nativeElement.scrollTop = table1ScrollTop;
    }
    this.table2Scroll.nativeElement.scrollTop = table1ScrollTop;
    this.table3Scroll.nativeElement.scrollTop = table1ScrollTop;
  }

  @HostListener('window:scroll', ['$event']) scrollTable2Handler($event: any) {

    let table2ScrollTop = this.table2Scroll.nativeElement.scrollTop;

    this.table1Scroll.nativeElement.scrollTop = table2ScrollTop;
    this.table3Scroll.nativeElement.scrollTop = table2ScrollTop;
  }
  @HostListener('window:scroll', ['$event']) scrollTable3Handler($event: any) {   
    try {
      let table3ScrollTop = this.table3Scroll.nativeElement.scrollTop;

      this.table1Scroll.nativeElement.scrollTop = table3ScrollTop;
      this.table2Scroll.nativeElement.scrollTop = table3ScrollTop;
    } catch (ex) {
    }
  }

  playSound(audio: any){
    var sound = new Howl({
      src: [audio],
      html5: true
    });
    sound.play();
  }

  ngAfterViewChecked() {
  }

  filterStockData(){

    this.OptionSnapshotData = this.OptionSnapshotDataClone;

    var volume_grater_then = this.stockDataFilterForm.get('volume_grater_then')?.value;
    var volume_less_then = this.stockDataFilterForm.get('volume_less_then')?.value;
    var delta_grater_then = this.stockDataFilterForm.get('delta_grater_then')?.value;
    var delta_less_then = this.stockDataFilterForm.get('delta_less_then')?.value;
    var open_interest_grater_then = this.stockDataFilterForm.get('open_interest_grater_then')?.value;
    var open_interest_less_then = this.stockDataFilterForm.get('open_interest_less_then')?.value;

    let OptionSnapshotDataVolume = [];
    let OptionSnapshotDataDelta = [];
    let OptionSnapshotDataOpenInt = [];
    if(volume_grater_then || volume_less_then){
      OptionSnapshotDataVolume = this.OptionSnapshotData.filter((item: any) => {
        if(volume_grater_then && !volume_less_then){
          return item.Call.BidVolume !== null && item.Call.BidVolume > parseInt(volume_grater_then);
        }
        if(!volume_grater_then && volume_less_then){
          return item.Call.BidVolume !== null && item.Call.BidVolume < parseInt(volume_less_then);
        }
        if(volume_grater_then && volume_less_then){
          return item.Call.BidVolume !== null && (item.Call.BidVolume > parseInt(volume_grater_then) && item.Call.BidVolume  < parseInt(volume_less_then));
        }
        return item;
      });
    }

    if(delta_grater_then || delta_less_then){
      OptionSnapshotDataDelta = this.OptionSnapshotData.filter((item: any) => {
        if(delta_grater_then && !delta_less_then){
          return item.Call.Delta !== null && item.Call.Delta > parseFloat(delta_grater_then);
        }
        if(!delta_grater_then && delta_less_then){
          return item.Call.Delta !== null && item.Call.Delta < parseFloat(delta_less_then);
        }
        if(delta_grater_then && delta_less_then){
          return item.Call.Delta !== null && (item.Call.Delta > parseFloat(delta_grater_then) && item.Call.Delta < parseFloat(delta_less_then));
        }
        return item;
      });
    }

    if(open_interest_grater_then || open_interest_less_then){
      OptionSnapshotDataOpenInt = this.OptionSnapshotData.filter((item: any) => {
        if(open_interest_grater_then && !open_interest_less_then){
          return item.Call.OpenInt !== null && item.Call.OpenInt > parseFloat(open_interest_grater_then);
        }
        if(!open_interest_grater_then && open_interest_less_then){
          return item.Call.OpenInt !== null && item.Call.OpenInt < parseFloat(open_interest_less_then);
        }
        if(open_interest_grater_then && open_interest_less_then){
          return item.Call.OpenInt !== null && (item.Call.OpenInt > parseFloat(open_interest_grater_then) && item.Call.OpenInt < parseFloat(open_interest_less_then));
        }
        return item;
      });
    }

    this.OptionSnapshotData = [].concat(OptionSnapshotDataVolume, OptionSnapshotDataDelta, OptionSnapshotDataOpenInt);
    if(!OptionSnapshotDataVolume.length && !OptionSnapshotDataDelta.length && !OptionSnapshotDataOpenInt.length){
      this.OptionSnapshotData = this.OptionSnapshotDataClone;
    }

    this.tableScrollByType(this.selectedType);
  }

  tableScrollByType(value: String){
    if (value == 'All') {
      this.callTableColumns = this.callTableColumnsReverse;
      setTimeout(() => {
        this.table1Scroll.nativeElement.scrollLeft += 9999999999*2;
        var callTableLength = $("#myTable1").find('tr.callBG').length;
        var putTableLength = $("#myTable3").find('tr.putBG').length;
        if(callTableLength > 5 && putTableLength > 0){
          var scrollTopVal = ($('#myTable1 tr.callBG').eq(callTableLength - 1).offset().top) - 588;
          this.table1Scroll.nativeElement.scrollTop += scrollTopVal;
          this.table2Scroll.nativeElement.scrollTop += scrollTopVal;
          this.table3Scroll.nativeElement.scrollTop += scrollTopVal;
        }
      }, 700);
    }

    if (value == 'Call') {
      this.callTableColumns = this.callTableColumnsDefault;
      setTimeout(() => {
        var callTableLength = $("#myTable1").find('tr.callBG').length;
        if(callTableLength > 5){
          var scrollTopVal = ($('#myTable1 tr.callBG').eq(callTableLength - 1).offset().top) - 588;
          this.table4Scroll.nativeElement.scrollTop += scrollTopVal;
          this.table1Scroll.nativeElement.scrollTop += scrollTopVal;
        }
      }, 700);
    }

    if (value == 'Put') {
      this.callTableColumns = this.callTableColumnsDefault;
      setTimeout(() => {
        var putTableLength = $("#myTable3").find('tr.putBG').length;
        if(putTableLength > 5){
          var scrollTopVal = ($('#myTable3 tr.putBG').eq(putTableLength - 1).offset().top) - 1730;
          this.table2Scroll.nativeElement.scrollTop += scrollTopVal;
          this.table3Scroll.nativeElement.scrollTop += scrollTopVal;
        }
      }, 700);
    }
  }

  setTableColumnStatus(value: any){
    var excludedColumns = ['Ticker'];
    this.callTableColumnsDefault.map((itemObj: any, key: number) =>{
      if(!excludedColumns.includes(itemObj.key)){
        let columnJSON = {
          "name": itemObj.label,
          "key": itemObj.key,
          "checked": false
        }
        if(itemObj.key == 'BidVolume' || itemObj.key == 'Bid' || itemObj.key == 'Ask' || itemObj.key == 'AskVolume' || itemObj.key == 'Last' ){
          columnJSON.checked = true;
        }
        this.placeOrderColumns.push(columnJSON);
      }
    })
  }

  getStatusByColumn(columnName: string){
    if(this.placeOrderColumns.length > 0){
      let filtered = this.placeOrderColumns.filter((row: any) => row.key == columnName);
      if(filtered.length > 0){
        return filtered[0].checked;
      }
      return false;
    }
  }

  checkValueByKey(snapshootOBJ: any, callTableColumn: any) {
    if (snapshootOBJ[callTableColumn.key] !== undefined && snapshootOBJ[callTableColumn.key] !== null && snapshootOBJ[callTableColumn.key] !== '') {
      switch (callTableColumn.key) {
        case "BreakEvenPct":
        case "IVol":
        case "PctChange":
        case "OtmProbabilityPct":
          return (parseFloat(snapshootOBJ[callTableColumn.key]) * 100).toFixed(2) + "%";
        case "Bid":
        case "Ask":
        case "Last":
          return parseFloat(snapshootOBJ[callTableColumn.key]).toFixed(2);
        case "Vega":
        case "Theta":
        case "Gamma":
        case "Delta":
          return parseFloat(snapshootOBJ[callTableColumn.key]).toFixed(3);
        default:
          return snapshootOBJ[callTableColumn.key];
      }
    }
    else {
      return "-";
    }
    return;
  }

  onTypeChanged(value: String) {
    this.selectedType = value;
    if (value === 'All') {
      this.OptionTable4Classes = 'outer-side OptionTable4 d-none';
      this.OptionTable1Classes = 'outer-body OptionTable1 width1 width2';
      this.OptionTable2Classes = 'outer-side OptionTable2';
      this.OptionTable3Classes = 'outer-body OptionTable3 width1 width2';
    }
    if (value === 'Call') {
      this.OptionTable4Classes = 'outer-side OptionTable4';
      this.OptionTable1Classes = 'outer-body OptionTable1 width1';
      this.OptionTable2Classes = 'outer-side OptionTable2 d-none';
      this.OptionTable3Classes = 'outer-body OptionTable3 width1 width2 d-none';
    }
    if (value === 'Put') {
      this.OptionTable4Classes = 'outer-side OptionTable4 d-none';
      this.OptionTable1Classes = 'outer-body OptionTable1 width1 width2 d-none';
      this.OptionTable2Classes = 'outer-side OptionTable2';
      this.OptionTable3Classes = 'outer-body OptionTable3 width1';
    }
    this.tableScrollByType(value);
  }

  ngAfterViewInit() {

  }

  searchProductTrackByFn(item: Product) {
    return item.ProductId;
  }

  onProductSelected(item: Product) {
    if (item && item.ProductId) {
      this.isLoading = true;
      this.OptionContractList = this.utilityService.getListOfLegs(this.SelectedStrategy.Name);
      // this.OptionContractList = [];
  
      console.log("item.Symbol: ", item.Symbol);
      console.log("this.SelectedProduct: ", this.SelectedProduct);
  
        this.StockData$ = this.tradeService.getMarketData(item.ProductId).pipe(share());
  
      this.StockData$.pipe(take(1)).subscribe(value => {
        this.placeOrderLastTradedPrice = value.LastTradedPrice;  
      });
  
      if (this.currentProductListTab === 'product-list-option') {
        this.OptionSnapshotData = [];
        this.OptionExpiryDates$ = this.optionsService.getExpiryDates(item.Symbol).pipe(share());
        this.OptionExpiryDates$.pipe(take(1)).subscribe((value) => {
          // Last Traded Price required here to determine center point of option chain table
          this.SelectedOptionExpiryDate = value.DefaultExpiryDate;
          this.OptionSnapshot$ = this.optionsService.getOptionChain(item.Symbol, this.SelectedOptionExpiryDate).pipe(share());
  
          this.OptionSnapshot$.pipe(take(1)).subscribe(value => {
            this.isLoading = false;
            this.OptionSnapshotData = value;
            this.OptionSnapshotDataClone = value;
  
            this.setTableColumnStatus(value);
  
            this.tableScrollByType(this.selectedType);
          });
        });
      }
    }
  }

  onOptionContractSelected(item: Product) {
    console.log(item.Symbol);
    console.log(this.SelectedProduct);
  }

  generateWatchListresult() {
    this.isLoadingScreenerResult = true;
   
    var requestObj: any = {
      Sort: this.currentSortedColumn.name,
      Order: this.currentSortedColumn.type,
      Offset: (this.CurrentPage - 1) * 10,
      Limit: 10
    }

    this.watchlistService.getWatchListData(requestObj).subscribe(result => {
      if (result && result.Data) {
        this.GetWatchListDataResult = result;
        
        console.log(this.GetWatchListDataResult)

        this.TotalPage = Math.ceil(this.GetWatchListDataResult.TotalData / this.ItemPerPage);

        this.IsFirstPage = this.CurrentPage === 1;
        this.IsLastPage = this.CurrentPage === this.TotalPage;
        this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
      }
      this.isLoadingScreenerResult = false;
    });
  }

  switchToOptionTab(): void {
    console.log("Switch to option tab");
    this.currentProductListTab = 'product-list-option';
    if (this.SelectedProduct) {
      this.OptionSnapshotData = [];
      this.isLoading = true;
      var symbol = this.SelectedProduct.Symbol;

      this.StockData$ = this.tradeService.getMarketData(this.SelectedProduct.ProductId).pipe(share());
      this.StockData$.pipe(take(1)).subscribe(value => {
        // Last Traded Price required here to determine center point of option chain table
        this.placeOrderLastTradedPrice = value.LastTradedPrice;
        this.OptionExpiryDates$ = this.optionsService.getExpiryDates(symbol).pipe(share());
        this.OptionExpiryDates$.pipe(take(1)).subscribe((value) => {
          this.SelectedOptionExpiryDate = value.DefaultExpiryDate;
          this.OptionSnapshot$ = this.optionsService.getOptionChain(symbol, this.SelectedOptionExpiryDate).pipe(share());

          this.OptionSnapshot$.pipe(take(1)).subscribe(value => {
            this.isLoading = false;
            this.OptionSnapshotData = value;
            this.OptionSnapshotDataClone = value;

            this.setTableColumnStatus(value);

            this.tableScrollByType(this.selectedType);

          });
        });
      });
    }
  }

  filterColumns(index: number){
    this.placeOrderColumns[index].checked = !this.placeOrderColumns[index].checked;
    setTimeout(() => this.table1Scroll.nativeElement.scrollLeft += 9999999999*2, 1000);
    setTimeout(() => this.table3Scroll.nativeElement.scrollLeft += 0, 1000);
  }

  extractContract(watchListData: any): string {
    const dataFromAPI = watchListData.OptionContracts;
    const contractParts  = dataFromAPI.split(' ');
    const contractIndex = contractParts.findIndex((part:any) => /^\d{4}-\d{2}-\d{2}$/.test(part));

    if (contractIndex !== -1) {
      const randomString = contractParts.slice(0, contractIndex).join(' ');
      return randomString;
    }

    return '';
  }

  extractDateAndValues(watchListData: any): string {
    const dataFromAPI = watchListData.OptionContracts;
    const strElements = dataFromAPI.split(' ').length - 2;
    const dateAndValues = dataFromAPI.split(' ').slice(strElements).join(' ');
    return dateAndValues;
  }

  loadOptionModal(symbol: string, strategy: string, optionContract:string): void {    
    console.log("Place order button clicked from screener entry");
    // this.ByStrategyForm.value.SelectedStrategy = '';

    // get strategy array
    const strategySelections = this.utilityService.getStrategySelections();
    // find matching strategy and store to tempStrategy
    let tempStrategy = strategySelections.find(s => s.Display === strategy);

    this.productService.getProductFromSymbol(symbol).pipe(take(1)).subscribe(result => {
      if (result.Data) {
        const modalRef = this.modalService.open(PlaceOrderByStrategyComponent, { size: 'lg'});
        modalRef.componentInstance.SelectedStrategy = tempStrategy?.Name;  
        modalRef.componentInstance.SelectedStrategyDisplay = this.utilityService.getStrategyDisplayName(tempStrategy?.Name ?? "");  
        modalRef.componentInstance.SelectedProduct = result.Data;
        modalRef.componentInstance.OptionContract = optionContract;
        // modalRef.componentInstance.MaxProfit = maxProfit;
        // modalRef.componentInstance.MaxLoss = maxLoss;

        console.log(result.Data)
        console.log(tempStrategy)
      }
    });
  }

  onExpiryDateChanged(selectedDate: string) {
    this.isLoading = true;
    console.log("Selected date: " + selectedDate);
    this.SelectedOptionExpiryDate = selectedDate;
    if (this.SelectedProduct) {
      var symbol = this.SelectedProduct.Symbol;
      this.StockData$ = this.tradeService.getMarketData(this.SelectedProduct.ProductId).pipe(share());
      this.StockData$.pipe(take(1)).subscribe(value => {
        // Last Traded Price required here to determine center point of option chain table
        this.placeOrderLastTradedPrice = value.LastTradedPrice;
        this.OptionSnapshot$ = this.optionsService.getOptionChain(symbol, this.SelectedOptionExpiryDate).pipe(share());
        this.OptionSnapshot$.pipe(take(1)).subscribe(value => {
          this.OptionSnapshotData = value;
          this.OptionSnapshotDataClone = value;
          this.isLoading = false;

          this.setTableColumnStatus(value);

          this.tableScrollByType(this.selectedType);

        })
      });
    }
  }

  resetCallTableIfIsRowSelected() {
    this.OptionSnapshotData.map((snapshoot: any) => {
      if (snapshoot.Call.isSelected !== undefined) {
        delete snapshoot.Call.isSelected;
      }
      return snapshoot;
    });
  }

  resetPutTableIfRowIsSelected() {
    this.OptionSnapshotData.map((snapshoot: any) => {
      if (snapshoot.Put.isSelected !== undefined) {
        delete snapshoot.Put.isSelected;
      }
      return snapshoot;
    });
  }

  onSelectedStrategyChanged() {
    this.onClickClearAllBtn();
    this.OptionContractList = this.utilityService.getListOfLegs(this.SelectedStrategy.Name);
    this.LegNumOfSelectedStrategy = this.OptionContractList.length;
    console.log(this.OptionContractList, this.LegNumOfSelectedStrategy)
  }

  mobileAddContractBtn() {
    this.showMobileAddContractList = !this.showMobileAddContractList; 
    $('#AddContract').modal('show');
    $(".modal-backdrop").addClass('AddContractListBackdrop');
  }

  onClickAddContractBtn() {
    $(".modal-backdrop").addClass('AddContractListBackdrop');
    this.showMobileAddContractList = true; 
  }

  closeValidationModal(){
    this.generateWatchListresult();
    this.onClickClearAllBtn();
    this.showMobileAddContractList = false;
  }

  onClickConfirmBtn() {
    $('#AddContract').modal('hide');

    this.showMobileAddContractList = false;

    this.isLoadingScreenerResult = true;
    var requestObj: any = {
      Strategy: this.SelectedStrategy.Display,
      Underlying: this.SelectedProduct?.Symbol,
      OptionContracts: '',
      OptionList:this.OptionContractList,
    }

    console.log("New Contract...", requestObj);

    this.watchlistService.addWatchListData(requestObj).subscribe(
      {
        next: (result: boolean) => {
          this.AddWatchlistResult = result;

          if(this.CurrentPage == Math.ceil(1.0 * this.GetWatchListDataResult.TotalData / this.ItemPerPage)){
            this.CurrentPage = Math.ceil(1.0 * (this.GetWatchListDataResult.TotalData + 1) / this.ItemPerPage);
          }

          this.generateWatchListresult();
          this.onClickClearAllBtn();
        },
        error: (error: any) => {
          this.isLoadingScreenerResult = false;

          this.ErrorMessage = error
          $('#LegsValidation').modal('show');
          this.onClickClearAllBtn();
        }
      }
    )
  }

  onClickClearAllBtn() {
    this.resetPutTableIfRowIsSelected();
    this.resetCallTableIfIsRowSelected();
    this.selectedLegNums = 0;
    this.OptionContractList = this.utilityService.getListOfLegs(this.SelectedStrategy.Name);
    this.AddWatchlistResult = false;
  }

  onClickDelBtn(data: any) {
    this.isLoadingScreenerResult = true;
    var requestObj: any = {
      Strategy: data.Strategy,
      Underlying: data.Underlying,
      OptionContracts: data.OptionContracts,
    }

    console.log("Deleted Contract...", requestObj);

    this.watchlistService.removeWatchListData(requestObj).subscribe(
      {
        next: (result: boolean) => {
          if(this.CurrentPage == Math.ceil(1.0 * this.GetWatchListDataResult.TotalData / this.ItemPerPage)){
            this.CurrentPage = Math.ceil(1.0 * (this.GetWatchListDataResult.TotalData - 1) / this.ItemPerPage);
          }
          this.generateWatchListresult();
        },
        error: (error: any) => {
          this.ErrorMessage = error
          this.isLoadingScreenerResult = false;
        }
      }
    )
  }

  onBackButtonClick() {
    this.showMobileAddContractList = false;
    this.onClickClearAllBtn();
    $('#AddContract').modal('hide');
  }

  setSelectedPlaceOrderRowCall(snapshootObj: OptionSnapshot): void {
    console.log(this.selectedLegNums, this.LegNumOfSelectedStrategy)
    if(this.selectedLegNums < this.LegNumOfSelectedStrategy){
      snapshootObj.Call.isSelected = true;

      console.log("snapshootObj.Call: ", snapshootObj.Call);

      this.SelectedOptionContract = snapshootObj.Call.Ticker;

      if(!this.OptionContractList.some(optionContract => optionContract === this.SelectedOptionContract)){
        this.selectedLegNums ++;
        this.OptionContractList[this.selectedLegNums - 1] = this.SelectedOptionContract;
      }
    }
  }

  setSelectedPlaceOrderRowPut(snapshootObj: OptionSnapshot): void {
    if(this.selectedLegNums < this.LegNumOfSelectedStrategy){
      snapshootObj.Put.isSelected = true;

      this.SelectedOptionContract = snapshootObj.Put.Ticker;
      
      if(!this.OptionContractList.some(optionContract => optionContract === this.SelectedOptionContract)){
        this.selectedLegNums ++;
        this.OptionContractList[this.selectedLegNums - 1] = this.SelectedOptionContract;
      }
    }
  }

  sortColumns(columnName: string, orderType: string){
    this.currentSortedColumn = {
      name: columnName,
      type: orderType
    }
    this.generateWatchListresult();        
  }

  previousPage() {
    this.CurrentPage--;
    this.isLoadingScreenerResult = true;
    var requestObj: any = {
      Sort: this.currentSortedColumn.name,
      Order: this.currentSortedColumn.type,
      Offset: (this.CurrentPage - 1) * 10,
      Limit: 10
    }

    console.log("Scanning previous page...", JSON.stringify(requestObj));

    this.watchlistService.getWatchListData(requestObj).subscribe(result => {
      if (result && result.Data) {
        this.GetWatchListDataResult = result;
        this.TotalPage = Math.ceil(this.GetWatchListDataResult.TotalData / this.ItemPerPage);
        this.IsFirstPage = this.CurrentPage === 1;
        this.IsLastPage = this.CurrentPage === this.TotalPage;
        this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
        this.isLoadingScreenerResult = false;
      }
    });
  }

  nextPage() {
    this.isLoadingScreenerResult = true;
    this.CurrentPage++;
    var requestObj: any = {
      sort: this.currentSortedColumn.name,
      order: this.currentSortedColumn.type,
      offset: (this.CurrentPage - 1) * 10,
      limit: 10
    }
    console.log("Scanning next page...", JSON.stringify(requestObj));
    this.watchlistService.getWatchListData(requestObj).subscribe(result => {
      if (result && result.Data) {
        this.GetWatchListDataResult = result;
        this.TotalPage = Math.ceil(this.GetWatchListDataResult.TotalData / this.ItemPerPage);
        this.IsFirstPage = this.CurrentPage === 1;
        this.IsLastPage = this.CurrentPage === this.TotalPage;
        this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
        this.isLoadingScreenerResult = false;
      }
    });
  }

  goToPage(pageNum: number) {
    this.isLoadingScreenerResult = true;
    this.CurrentPage = pageNum;
    var requestObj: any = {
      sort: this.currentSortedColumn.name,
      order: this.currentSortedColumn.type,
      offset: (this.CurrentPage - 1) * 10,
      limit: 10
    }
    console.log("Scanning next page...", JSON.stringify(requestObj));
    this.watchlistService.getWatchListData(requestObj).subscribe(result => {
      if (result && result.Data) {
        this.GetWatchListDataResult = result;

        console.log(this.GetWatchListDataResult)
        this.TotalPage = Math.ceil(this.GetWatchListDataResult.TotalData / this.ItemPerPage);
        this.IsFirstPage = this.CurrentPage === 1;
        this.IsLastPage = this.CurrentPage === this.TotalPage;
        this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
        this.isLoadingScreenerResult = false;
      }
    });
  }

  ngOnInit(): void {
    this.generateWatchListresult();
  }

  ngOnDestroy() {
  }
}