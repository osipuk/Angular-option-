import { Component, OnInit, Input, HostListener, ViewEncapsulation, ElementRef, ViewChild, AfterViewChecked, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import {  take } from 'rxjs/operators';
import { OptionsStrategy } from 'src/app/interface/options-strategy';
import { IvPrediction } from 'src/app/interface/iv-prediction';
import { HvPrediction } from 'src/app/interface/hv-prediction';
import { BehaviourPrediction } from 'src/app/interface/behaviour-prediction';
import { SentimentPrediction } from 'src/app/interface/sentiment-prediction';
import { StockPricePrediction } from 'src/app/interface/stock-price-prediction';
import { ScreenerService } from './screener.service';
import { ProductService } from 'src/app/_service/product.service';
import { UtilityService } from 'src/app/_service/utility.service';
import { ExpiryDate } from 'src/app/interface/expiry-date';
import { StockUniverseType } from 'src/app/interface/stock-universeType';
import { stockUniverse } from 'src/app/interface/stockUniverse';
import { GetScreenerDataRequest } from '../../../../interface/screener-table-data'
import { GetScreenerDataResult } from 'src/app/interface/options-screener-result';

import { AnalysisFilter } from 'src/app/interface/analysis-filter';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlaceOrderByStrategyComponent } from 'src/app/components/modals/place-order-by-strategy';

declare var $: any;
declare var window: any;

