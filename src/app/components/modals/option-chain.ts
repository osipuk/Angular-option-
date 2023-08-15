import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { EMPTY, Observable, Subject, catchError, debounceTime, distinctUntilChanged, filter, of, share, switchMap, take, tap } from "rxjs";
import { OptionsService } from "src/app/_service/options.service";
import { ProductService } from "src/app/_service/product.service";
import { TradeService } from "src/app/_service/trade.service";
import { UtilityService } from "src/app/_service/utility.service";
import { ExpiryDatesSelection } from "src/app/interface/expiry-dates-selection";
import { MarketData } from "src/app/interface/market-data";
import { OptionSnapshot } from "src/app/interface/option-snapshot";
import { OrderType } from "src/app/interface/order-type";
import { Product } from "src/app/interface/product";
import { UnitType } from "src/app/interface/unit-type";
import { CalculatorPopupComponent } from "./calculator-popup";
import { ConfirmOptionOrderComponent } from "./confirm-option-order";

declare var $: any;

@Component({
    templateUrl: './option-chain.html',
    styleUrls: ['./option-chain.css']
})
export class OptionChainComponent implements OnInit {
    @Input() SelectedBrokerAccount: any;

    isLoading: Boolean = false;

    OptionExpiryDates$: Observable<ExpiryDatesSelection>;
    SelectedOptionExpiryDate: string;

    StockOrderForm: FormGroup;
    ConfirmedStockOrder: any;
    OptionOrderForm: FormGroup;
    stockDataFilterForm: FormGroup;
    ConfirmedOptionOrder: any;
    StockOrderTypeList: OrderType[];
    StockUnitTypeList: UnitType[];
    StockData$: Observable<MarketData>;
    OptionSnapshot$: Observable<OptionSnapshot[]>;

    SelectedProduct?: Product;
    Products$: Observable<Product[]>;
    ProductInput$: Subject<string>;
    ProductSearchLoading: boolean;

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

    callTableColumns: any = [];
    callTableColumnsDefault: any = [];
    callTableColumnsReverse: any = [];
    putTableColumns: any = [];
    placeOrderColumns: any;

    placeOrderLastTradedPrice: any = 0;

    // Post Order Confirmation Pop-Up
    OrderSuccessParameter: any;
    OrderRejectedParameter: any;
    StrategyOrderSuccessParameter: any;
    StrategyOrderRejectedParameter: any;

    AvailableBrokerAccounts = [] as any;

    SelectedBroker: any;
    brokerTypes = [] as any;
    allBrokerAccounts = [] as any;
    brokerAccounts = [] as any;

