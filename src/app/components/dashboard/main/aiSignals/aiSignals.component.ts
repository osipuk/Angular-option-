import { NgModule, Component, OnInit, Input, HostListener, ViewEncapsulation, ElementRef, ViewChild, AfterViewChecked, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, delay, switchMap, tap, catchError, map, share, take, filter, distinctUntilChanged } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AiSignalsService } from './aiSignals.service';
import { ConfigService } from 'src/app/common/config.service'
import { ProductService } from 'src/app/_service/product.service';
import { UtilityService } from 'src/app/_service/utility.service';
import { AiSignalResult } from 'src/app/interface/aiSignal';
import { signalRService } from 'src/app/_service/signalR.service';
import { HttpClient } from '@angular/common/http';
import { PlaceOrderByStrategyComponent } from 'src/app/components/modals/place-order-by-strategy';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ow-main-aiSignals-tab',
  templateUrl: './aiSignals.component.html',
  styleUrls: ['./aiSignals.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AiSignalsComponent implements OnInit {
  AiSignalResult: AiSignalResult[];
  PaginationData: AiSignalResult[];

  CurrentPage: number;
  TotalPage: number;
  ItemPerPage: number;
  IsFirstPage: boolean;
  IsLastPage: boolean;
  Pages: number[];

  hoveredData: any;

  isLoadingScreenerResult: Boolean = false;

  currentSortedColumn = {
    name: 'Symbol',
    type: 'Asc'
  }

  constructor(private router: Router,
    private aiSignalsService: AiSignalsService,
    private modalService: NgbModal,
    private productService: ProductService,
    private utilityService: UtilityService,
    private signalRservice: signalRService,
    private http: HttpClient,
  ) {
    this.AiSignalResult = [{Name:'', OptionContracts:'', Strategy:'', Timestamp:0, Underlying:''}] 
    this.PaginationData = [{Name:'', OptionContracts:'', Strategy:'', Timestamp:0, Underlying:''}] 

    this.CurrentPage = 1;
    this.TotalPage = 1
    this.ItemPerPage = 10;
    this.IsFirstPage = true;
    this.IsLastPage = true;
    this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);

    // this.getAiSignals()
  }

  getAiSignals() {
    this.isLoadingScreenerResult = true;

    this.aiSignalsService.getAiSignals().subscribe(result => {
      if (result) {
        this.AiSignalResult = result;
        console.log(this.AiSignalResult)
      }
      this.showPaginationData(this.CurrentPage)
      this.isLoadingScreenerResult = false;
    });
  }

  refreshData() {
    // Start the interval and make the HTTP GET request every 5 seconds
    this.isLoadingScreenerResult = true;
 
    // this.signalRservice.startConnection();
 
    // this.signalRservice.registerChannel2(['aiSignal']).subscribe();
    // this.signalRservice.registerDataListener('aiSignal').pipe().subscribe(result => {
    //   // Handle the received data
    //   if (result) {
    //     console.log(result)
    //     // this.AiSignalResult = result;
    //     this.sortColumns(this.currentSortedColumn.name, this.currentSortedColumn.type);
    //   }
    //   this.showPaginationData(this.CurrentPage);
    //   this.isLoadingScreenerResult = false;
    // });

    // if (result) {
    //   this.AiSignalResult = result;
    //   // console.log(result)
    //   this.sortColumns(this.currentSortedColumn.name, this.currentSortedColumn.type)
    // }
    // this.showPaginationData(this.CurrentPage);
    // this.isLoadingScreenerResult = false;
  }

  showPaginationData(page: number) {
    this.TotalPage = Math.floor(this.AiSignalResult.length/this.ItemPerPage) + 1;
    this.PaginationData = this.AiSignalResult.slice((page -1) * this.ItemPerPage, page * this.ItemPerPage);
    this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
    this.IsLastPage = this.CurrentPage === this.TotalPage;
    this.IsFirstPage = this.CurrentPage === 1;
  }

  previousPage() {
    if(this.CurrentPage > 1){
      this.CurrentPage--;
      this.showPaginationData(this.CurrentPage) 
    }
  }

  nextPage() {
    if(this.CurrentPage < this.TotalPage){
      this.CurrentPage++;
      this.showPaginationData(this.CurrentPage)
    }
  }

  goToPage(pageNum: number) {
    this.CurrentPage = pageNum;
    this.showPaginationData(pageNum)
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
    console.log("Place order button clicked from A.I Signal entry");
    console.log(symbol, strategy, optionContract)
    // this.ByStrategyForm.value.SelectedStrategy = ''
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
      }
    });
  }

  sortColumns(columnName: string, orderType: string){

    this.currentSortedColumn = {
      name: columnName,
      type: orderType
    }

    if (columnName === 'Strategy') {
      this.AiSignalResult.sort((a, b) => {
        if (orderType === 'Asc') {
          return a.Strategy.localeCompare(b.Strategy);
        } else if (orderType === 'Desc') {
          return b.Strategy.localeCompare(a.Strategy);
        } else {
          return 0;
        }
      });
    }else if (columnName === 'Symbol') {
      this.AiSignalResult.sort((a, b) => {
        if (orderType === 'Asc') {
          return a.Underlying.localeCompare(b.Underlying);
        } else if (orderType === 'Desc') {
          return b.Underlying.localeCompare(a.Underlying);
        } else {
          return 0;
        }
      });
    }else if (columnName === 'Name') {
      this.AiSignalResult.sort((a, b) => {
        if (orderType === 'Asc') {
          return a.Name.localeCompare(b.Name);
        } else if (orderType === 'Desc') {
          return b.Name.localeCompare(a.Name);
        } else {
          return 0;
        }
      });
    }else if (columnName === 'Options Contract') {
      this.AiSignalResult.sort((a, b) => {
        if (orderType === 'Asc') {
          return a.OptionContracts.localeCompare(b.OptionContracts);
        } else if (orderType === 'Desc') {
          return b.OptionContracts.localeCompare(a.OptionContracts);
        } else {
          return 0;
        }
      });
    }
    this.showPaginationData(this.CurrentPage);
  }

  ngOnInit(): void {
    // this.signalRservice.startConnection();
    this.refreshData();

    //Fundamental
    //Financial Ratio
    this.getAiSignals();
  }

  ngOnDestroy() {
  }
}