@Component({
  selector: 'ow-main-screener-tab',
  templateUrl: './screener.component.html',
  styleUrls: ['./screener.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ScreenerComponent implements OnInit, AfterViewChecked {
  disableButton: boolean = false;
  moreFilterClicked: boolean = false;
  SelectedAnalysisFilterList: AnalysisFilter[];
  IV_Prediction:string;
  // Get ScreenerData Variables Start
  GetScreenerDataResult: GetScreenerDataResult;
  
  SelectedStrategy: OptionsStrategy;
  SelectedIVPrediction: IvPrediction;
  SelectedStockUniverseType: StockUniverseType;
  SelectedExpiryDate: ExpiryDate;
  
  StockUniverseTypeList: StockUniverseType[];
  StrategyList: OptionsStrategy[];
  StockPredictionList: StockPricePrediction[];
  IVPredictionList: IvPrediction[];
  IVPredictionName :IvPrediction;
  HVPredictionList:HvPrediction[];
  HVPredictionName:HvPrediction;
  BehaviourPredictionList:BehaviourPrediction[];
  BehaviourPredictionName:BehaviourPrediction;
  SentimentPredictionList:SentimentPrediction[];
  SentimentPredictionName:SentimentPrediction;
  ExpiryDateList: ExpiryDate[];

  selectedColumnList:any[];

  hoveredData: any;

  CurrentPage: number;
  TotalPage: number;
  ItemPerPage: number;
  IsFirstPage: boolean;
  IsLastPage: boolean;
  Pages: number[];
  IsPremiumUser:any;
  formModal: any;
  IVPredictionName1 : any = {};
  isLoadingScreenerResult: Boolean = false;

  currentSortedColumn = {
    name: 'Symbol',
    type: 'Asc'
  }

  //Custom filter tab vars
  stockUniverseList: stockUniverse[];
  selectedStockUniverseList: stockUniverse[];
  selectedStockUniverse: stockUniverse;

  columnList: any = [];
  IVCheck: boolean = true;
  IVUnCheck:boolean = false;
  columnShareFilterCheckedArrayList: any = [];

  breakEvenDistanceList: any = [];
  otmDistanceList: any = [];
  
  selectedbreakEvenDistance: any = '';
  selectedotmDistance: any = '';
  
  constructor(private router: Router,
    private screenerService: ScreenerService,
    private productService: ProductService,
    private utilityService: UtilityService,
    private modalService: NgbModal) {
      
    this.SelectedAnalysisFilterList = []
    
    this.StrategyList = utilityService.getStrategySelections();

    this.ExpiryDateList = this.getExpiryDate();

    this.IVPredictionList = utilityService.getIVPredictionSelections();
    this.HVPredictionList = utilityService.getHVPredictionSelections();
    this.BehaviourPredictionList = utilityService.getBehaviourPredictionSelections();
    this.SentimentPredictionList = utilityService.getSentimentPredictionSelections();
    
    this.StockPredictionList = utilityService.getStockPredictionSelections();

    this.StockUniverseTypeList = utilityService.getStockUniverseTypeList();

    this.SelectedStockUniverseType = this.StockUniverseTypeList[0]
    this.IVPredictionName = this.IVPredictionList[0];
    this.HVPredictionName = this.HVPredictionList[0]; 
    this.BehaviourPredictionName = this.BehaviourPredictionList[0]; 
    this.SentimentPredictionName = this.SentimentPredictionList[0]; 

    this.IV_Prediction = $('#IVPrediction_ID').val();


    this.selectedColumnList = [
      'Underlying',
      'Name',
      'Option Contracts',
      'Underlying Price',
      // 'HV Prediction',
      // 'IV Prediction',
      // 'Behavior Prediction',
      // 'Sentiment Prediction',
    ];
    
    this.columnShareFilterCheckedArrayList = [
      {name:'Underlying', checked:true, },
      {name:'Name', checked:true, },
      {name:'Option Contracts', checked:true, },
      {name:'Underlying Price', checked:true, },
      // {name:'HV Prediction', checked:true,  },
      // {name:'IV Prediction', checked:true,  },
      // {name:'Behavior Prediction', checked:true,  },
      // {name:'Sentiment Prediction', checked:true,  },
    ]

    this.SelectedExpiryDate = this.ExpiryDateList[0];
    this.SelectedStrategy = this.StrategyList[0];
    this.SelectedIVPrediction = this.IVPredictionList[0];

    this.GetScreenerDataResult = { Data:[], TotalData:0, TotalDataFiltered:0 }

    this.CurrentPage = 1;
    this.TotalPage = 1;
    this.ItemPerPage = 10;
    this.IsFirstPage = true;
    this.IsLastPage = true;
    this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);

    //Custom filter tab vars
    this.stockUniverseList = utilityService.getStockUniverseList();
    this.selectedStockUniverseList = [{id:1,name:'US', value:'US'}];
    this.selectedStockUniverse = this.selectedStockUniverseList[0];
    this.IsPremiumUser = false;

    this.columnList = [
      {name:'Underlying', checked:true, },
      {name:'Name', checked:true, },
      {name:'Option Contracts', checked:true, },
      {name:'Breakeven Price 1', checked:false,  },
      {name:'Breakeven Price 2', checked:false,  },
      {name:'Max Loss', checked:false,  },
      {name:'Max Profit', checked:false,  },
      {name:'Max Profit To Loss', checked:false,  },
      {name:'NetPremium', checked:false,  },
      {name:'NetPremium To Max Loss', checked:false,  },
      {name:'Risk Neutral WinProbability', checked:false, },
      {name:'Delta', checked:false, },
      {name:'Gamma', checked:false, },
      {name:'HV', checked:false, },
      {name:'IV', checked:false, },
      {name:'IV Change', checked:false, },
      {name:'Underlying Price', checked:true, },
      // {name:'HV Prediction', checked:true,  },
      // {name:'IV Prediction', checked:true,  },
      // {name:'Behavior Prediction', checked:true,  },
      // {name:'Sentiment Prediction', checked:true,  },
    ];

    this.breakEvenDistanceList = this.getBreakEvenDistance();
    this.otmDistanceList = this.getOtmDistance();


    this.selectedbreakEvenDistance = this.breakEvenDistanceList[0];
    this.selectedotmDistance = this.otmDistanceList[0];
    
    this.selectedbreakEvenDistance = this.breakEvenDistanceList[0];

    //Analysis Filter -> Fundamental -> Categorisation
    // this.getSectorSelections();
    // this.getIndustrySelections();
  }
  
  // getSectorSelections(){
  //   this.screenerService.getSectorSelections().subscribe(result => {
  //     if (result && result.Data) {
  //       this.analysisFilterFundamental.categorisation.sector.value = result.Data.map(({SectorId, SectorName: name})=>({SectorId, name, checked: false}));
  //     }
  //   });
  // }
  // getIndustrySelections(){
  //   this.screenerService.getIndustrySelections().subscribe(result => {
  //     if (result && result.Data) {
  //       this.analysisFilterFundamental.categorisation.industry.value = result.Data.map(({IndustryId, IndustryName: name})=>({IndustryId, name, checked: false}));
  //     }
  //   });
  // }
  
  ngAfterViewChecked() {
  }

  ngAfterViewInit() {

  }

  extractContract(screenerData: any): string {
    const dataFromAPI = screenerData.OptionContracts;
    const contractParts  = dataFromAPI.split(' ');
    const contractIndex = contractParts.findIndex((part:any) => /^\d{4}-\d{2}-\d{2}$/.test(part));

    if (contractIndex !== -1) {
      const randomString = contractParts.slice(0, contractIndex).join(' ');
      return randomString;
    }

    return '';
  }

  extractDateAndValues(screenerData: any): string {
    const dataFromAPI = screenerData.OptionContracts;
    const strElements = dataFromAPI.split(' ').length - 2;
    const dateAndValues = dataFromAPI.split(' ').slice(strElements).join(' ');
    return dateAndValues;
  }

  generateScreenerResult() {
    this.setCustomColumn(this.columnShareFilterCheckedArrayList);

    this.isLoadingScreenerResult = true;
    this.disableButton = true;
    setTimeout(() => {
      this.disableButton = false;
    }, 5000); 

    var requestObj: GetScreenerDataRequest = {
      SelectBy: this.SelectedStockUniverseType.value,
      DefaultUniverse: this.selectedStockUniverse.value,
      TimeToExpiry: this.SelectedExpiryDate.value,
      BreakevenDistance: this.selectedbreakEvenDistance.value,
      Strategy: this.SelectedStrategy.Display,
      OtmDistance: this.selectedotmDistance.value,
      Sort: this.currentSortedColumn.name,
      Order: this.currentSortedColumn.type,
      Offset: (this.CurrentPage - 1) * 10,
      Limit: 10
    }

    console.log("Generating screen request...", requestObj);
    this.screenerService.getScreenerData(requestObj).subscribe(result => {
      if (result && result.Data) {
        this.GetScreenerDataResult = result;
        console.log(this.GetScreenerDataResult)
        this.TotalPage = Math.floor(this.GetScreenerDataResult.TotalData / this.ItemPerPage) + 1;
        console.log(this.TotalPage)
        this.IsFirstPage = this.CurrentPage === 1;
        this.IsLastPage = this.CurrentPage === this.TotalPage;
        this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
      }
      this.isLoadingScreenerResult = false;
    });
  }

  previousPage() {
    this.CurrentPage--;
    this.isLoadingScreenerResult = true;

    var requestObj: GetScreenerDataRequest = {
      SelectBy: this.SelectedStockUniverseType.value,
      DefaultUniverse: this.selectedStockUniverse.value,
      TimeToExpiry: this.SelectedExpiryDate.value,
      BreakevenDistance: this.selectedbreakEvenDistance.value,
      Strategy: this.SelectedStrategy.Display,
      OtmDistance: this.selectedotmDistance.value,
      Sort: this.currentSortedColumn.name,
      Order: this.currentSortedColumn.type,
      Offset: (this.CurrentPage - 1) * 10,
      Limit: 10
    }

    console.log("Scanning previous page...", JSON.stringify(requestObj));
    this.screenerService.getScreenerData(requestObj).subscribe(result => {
      if (result && result.Data) {
        this.GetScreenerDataResult = result;
        console.log(this.GetScreenerDataResult)
        this.TotalPage = Math.floor(this.GetScreenerDataResult.TotalData / this.ItemPerPage) + 1;
        console.log(this.TotalPage)
        this.IsFirstPage = this.CurrentPage === 1;
        this.IsLastPage = this.CurrentPage === this.TotalPage;
        this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
      }
      this.isLoadingScreenerResult = false;
    });
  }

  nextPage() {
    this.isLoadingScreenerResult = true;
    this.CurrentPage++;
    var requestObj: GetScreenerDataRequest = {
      SelectBy: this.SelectedStockUniverseType.value,
      DefaultUniverse: this.selectedStockUniverse.value,
      TimeToExpiry: this.SelectedExpiryDate.value,
      BreakevenDistance: this.selectedbreakEvenDistance.value,
      Strategy: this.SelectedStrategy.Display,
      OtmDistance: this.selectedotmDistance.value,
      Sort: this.currentSortedColumn.name,
      Order: this.currentSortedColumn.type,
      Offset: (this.CurrentPage - 1) * 10,
      Limit: 10
    }

    console.log("Scanning next page...", JSON.stringify(requestObj));
    this.screenerService.getScreenerData(requestObj).subscribe(result => {
      if (result && result.Data) {
        this.GetScreenerDataResult = result;
        console.log(this.GetScreenerDataResult)
        this.TotalPage = Math.floor(this.GetScreenerDataResult.TotalData / this.ItemPerPage) + 1;
        console.log(this.TotalPage)
        this.IsFirstPage = this.CurrentPage === 1;
        this.IsLastPage = this.CurrentPage === this.TotalPage;
        this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
      }
      this.isLoadingScreenerResult = false;
    });
  }

  goToPage(pageNum: number) {
    this.isLoadingScreenerResult = true;
    this.CurrentPage = pageNum;

    var requestObj: GetScreenerDataRequest = {
      SelectBy: this.SelectedStockUniverseType.value,
      DefaultUniverse: this.selectedStockUniverse.value,
      TimeToExpiry: this.SelectedExpiryDate.value,
      BreakevenDistance: this.selectedbreakEvenDistance.value,
      Strategy: this.SelectedStrategy.Display,
      OtmDistance: this.selectedotmDistance.value,
      Sort: this.currentSortedColumn.name,
      Order: this.currentSortedColumn.type,
      Offset: (this.CurrentPage - 1) * 10,
      Limit: 10
    }

    console.log("Scanning next page...", JSON.stringify(requestObj));
    this.screenerService.getScreenerData(requestObj).subscribe(result => {
      if (result && result.Data) {
        this.GetScreenerDataResult = result;
        console.log(this.GetScreenerDataResult)
        this.TotalPage = Math.floor(this.GetScreenerDataResult.TotalData / this.ItemPerPage) + 1;
        console.log(this.TotalPage)
        this.IsFirstPage = this.CurrentPage === 1;
        this.IsLastPage = this.CurrentPage === this.TotalPage;
        this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
      }
      this.isLoadingScreenerResult = false;
    });
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

  sortColumns(columnName: string, orderType: string){
    this.currentSortedColumn = {
      name: columnName,
      type: orderType
    }
    this.generateScreenerResult();
  }

  ngOnInit(): void {
   
    this.updateGenerateButtonState();
    this.generateScreenerResult(); 
    this.screenerService.IsPremiumUser().subscribe(result => {
      this.IsPremiumUser = result;
      if(this.IsPremiumUser == true){
        this.columnShareFilterCheckedArrayList = [
          {name:'Underlying', checked:true, },
          {name:'Name', checked:true, },
          {name:'Option Contracts', checked:true, },
          {name:'Underlying Price', checked:true, },
          {name:'HV Prediction', checked:true,  },
          {name:'IV Prediction', checked:true,  },
          {name:'Behavior Prediction', checked:true,  },
          {name:'Sentiment Prediction', checked:true,  },
        ]
        this.columnList = [
          {name:'Underlying', checked:true, },
          {name:'Name', checked:true, },
          {name:'Option Contracts', checked:true, },
          {name:'Breakeven Price 1', checked:false,  },
          {name:'Breakeven Price 2', checked:false,  },
          {name:'Max Loss', checked:false,  },
          {name:'Max Profit', checked:false,  },
          {name:'Max Profit To Loss', checked:false,  },
          {name:'NetPremium', checked:false,  },
          {name:'NetPremium To Max Loss', checked:false,  },
          {name:'Risk Neutral WinProbability', checked:false, },
          {name:'Delta', checked:false, },
          {name:'Gamma', checked:false, },
          {name:'HV', checked:false, },
          {name:'IV', checked:false, },
          {name:'IV Change', checked:false, },
          {name:'Underlying Price', checked:true, },
          {name:'HV Prediction', checked:true,  },
          {name:'IV Prediction', checked:true,  },
          {name:'Behavior Prediction', checked:true,  },
          {name:'Sentiment Prediction', checked:true,  },
        ];
        this.selectedColumnList = [
          'Underlying',
          'Name',
          'Option Contracts',
          'Underlying Price',
          'HV Prediction',
          'IV Prediction',
          'Behavior Prediction',
          'Sentiment Prediction',
        ];
      }
    });
    
     
  }

  ngOnDestroy() {
  }

  //Custom filter tab functions
  moreStockCriteria(){

  }

  filterClick(){
    console.log("A.I filter clicked")
    if(this.IsPremiumUser == true){
      // $('#generatetop').css('display','none');
      if(window.innerWidth > 992){
        $('.closebtn').css('display','flex');
      }else{
        // $('.closebtn_mobile').css('display','flex','important');
        $('.closebtn_mobile').attr('style','display:flex !important;');
        console.log(window.innerWidth,'11111')
      }
       
    }
    else{
      // this.formModal = new window.bootstrap.Modal(
      //   document.getElementById('UnPremiumUser')
      // );
      // this.formModal.show();
      $('#UnPremiumUser').modal('show');
    }
  }
  closebtn(){
    // $('#generatetop').css('display','flex');
    if(window.innerWidth > 992){
      $('.closebtn').css('display','none');
    }else{
      $('.closebtn_mobile').css('display','none');
    }
  }
  IVclick() {
    $('#IVPrediction_modal').modal('show');
  }
  HVclick() {
    $('#HVPrediction_modal').modal('show');
  }
  Behaviourclick() {
    $('#BehaviourPrediction_modal').modal('show');
  }
  Sentimentclick() {
    $('#SentimentPrediction_modal').modal('show');
  }
  onBackIVClick(){
    $('#IVPrediction_modal').modal('hide');
  }
  onBackHVClick(){
    $('#HVPrediction_modal').modal('hide');
  }
  onBackSentimentClick(){
    $('#SentimentPrediction_modal').modal('hide');
  }
  onBackBehaviourClick(){
    $('#BehaviourPrediction_modal').modal('hide');
  }
  UnPremiumUserClick(){
    $('#UnPremiumUser').modal('hide');
  }
  getIVSelect(getIVSelect:any){
    // console.log(getIVSelect.Id + getIVSelect.Name,'getIVSelect')
      this.IVPredictionName = getIVSelect ;
      
  }
  getHVSelect(getHVSelect:any){
    console.log(getHVSelect.Id + getHVSelect.Name,'getHVSelect')
    console.log(this.HVPredictionName.Id + this.HVPredictionName.Name,"HVprediction");
    this.HVPredictionName = getHVSelect ;
  }
  getBehaviourSelect(getBehaviourSelect:any){
    this.BehaviourPredictionName = getBehaviourSelect ;
  }
  getSentimentSelect(getSentimentSelect:any){
    this.SentimentPredictionName = getSentimentSelect ;
  }





  //Column Btn click 
  columnBtnClick() {
    console.log("column btn clicked!!!!")
  }

  //Analysis Functions
  openMobileAnalysis() {
    $('#customModal').modal('show'); 
  }
  closeMobileAnalysis() {
    $('#customModal').modal('hide'); 
    this.moreFilterClicked = false;
  }

  showScreenerColumn() {
    $("#ColumnList").modal('show');
    $(".modal-backdrop").css("display", "block");
  }

  moreFilterClick() {
    this.moreFilterClicked = true;
    $(".modal-backdrop").addClass('analysisFilterBackdrop');
  }

  onBackButtonClick(){
    this.moreFilterClicked = false;
    $('#AnalysisFilter').modal('hide');
  }
  
  setOption(event:any, which: string) {
    if(this.SelectedStockUniverseType && this.SelectedStockUniverseType.value === "Market"){
      const tempStockUniverseList = this.stockUniverseList.filter(item => item.value === "US")
      this.selectedStockUniverseList = tempStockUniverseList;
      if(which == 'parent') {
        this.selectedStockUniverse = tempStockUniverseList[0]
      }
      console.log(this.SelectedStockUniverseType)
      console.log(this.selectedStockUniverse)
    }else if(this.SelectedStockUniverseType && this.SelectedStockUniverseType.value === "Index"){
      const tempStockUniverseList = this.stockUniverseList.filter(item => item.value !== "US")
      this.selectedStockUniverseList = tempStockUniverseList;
      if(which == 'parent') {
        this.selectedStockUniverse = tempStockUniverseList[0]
      }
    }
  }

  getBreakEvenDistance() {
    let dynamicArr = [];
    var step = 5;

    for(let i = 1; i < 20; i++){
      dynamicArr.push({id:i, name: i * step +'%', value: i * 5})
    }
    return dynamicArr;
  }

  getOtmDistance() {
    let dynamicArr = [];
    var step = 5;

    for(let i = 1; i < 20; i++){
      dynamicArr.push({id:i, name: i * step +'%', value: i * 5})
    }
    return dynamicArr;
  }
  
  getExpiryDate() {
    let dynamicArr = [];
    var step = 15;

    for(let i = 1; i < 7; i++){
      dynamicArr.push({id:i, name: i * step +' Days', value: i * 15})
    }

    return dynamicArr;
  }

  //Analysis Filter Functions
  onSelectedAnalysisFilterListChange(updatedList: any[]) {
    this.SelectedAnalysisFilterList = updatedList;
  }

  hideRules(selectedAnalysisFilter:AnalysisFilter){
    console.log(selectedAnalysisFilter.value)
    const tempArray = this.SelectedAnalysisFilterList.filter(item => item.value != selectedAnalysisFilter.value)
    this.SelectedAnalysisFilterList = tempArray;
  }

  changePeriod(){

  }

  updateGenerateButtonState(): void{
    this.disableButton = this.selectedColumnList.length === 0;
  }
 
  columnListShareCheckedList(item:any[]){
    this.columnShareFilterCheckedArrayList = item;
    this.setCustomColumn(this.columnShareFilterCheckedArrayList);
    this.disableButton = this.selectedColumnList.length === 0;

    console.log(this.columnShareFilterCheckedArrayList)
  }
  
  columnListShareIndividualCheckedList(item:{}){
     //console.log("columnListShareIndividualCheckedList: ", item);
   }

  setCustomColumn(list:any[]) {
    let tempArray = []
    
    for(let i = 0; i < list.length; i ++){
      tempArray.push(list[i].name)
    }
    this.selectedColumnList = tempArray; 
  }

  //Analysis Filter
  resetAnalysisFilterOptions(){
    this.SelectedAnalysisFilterList = [];
  }

  submitFilters(){
    console.log(this.SelectedAnalysisFilterList)
  }

  generateCalendarSelectionYears(count: any, startYear: any){
    const yearList = [];
    const year = startYear || new Date().getFullYear();
    for(let i = 0; i < count; i+=1 ){
        yearList.push(Number(year)-i)
    }
    return yearList.sort((a,b)=>a-b)
  }
  getAnalysisFilterPercentageMultiDropdownValueData(){
    let n_left = 5;
    //let n_right = 10;
    let dynamicArr = [];
    dynamicArr.push({name: "Select Value"});
    dynamicArr.push({name: "0% Percentile", checked: false});
    for (let i = 1; i <= 19; i++) {
      dynamicArr.push({name: n_left + "th% Percentile", checked: false});
      n_left =+ n_left+5;
      //n_right =+ n_right+5;
      if(i === 19){
        dynamicArr.push({name: "100th% Percentile", checked: false});
        return dynamicArr;
      }
    }
    return dynamicArr;
  }
  getAnalysisFilterMultiWithoutPercentageSignDropdownValueData(){
    let n_left = 5;
    //let n_right = 10;
    let dynamicArr = [];
    dynamicArr.push({name: "Select Value"});
    dynamicArr.push({name: "0 Percentile", checked: false});
    for (let i = 1; i <= 19; i++) {
      dynamicArr.push({name: n_left + "th Percentile", checked: false});
      n_left =+ n_left+5;
      //n_right =+ n_right+5;
      if(i === 19){
        dynamicArr.push({name: "100th Percentile", checked: false});
        return dynamicArr;
      }
    }
    return dynamicArr;
  }
  getAnalysisFilterMultiDropdownValueData(){
    let n_left = 5;
    //let n_right = 10;
    let dynamicArr = [];
    dynamicArr.push({name: "Select Value"});
    dynamicArr.push({name: "0", checked: false});
    for (let i = 1; i <= 19; i++) {
      dynamicArr.push({name: n_left + "th", checked: false});
      n_left =+ n_left+5;
      //n_right =+ n_right+5;
      if(i === 19){
        dynamicArr.push({name: "100th", checked: false});
        return dynamicArr;
      }
    }
    return dynamicArr;
  }

  //View Filter Options
  viewModalOptions(filterName:string, filterValue:string, filterGroup:string) {
    if(!this.SelectedAnalysisFilterList.find((item:AnalysisFilter) => item.name === filterName)){
      this.SelectedAnalysisFilterList.unshift({name:filterName, value: filterValue, group:filterGroup})
    }
  }
  ////////////////////////////////////////////////////////////////////////////////
}