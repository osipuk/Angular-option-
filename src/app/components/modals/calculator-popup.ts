import { Component, Input, OnInit } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { EMPTY, Observable, of } from "rxjs";
import { Product } from "src/app/interface/product";
import { CalculatorService } from "src/app/_service/calculator.service";
import { UtilityService } from "src/app/_service/utility.service";
import { ComputePayOffMetricsRequest } from '../../interface/compute-metrics-for-analyzePayoff';
import { CalculatePayoffRequest } from "src/app/interface/calculate-payoff-request";
import { CalculateModelValuationRequest } from "src/app/interface/calculate-modelValuation-request";
import { CalculateModelValuationResult } from "src/app/interface/calculate-modelValuation-result";

import { ProductService } from "src/app/_service/product.service";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlaceOrderByStrategyComponent } from 'src/app/components/modals/place-order-by-strategy';

@Component({
    templateUrl: './calculator-popup.html',
    styleUrls: ['./calculator-popup.css']
})
export class CalculatorPopupComponent implements OnInit {
    @Input() currentTradeTab: string = 'by-product';
    @Input() SelectedStrategy: string;
    @Input() SelectedProduct?: Product;
    @Input() SelectedStockDirection: string;
    @Input() SelectedStockQuantity: number;
    @Input() SelectedLegs: any;
    @Input() OptionContract: string ='';

    @Input() Underlying: string = '';
    @Input() Strategy: string = '';
    @Input() DropDownClicked: boolean = false;

    MaxProfitLoss$: Observable<any>;
    CalculatorFormGroup: FormGroup;
    ProfitLossResult$: Observable<number>;
    PriceGap$: Observable<CalculateModelValuationResult["PriceGap"]>;
    Valuation$: Observable<CalculateModelValuationResult["Valuation"]>;

    compareItem: string = 'higher';
    radioChecked: string = 'payOff';
    hoveredData: any;
    CalcData : any[] = [];

    constructor(public modal: NgbActiveModal,
        private formBuilder: FormBuilder,
        private utilityService: UtilityService,
        private productService: ProductService,
        private modalService: NgbModal,
        private calculatorService: CalculatorService) {
        var stgList = this.utilityService.getStrategySelections();

        this.SelectedStrategy = "";
        this.SelectedStockDirection = "Long";
        this.SelectedStockQuantity = 1;
        
        this.MaxProfitLoss$ = EMPTY;
        this.ProfitLossResult$ = of(0);
        this.PriceGap$ = of(0);
        this.Valuation$ = of(0);

        this.CalculatorFormGroup = this.formBuilder.group({
            Strategy: [stgList[0]],
            Symbol: new FormControl(""),
            OptionContract:'',
            Capital:0,
            Stock: { Direction: "", Quantity: 0 },
            NextState: this.formBuilder.group({
                Legs: this.formBuilder.array([
                    this.formBuilder.group({
                        LegId: 0,
                        IV: 0
                    })
                ]),
                StockPrice: 0,
                Period: 0,
                ATMMeanIV: 0,
                DividendYield: 0,
                RiskFreeRate: 0,
            }),
            CurrentState: this.formBuilder.group({
                Legs: this.formBuilder.array([
                    this.formBuilder.group({
                        LegId: 0,
                        IV: 0
                    })
                ]),
                StockPrice: 0,
                BundlePrice:0,
                ATMMeanIV: 0,
                DividendYield: 0,
                RiskFreeRate: 0,
                MeanSkew: 0,
                DaysToExpiry: 0
            })
        });
    }