    constructor(public modal: NgbActiveModal,
        private modalService: NgbModal,
        private formBuilder: FormBuilder,
        private tradeService: TradeService,
        private optionsService: OptionsService,
        private productService: ProductService,
        private utilityService: UtilityService) {
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
        this.StockOrderTypeList = this.utilityService.getOrderTypeSelections();
        this.StockUnitTypeList = this.StockUnitTypeList = this.utilityService.getUnitTypeSelections();
        this.StockOrderForm = this.formBuilder.group(
            {
                SelectedAccount: this.AvailableBrokerAccounts[0],
                SelectedStockAction: ["Buy"],
                StockQuantity: [1, [Validators.required]],
                SelectedStockOrderType: [this.StockOrderTypeList[0]],
                SelectedStockUnitType: [this.StockUnitTypeList[0]],
                StockLimitPrice: [100],
                StockStopPrice: [100],
                SelectedStockValidity: ["Day"]
            }
        );
        this.ConfirmedStockOrder = {
            product: {}
        };
        this.ConfirmedOptionOrder = {};

        this.OptionOrderForm = this.formBuilder.group(
            {
                SelectedAccount: this.AvailableBrokerAccounts[0],
                SelectedOptionAction: ["Buy"],
                OptionQuantity: [1, [Validators.required]],
                OptionLimitPrice: [1],
                OptionProduct: [""]
            }
        );

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

    ngOnInit(): void {
        this.initBrokerAccounts();
    }

    searchProductTrackByFn(item: Product) {
        return item.ProductId;
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

    onProductSelected(item: Product) {
        this.isLoading = true;
        console.log("item.Symbol: ", item.Symbol);
        console.log("this.SelectedProduct: ", this.SelectedProduct);

        this.StockData$ = this.tradeService.getMarketData(item.ProductId).pipe(share());
        this.StockData$.pipe(take(1)).subscribe(value => {
            // Last Traded Price required here to determine center point of option chain table
            this.placeOrderLastTradedPrice = value.LastTradedPrice;
            console.log(JSON.stringify(value));
            this.StockOrderForm.patchValue({ StockLimitPrice: value.AskPrice });
            this.StockOrderForm.patchValue({ StockStopPrice: value.AskPrice });
        });

        this.OptionSnapshotData = [];
        this.OptionExpiryDates$ = this.optionsService.getExpiryDates(item.Symbol).pipe(share());

        this.OptionExpiryDates$.pipe(take(1)).subscribe(value => {
            this.SelectedOptionExpiryDate = value.DefaultExpiryDate;
            this.OptionSnapshot$ = this.optionsService.getOptionChain(item.Symbol, this.SelectedOptionExpiryDate).pipe(share());

            this.OptionSnapshot$.pipe(take(1)).subscribe(value => {
                this.OptionOrderForm.patchValue({ OptionProduct: item.Symbol + this.SelectedOptionExpiryDate.split("-").join("").slice(2) + "C" + this.utilityService.parseStrikePrice(value[0].StrikePrice) });
                this.isLoading = false;
                this.OptionSnapshotData = value;
                this.OptionSnapshotDataClone = value;

                this.setTableColumnStatus(value);

                this.tableScrollByType(this.selectedType);
            })
        });
    }

    tableScrollByType(value: String) {
        if (value == 'All') {
            this.callTableColumns = this.callTableColumnsReverse;
            setTimeout(() => {
                this.table1Scroll.nativeElement.scrollLeft += 9999999999 * 2;
                var callTableLength = $("#myTable1").find('tr.callBG').length;
                var putTableLength = $("#myTable3").find('tr.putBG').length;
                if (callTableLength > 5 && putTableLength > 0) {
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
                if (callTableLength > 5) {
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
                if (putTableLength > 5) {
                    var scrollTopVal = ($('#myTable3 tr.putBG').eq(putTableLength - 1).offset().top) - 1730;
                    this.table2Scroll.nativeElement.scrollTop += scrollTopVal;
                    this.table3Scroll.nativeElement.scrollTop += scrollTopVal;
                }
            }, 700);
        }
    }

    setTableColumnStatus(value: any) {
        var excludedColumns = ['Ticker'];
        this.callTableColumnsDefault.map((itemObj: any, key: number) => {
            if (!excludedColumns.includes(itemObj.key)) {
                let columnJSON = {
                    "name": itemObj.label,
                    "key": itemObj.key,
                    "checked": false
                }
                if (itemObj.key == 'BidVolume' || itemObj.key == 'Bid' || itemObj.key == 'Ask' || itemObj.key == 'AskVolume' || itemObj.key == 'BreakEvenPct' || itemObj.key == 'PctChange') {
                    columnJSON.checked = true;
                }
                this.placeOrderColumns.push(columnJSON);
            }
        })
    }

    getStatusByColumn(columnName: string) {
        if (this.placeOrderColumns.length > 0) {
            let filtered = this.placeOrderColumns.filter((row: any) => row.key == columnName);
            if (filtered.length > 0) {
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

    submitOptionOrder(): void {
        var account = this.OptionOrderForm.get('SelectedAccount')?.value;
        var action = this.OptionOrderForm.get('SelectedOptionAction')?.value;
        //var product = this.OptionOrderForm.get('OptionProduct')?.value;
        var quantity = this.OptionOrderForm.get('OptionQuantity')?.value;
        var limitPrice = this.OptionOrderForm.get('OptionLimitPrice')?.value;

        var requestObj = {
            account: account.id,
            action: action,
            symbol: this.SelectedOptionContract,
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

        this.modal.dismiss();
        const modalRef = this.modalService.open(ConfirmOptionOrderComponent, { size: 'lg'});
        modalRef.componentInstance.ConfirmedOptionOrder = this.ConfirmedOptionOrder;
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

    setSelectedPlaceOrderRowCall(snapshootObj: OptionSnapshot): void {
        this.resetCallTableIfIsRowSelected();
        this.resetPutTableIfRowIsSelected();
        snapshootObj.Call.isSelected = true;
        console.log("snapshootObj.Call: ", snapshootObj.Call);
        var action = this.OptionOrderForm.get('SelectedOptionAction')?.value;

        this.SelectedOptionContract = snapshootObj.Call.Ticker;
        if (action === "Buy") {
            this.OptionOrderForm.patchValue({ OptionLimitPrice: snapshootObj.Call.Ask });
        } else if (action === "Sell") {
            this.OptionOrderForm.patchValue({ OptionLimitPrice: snapshootObj.Call.Bid });
        }
    }

    setSelectedPlaceOrderRowPut(snapshootObj: OptionSnapshot): void {
        this.resetCallTableIfIsRowSelected();
        this.resetPutTableIfRowIsSelected();
        snapshootObj.Put.isSelected = true;
        console.log("snapshootObj.Put: ", snapshootObj.Put);
        var action = this.OptionOrderForm.get('SelectedOptionAction')?.value;

        this.SelectedOptionContract = snapshootObj.Put.Ticker
        if (action === "Buy") {
            this.OptionOrderForm.patchValue({ OptionLimitPrice: snapshootObj.Put.Ask });
        } else if (action === "Sell") {
            this.OptionOrderForm.patchValue({ OptionLimitPrice: snapshootObj.Put.Bid });
        }
    }

    loadCalculatorModal() {
        this.modal.dismiss();
        const modalRef = this.modalService.open(CalculatorPopupComponent, { size: 'lg' });
        modalRef.componentInstance.SelectedProduct = this.SelectedProduct;

        // modalRef.componentInstance.SelectedStrategy = this.SelectedStrategyDisplay; 
        // modalRef.componentInstance.SelectedStockDirection = this.ByStrategyForm.get('Action')?.value === "Buy" ? "Long" : "Short"; 
        // modalRef.componentInstance.SelectedStockQuantity = this.ByStrategyForm.get('Quantity')?.value; 
        // modalRef.componentInstance.SelectedLegs = this.ByStrategyForm.get('Legs')?.value; 
        // modalRef.componentInstance.OptionContract = this.OptionContract;
    }

    reloadOptionData() {
        if (this.SelectedProduct) {
            this.OptionSnapshotData = [];
            this.isLoading = true;
            var symbol = this.SelectedProduct.Symbol;

            this.OptionSnapshot$ = this.optionsService.getOptionChain(symbol, this.SelectedOptionExpiryDate).pipe(share());
            this.OptionSnapshot$.pipe(take(1)).subscribe(value => {
                this.OptionOrderForm.patchValue({ OptionProduct: symbol + this.SelectedOptionExpiryDate.split("-").join("").slice(2) + "C" + this.utilityService.parseStrikePrice(value[0].StrikePrice) });
                this.isLoading = false;
                this.OptionSnapshotData = value;
                this.OptionSnapshotDataClone = value;

                this.setTableColumnStatus(value);

                this.tableScrollByType(this.selectedType);
            });
        }
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
    }

    onExpiryDateChanged(selectedDate: string) {
        this.isLoading = true;
        console.log("Selected date: " + selectedDate);
        this.SelectedOptionExpiryDate = selectedDate;
        if (this.SelectedProduct) {
            this.OptionSnapshot$ = this.optionsService.getOptionChain(this.SelectedProduct.Symbol, this.SelectedOptionExpiryDate).pipe(share());
        }

        this.OptionSnapshot$.pipe(take(1)).subscribe(value => {
            if (this.SelectedProduct) {
                this.OptionOrderForm.patchValue({ OptionProduct: this.SelectedProduct.Symbol + this.SelectedOptionExpiryDate.split("-").join("").slice(2) + "C" + this.utilityService.parseStrikePrice(value[0].StrikePrice) });
            }
            this.OptionSnapshotData = value;
            this.OptionSnapshotDataClone = value;

            this.setTableColumnStatus(value);

            this.tableScrollByType(this.selectedType);
            console.log(value);
            this.isLoading = false;
        })
    }

    filterStockData() {
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
        if (volume_grater_then || volume_less_then) {
            OptionSnapshotDataVolume = this.OptionSnapshotData.filter((item: any) => {
                if (volume_grater_then && !volume_less_then) {
                    return item.Call.BidVolume !== null && item.Call.BidVolume > parseInt(volume_grater_then);
                }
                if (!volume_grater_then && volume_less_then) {
                    return item.Call.BidVolume !== null && item.Call.BidVolume < parseInt(volume_less_then);
                }
                if (volume_grater_then && volume_less_then) {
                    return item.Call.BidVolume !== null && (item.Call.BidVolume > parseInt(volume_grater_then) && item.Call.BidVolume < parseInt(volume_less_then));
                }
                return item;
            });
        }

        if (delta_grater_then || delta_less_then) {
            OptionSnapshotDataDelta = this.OptionSnapshotData.filter((item: any) => {
                if (delta_grater_then && !delta_less_then) {
                    return item.Call.Delta !== null && item.Call.Delta > parseFloat(delta_grater_then);
                }
                if (!delta_grater_then && delta_less_then) {
                    return item.Call.Delta !== null && item.Call.Delta < parseFloat(delta_less_then);
                }
                if (delta_grater_then && delta_less_then) {
                    return item.Call.Delta !== null && (item.Call.Delta > parseFloat(delta_grater_then) && item.Call.Delta < parseFloat(delta_less_then));
                }
                return item;
            });
        }

        if (open_interest_grater_then || open_interest_less_then) {
            OptionSnapshotDataOpenInt = this.OptionSnapshotData.filter((item: any) => {
                if (open_interest_grater_then && !open_interest_less_then) {
                    return item.Call.OpenInt !== null && item.Call.OpenInt > parseFloat(open_interest_grater_then);
                }
                if (!open_interest_grater_then && open_interest_less_then) {
                    return item.Call.OpenInt !== null && item.Call.OpenInt < parseFloat(open_interest_less_then);
                }
                if (open_interest_grater_then && open_interest_less_then) {
                    return item.Call.OpenInt !== null && (item.Call.OpenInt > parseFloat(open_interest_grater_then) && item.Call.OpenInt < parseFloat(open_interest_less_then));
                }
                return item;
            });
        }

        this.OptionSnapshotData = [].concat(OptionSnapshotDataVolume, OptionSnapshotDataDelta, OptionSnapshotDataOpenInt);
        if (!OptionSnapshotDataVolume.length && !OptionSnapshotDataDelta.length && !OptionSnapshotDataOpenInt.length) {
            this.OptionSnapshotData = this.OptionSnapshotDataClone;
        }

        this.tableScrollByType(this.selectedType);
    }

    filterColumns(index: number) {
        this.placeOrderColumns[index].checked = !this.placeOrderColumns[index].checked;
        setTimeout(() => this.table1Scroll.nativeElement.scrollLeft += 9999999999 * 2, 1000);
        setTimeout(() => this.table3Scroll.nativeElement.scrollLeft += 0, 1000);
    }

    @HostListener('window:scroll', ['$event']) scrollTable4Handler($event: any) {
        let table4ScrollTop = this.table4Scroll.nativeElement.scrollTop;
        //let table1ScrollTop = this.table1Scroll.nativeElement.scrollTop;
        //let table2ScrollTop = this.table2Scroll.nativeElement.scrollTop;
        //let table3ScrollTop = this.table3Scroll.nativeElement.scrollTop;

        //this.dynamicStyleTable4 = {'margin-top': '-'+table4ScrollTop+'px'};
        ////this.dynamicStyleTable1 = {'margin-top': '-'+table4ScrollTop+'px'};
        //this.dynamicStyleTable2 = {'margin-top': '-'+table4ScrollTop+'px'};
        //this.dynamicStyleTable3 = {'margin-top': '-'+table4ScrollTop+'px'};

        //this.table4Scroll.nativeElement.scrollTop = table3ScrollTop;
        this.table1Scroll.nativeElement.scrollTop = table4ScrollTop;
        //this.table2Scroll.nativeElement.scrollTop = table3ScrollTop;
        //this.table3Scroll.nativeElement.scrollTop = table3ScrollTop;
    }

    @HostListener('window:scroll', ['$event']) scrollTable1Handler($event: any) {
        //let table4ScrollTop = this.table4Scroll.nativeElement.scrollTop;
        let table1ScrollTop = this.table1Scroll.nativeElement.scrollTop;
        //let table2ScrollTop = this.table2Scroll.nativeElement.scrollTop;
        //let table3ScrollTop = this.table3Scroll.nativeElement.scrollTop;

        ////this.dynamicStyleTable4 = {'margin-top': '-'+table1ScrollTop+'px'};
        //this.dynamicStyleTable1 = {'margin-top': '-'+table1ScrollTop+'px'};
        ////this.dynamicStyleTable2 = {'margin-top': '-'+table1ScrollTop+'px'};
        ////this.dynamicStyleTable3 = {'margin-top': '-'+table1ScrollTop+'px'};

        if (this.selectedType == 'Call') {
            this.table4Scroll.nativeElement.scrollTop = table1ScrollTop;
        }
        //this.table1Scroll.nativeElement.scrollTop = table1ScrollTop;
        this.table2Scroll.nativeElement.scrollTop = table1ScrollTop;
        this.table3Scroll.nativeElement.scrollTop = table1ScrollTop;
    }
    @HostListener('window:scroll', ['$event']) scrollTable2Handler($event: any) {
        //let table4ScrollTop = this.table4Scroll.nativeElement.scrollTop;
        //let table1ScrollTop = this.table1Scroll.nativeElement.scrollTop;
        let table2ScrollTop = this.table2Scroll.nativeElement.scrollTop;
        //let table3ScrollTop = this.table3Scroll.nativeElement.scrollTop;

        //this.dynamicStyleTable4 = {'margin-top': '-'+table2ScrollTop+'px'};
        ////this.dynamicStyleTable1 = {'margin-top': '-'+table2ScrollTop+'px'};
        //this.dynamicStyleTable2 = {'margin-top': '-'+table2ScrollTop+'px'};
        ////this.dynamicStyleTable3 = {'margin-top': '-'+table2ScrollTop+'px'};

        //this.table4Scroll.nativeElement.scrollTop = table2ScrollTop;
        this.table1Scroll.nativeElement.scrollTop = table2ScrollTop;
        //this.table2Scroll.nativeElement.scrollTop = table2ScrollTop;
        this.table3Scroll.nativeElement.scrollTop = table2ScrollTop;
    }
    @HostListener('window:scroll', ['$event']) scrollTable3Handler($event: any) {
        //let table4ScrollTop = this.table4Scroll.nativeElement.scrollTop;
        //let table1ScrollTop = this.table1Scroll.nativeElement.scrollTop;
        //let table2ScrollTop = this.table2Scroll.nativeElement.scrollTop;
        let table3ScrollTop = this.table3Scroll.nativeElement.scrollTop;

        //this.dynamicStyleTable4 = {'margin-top': '-'+table3ScrollTop+'px'};
        ////this.dynamicStyleTable1 = {'margin-top': '-'+table3ScrollTop+'px'};
        ////this.dynamicStyleTable2 = {'margin-top': '-'+table3ScrollTop+'px'};
        //this.dynamicStyleTable3 = {'margin-top': '-'+table3ScrollTop+'px'};

        //this.table4Scroll.nativeElement.scrollTop = table3ScrollTop;
        this.table1Scroll.nativeElement.scrollTop = table3ScrollTop;
        this.table2Scroll.nativeElement.scrollTop = table3ScrollTop;
        //this.table3Scroll.nativeElement.scrollTop = table3ScrollTop;
    }

    async initBrokerAccounts(){
        this.brokerTypes = [
          {
            id: 1,
            name: 'Interactive Brokers',
            image: '//am708403.blob.core.windows.net/images/optionpi/img/Interactive.png',
            link: '',
          },
          {
            id: 2,
            name: 'Tiger',
            image: '//am708403.blob.core.windows.net/images/optionpi/img/tiger.png',
            link: 'https://www.tigersecurities.com/login?invite=QUANT&ne=https://quant.itigerup.com/developer#developer',
          },
          // {
          //   id: 3,
          //   name: 'FUTU',
          //   image: '//am708403.blob.core.windows.net/images/optionpi/img/futu.png',
          //   link: '',
          // },
          
        ]
        
        this.SelectedBroker = this.brokerTypes[0];
        this.allBrokerAccounts = [];
        if (localStorage.getItem('accountSelections') !== null) {
          this.allBrokerAccounts = JSON.parse(localStorage.getItem('accountSelections') || '[]');
        }
        this.brokerAccounts = this.allBrokerAccounts.filter(function (x: any) {
          return x.brokerType === 'Interactive Brokers';
        })
        console.log( this.allBrokerAccounts)
        this.AvailableBrokerAccounts = this.allBrokerAccounts.filter(function (x: any) {
          
          return x.brokerType != "FUTU" ;
          // return x.brokerType === 'Tiger';
        })
    
        this.SelectedBrokerAccount = this.brokerAccounts[0];
      }
}