    ngOnInit (): void {
        this.ProfitLossResult$ = of(0);
        var currentState = this.CalculatorFormGroup.get('CurrentState.Legs') as FormArray;
        var nextState = this.CalculatorFormGroup.get('NextState.Legs') as FormArray;
        nextState.clear()
        currentState.clear()

        this.CalculatorFormGroup.patchValue({ Symbol: this.SelectedProduct?.Symbol });
        this.CalculatorFormGroup.patchValue({ Strategy: this.SelectedStrategy });
        this.CalculatorFormGroup.patchValue({ OptionContract: this.OptionContract });

        var obj = {
            Strategy: this.SelectedStrategy,
            Symbol: this.SelectedProduct?.Symbol,
            Stock: {
                Direction: this.SelectedStockDirection,
                Quantity: this.SelectedStockQuantity
            },
            Options:this.SelectedLegs,
        }

        // debugger
        this.MaxProfitLoss$ = this.calculatorService.getMaxProfitLoss(obj);

        // this.calculatorService.getCurrentState(obj).subscribe(result => {
        //     console.log(result)
        //     var group = result.Legs.map(x => this.formBuilder.group(
        //         {
        //             LegId: x.LegId,
        //             IV: x.IV,
        //         }
        //     ));

        //     var nextGroup = result.Legs.map(x => this.formBuilder.group(
        //         {
        //             LegId: x.LegId,
        //             IV: x.IV * 100,
        //         }
        //     ));

        //     this.CalculatorFormGroup.get('CurrentState')?.patchValue({ StockPrice: result.StockPrice });
        //     this.CalculatorFormGroup.get('NextState')?.patchValue({ StockPrice: result.StockPrice });
        //     group.forEach(Leg => currentState.push(Leg));
        //     nextGroup.forEach(Leg => nextState.push(Leg));
        // })
        this.getMetricsAnalyzePayoff();
        this.CalcData = [this.CalculatorFormGroup.value.Symbol, this.CalculatorFormGroup.value.OptionContract];
    }

    payoffClicked(event: any) {
        this.radioChecked = 'payOff';
        this.getMetricsAnalyzePayoff();
    }

    valuationClicked(event: any) {
        this.radioChecked = 'valuation';
        this.getMetricsAnalyzeModalValuation();
    }

    capitalChange(event: any) {
        this.CalculatorFormGroup.patchValue({ Capital: event.target.value });
        console.log(this.CalculatorFormGroup.value.Capital)
    }

    nextStateChange(event: any) {
        const formControlName = event.target.getAttribute('formControlName');
        this.CalculatorFormGroup.get('NextState')?.patchValue({ [formControlName]: event.target.value });
    }
    
    computeProfitLoss() {
        if(this.radioChecked == 'payOff'){
            const requestObj:CalculatePayoffRequest = {
                Strategy: this.SelectedStrategy,
                Underlying: this.SelectedProduct?.Symbol,
                OptionContracts:this.OptionContract,
                Capital: this.CalculatorFormGroup.value.Capital / 1,
                UnderlyingPrice:this.CalculatorFormGroup.get('CurrentState.StockPrice')?.value,
                BundlePrice: this.CalculatorFormGroup.get('CurrentState.BundlePrice')?.value,
                AtmIV: this.CalculatorFormGroup.get('CurrentState.ATMMeanIV')?.value,
                DivYield: this.CalculatorFormGroup.get('CurrentState.DividendYield')?.value,
                RiskFreeRate: this.CalculatorFormGroup.get('CurrentState.RiskFreeRate')?.value,
                DaysToExpiry: this.CalculatorFormGroup.get('CurrentState.DaysToExpiry')?.value,
                NextStateDays: this.CalculatorFormGroup.get('NextState.Period')?.value / 1,
                NextStateUnderlyingPrice:  this.CalculatorFormGroup.get('NextState.StockPrice')?.value / 1,
                NextStateAtmIV:  this.CalculatorFormGroup.get('NextState.ATMMeanIV')?.value / 100,
                NextStateRiskFreeRate:  this.CalculatorFormGroup.get('NextState.RiskFreeRate')?.value / 100,
                NextStateDivYield:  this.CalculatorFormGroup.get('NextState.DividendYield')?.value / 100,
            }

            console.log(requestObj)
            
            this.calculatorService.calculatePayoff(requestObj).subscribe(result => {
                this.ProfitLossResult$ = of(Math.ceil(result));
            });
        }else if(this.radioChecked == 'valuation'){
            const requestObj : CalculateModelValuationRequest = {
                Strategy: this.SelectedStrategy,
                Underlying: this.SelectedProduct?.Symbol,
                OptionContracts:this.OptionContract,
                UnderlyingPrice:this.CalculatorFormGroup.get('CurrentState.StockPrice')?.value,
                BundlePrice: this.CalculatorFormGroup.get('CurrentState.BundlePrice')?.value,
                AtmIV: this.CalculatorFormGroup.get('CurrentState.ATMMeanIV')?.value,
                DivYield: this.CalculatorFormGroup.get('CurrentState.DividendYield')?.value,
                RiskFreeRate: this.CalculatorFormGroup.get('CurrentState.RiskFreeRate')?.value,
            }

            this.calculatorService.calculateModelValuation(requestObj).subscribe(result => {
                this.PriceGap$ = of(Math.ceil(result.PriceGap));
                this.Valuation$ = of(Math.ceil(result.Valuation));
                this.compareItem = result.Valuation > 0 ? 'higher' : 'lower'; 
            });
        }
    }

    getMetricsAnalyzePayoff() {
        var obj: ComputePayOffMetricsRequest = {
            Strategy: this.SelectedStrategy,
            Underlying: this.SelectedProduct?.Symbol ,
            OptionContracts: this.OptionContract,
        }

        this.calculatorService.getMetricsForAnalyzePayoff(obj).subscribe(result => {
            this.CalculatorFormGroup.get('CurrentState')?.patchValue({ MeanSkew: result.MeanSkew });
            this.CalculatorFormGroup.get('CurrentState')?.patchValue({ DaysToExpiry: result.DaysToExpiry });
            this.CalculatorFormGroup.get('CurrentState')?.patchValue({ StockPrice: result.UnderlyingPrice });
            this.CalculatorFormGroup.get('CurrentState')?.patchValue({ BundlePrice: result.BundlePrice });
            this.CalculatorFormGroup.get('CurrentState')?.patchValue({ ATMMeanIV: result.AtmIV });
            this.CalculatorFormGroup.get('CurrentState')?.patchValue({ DividendYield: result.DivYield });
            this.CalculatorFormGroup.get('CurrentState')?.patchValue({ RiskFreeRate: result.RiskFreeRate });

            console.log(result)
        })
    }

    getMetricsAnalyzeModalValuation() {
        var obj: ComputePayOffMetricsRequest = {
            Strategy: this.SelectedStrategy,
            Underlying: this.SelectedProduct?.Symbol,
            OptionContracts: this.OptionContract,
        }

        this.calculatorService.getMetricsForAnalyzeModalValuation(obj).subscribe(result => {
            console.log(result)
            this.CalculatorFormGroup.get('CurrentState')?.patchValue({ StockPrice: result.UnderlyingPrice });
            this.CalculatorFormGroup.get('CurrentState')?.patchValue({ BundlePrice: result.BundlePrice });
            this.CalculatorFormGroup.get('CurrentState')?.patchValue({ ATMMeanIV: result.AtmIV });
            this.CalculatorFormGroup.get('CurrentState')?.patchValue({ DividendYield: result.DivYield });
            this.CalculatorFormGroup.get('CurrentState')?.patchValue({ RiskFreeRate: result.RiskFreeRate });
        })
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
    
    extractDateAndValues(OptionContract: any): string {
        const strElements = OptionContract.split(' ').length - 2;
        const dateAndValues = OptionContract.split(' ').slice(strElements).join(' ');
        return dateAndValues;
    }

    loadOptionModal(): void {    
        this.modal.dismiss();
        const modalRef = this.modalService.open(PlaceOrderByStrategyComponent, { size: 'lg'});
        modalRef.componentInstance.SelectedStrategy = this.SelectedStrategy;  
        modalRef.componentInstance.SelectedStrategyDisplay = this.utilityService.getStrategyDisplayName(this.SelectedStrategy);  
        modalRef.componentInstance.SelectedProduct = this.SelectedProduct;
        modalRef.componentInstance.OptionContract = this.OptionContract;
        // modalRef.componentInstance.MaxProfit = this.MaxProfit;
        // modalRef.componentInstance.MaxLoss = this.MaxLoss;
    }
}
