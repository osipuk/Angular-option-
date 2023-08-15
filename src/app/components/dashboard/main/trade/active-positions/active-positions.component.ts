import { Component, OnInit, Input, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { CollectionReference, collectionGroup } from '@angular/fire/firestore';
import { ActivePositionGroupEntry } from 'src/app/interface/active-position-group-entry';
import { ActivePositionLegEntry } from 'src/app/interface/active-position-leg-entry';
import { FormControl, Validators, FormGroup, FormBuilder, AbstractControl, FormArray } from '@angular/forms';
import { MarketData } from 'src/app/interface/market-data';
import { TradeService } from 'src/app/_service/trade.service';
import { ProductService } from 'src/app/_service/product.service';
import { OptionsService } from 'src/app/_service/options.service';
import { UtilityService } from 'src/app/_service/utility.service';
import { OrderType } from 'src/app/interface/order-type';
import { UnitType } from 'src/app/interface/unit-type';
import { Observable, Subject, EMPTY, concat, of, firstValueFrom, from, forkJoin, combineLatest } from 'rxjs';
import { debounceTime, delay, switchMap, tap, catchError, map, share, take, filter, distinctUntilChanged, mergeMap, switchAll, concatMap, mergeAll, defaultIfEmpty } from 'rxjs/operators';
import { FIRESTORE_REFERENCES } from 'src/app/core/firebase.module';
import { ContractOptionLeg } from 'src/app/interface/contract-option-leg';
import { AccountSelection } from 'src/app/interface/account-selection';
import { signalRService } from 'src/app/_service/signalR.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CloseStrategyPositionComponent } from 'src/app/components/modals/close-strategy-position';
import { CloseOptionPositionComponent } from 'src/app/components/modals/close-option-position';
import { CloseStockPositionComponent } from 'src/app/components/modals/close-stock-position';

declare var $: any;

@Component({
  selector: 'ow-main-trade-activepositions-tab',
  templateUrl: './active-positions.component.html',
  styleUrls: ['./active-positions.component.css']
})
export class ActivePositionsComponent implements OnInit {
  @Input() SelectedBrokerAccount!: AccountSelection;
  firestore: any = AngularFirestore;
  ActivePositionList: Record<number, ActivePositionGroupEntry>;
  StockPositionToClose: any;
  OptionPositionToClose: any;
  StrategyPositionToClose: any;
  StockData$: Observable<MarketData>;
  OptionData: MarketData;
  StockOrderTypeList: OrderType[];
  StockUnitTypeList: UnitType[];


  StockOrderForm: FormGroup;
  OptionOrderForm: FormGroup;
  ByStrategyForm: FormGroup;

  isLoading: Boolean = false;

  isCollapsed: boolean = false;
  isLoadingActivePositions: boolean = false;
  activePositionMode: string = 'Pal';

  constructor(
    private router: Router,
    private auth: AngularFireAuth,
    private formBuilder: FormBuilder,
    private tradeService: TradeService,
    private optionsService: OptionsService,
    private productService: ProductService,
    private utilityService: UtilityService,
    private signalRservice: signalRService,
    private modalService: NgbModal,
    @Inject(FIRESTORE_REFERENCES.TIGER_FIRESTORE) private readonly tigerFirestore: AngularFirestore,
    @Inject(FIRESTORE_REFERENCES.FUTU_FIRESTORE) private readonly futuFirestore: AngularFirestore,
    @Inject(FIRESTORE_REFERENCES.IB_FIRESTORE) private readonly ibFirestore: AngularFirestore,
  ) {
    this.StockOrderTypeList = this.utilityService.getOrderTypeSelections();
    this.StockUnitTypeList = this.utilityService.getUnitTypeSelections();
    this.ActivePositionList = {};
    this.StockPositionToClose = {
      Product: "",
      Strategy: ""
    };
    this.OptionPositionToClose = {
      Product: "",
      Strategy: ""
    };
    this.StrategyPositionToClose = {
      Product: "",
      Strategy: ""
    };
    this.OptionData = {
      AskPrice: 0,
      AskSize: 0,
      AskTime: "",
      BidPrice: 0,
      BidSize: 0,
      BidTime: "",
      AssetClass: "Options",
      TradeVenue: "UnitedStates",
      Timestamp: "",
      Symbol: "",
      ProductId: 0,
      LastTradedPrice: 0,
      LastTradedSize: 0,
      LastTradedTime: "",
      Open: 0,
      High: 0,
      Low: 0,
      PrevClose: 0,
      CumulativeVolume: 0,
      MidPrice: 0
    };
    this.StockData$ = EMPTY;
    this.StockOrderForm = this.formBuilder.group(
      {
        SelectedAccount: this.SelectedBrokerAccount,
        SelectedStockAction: ["Buy"],
        StockQuantity: [1, [Validators.required]],
        SelectedStockOrderType: [this.StockOrderTypeList[0]],
        SelectedStockUnitType: [this.StockUnitTypeList[0]],
        StockLimitPrice: [100],
        StockStopPrice: [100],
        SelectedStockValidity: ["Day"]
      }
    );
    this.OptionOrderForm = this.formBuilder.group(
      {
        SelectedAccount: this.SelectedBrokerAccount,
        SelectedOptionAction: ["Buy"],
        OptionQuantity: [1, [Validators.required]],
        OptionLimitPrice: [1],
        OptionProduct: [""],
      }
    );
    this.ByStrategyForm = this.formBuilder.group(
      {
        SelectedAccount: this.SelectedBrokerAccount,
        SelectedStrategy: [undefined],
        SelectedStock: [{}],
        SelectedExpiry: [""],
        SelectedParameter: [],
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

    this.firestore = this.tigerFirestore;
  }

  closeStockPosition(position: ActivePositionGroupEntry): void {
    this.productService.getProductFromSymbol(position.product).pipe(take(1)).subscribe(result => {
      this.StockData$ = this.tradeService.getMarketData(result.Data.ProductId).pipe(share());
      this.StockPositionToClose = {
        Product: result.Data,
        Quantity: position.legs[0].dealSize,
      };
      if (position.legs[0].direction == 'BUY') {
        this.StockPositionToClose.Action = 'SELL';
        this.StockData$.pipe(take(1)).subscribe(value => {
          //console.log(JSON.stringify(value));
          this.StockOrderForm.patchValue({ StockLimitPrice: value.BidPrice });
          this.StockOrderForm.patchValue({ StockStopPrice: value.BidPrice });
        });
      }
      else if (position.legs[0].direction == 'SELL') {
        this.StockPositionToClose.Action = 'BUY';
        this.StockData$.pipe(take(1)).subscribe(value => {
          //console.log(JSON.stringify(value));
          this.StockOrderForm.patchValue({ StockLimitPrice: value.AskPrice });
          this.StockOrderForm.patchValue({ StockStopPrice: value.AskPrice });
        });
      }
    });
    const modalRef = this.modalService.open(CloseStockPositionComponent, { size: 'lg'});
    modalRef.componentInstance.SelectedBrokerAccount = this.SelectedBrokerAccount;
    modalRef.componentInstance.StockPositionToClose = this.StockPositionToClose;

  }

  closeOptionPosition(position: ActivePositionGroupEntry): void {
    this.OptionPositionToClose = {
      Product: position.legs[0].product,
      Quantity: position.legs[0].dealSize,
      Underlying: position.product
    };
    this.optionsService.getSingleOptionSnapshot(position.legs[0].product).pipe(take(1)).subscribe(result => {
      this.OptionData.LastTradedPrice = result.Last;
      this.OptionData.LastTradedSize = 0;
      this.OptionData.AskPrice = result.Ask;
      this.OptionData.AskSize = result.AskVolume;
      this.OptionData.BidPrice = result.Bid;
      this.OptionData.BidSize = result.BidVolume;
      this.OptionData.CumulativeVolume = result.DailyVol;

      if (position.legs[0].direction == 'BUY') {
        this.OptionPositionToClose.Action = 'SELL';
        //console.log(JSON.stringify(value));
        this.OptionOrderForm.patchValue({ OptionLimitPrice: this.OptionData.BidPrice });
      }
      else if (position.legs[0].direction == 'SELL') {
        this.OptionPositionToClose.Action = 'BUY';
        //console.log(JSON.stringify(value));
        this.OptionOrderForm.patchValue({ OptionLimitPrice: this.OptionData.AskPrice });
      }
    });
    const modalRef = this.modalService.open(CloseOptionPositionComponent, { size: 'lg'});
    modalRef.componentInstance.SelectedBrokerAccount = this.SelectedBrokerAccount;
    modalRef.componentInstance.OptionPositionToClose = this.OptionPositionToClose;
  }

  closeStrategyPosition(position: ActivePositionGroupEntry): void {
    this.StrategyPositionToClose = {
      Product: position.product,
      Strategy: position.strategy
    };
    this.productService.getProductFromSymbol(position.product).pipe(take(1)).subscribe(result => {
      this.StockData$ = this.tradeService.getMarketData(result.Data.ProductId).pipe(share());

      var legs = this.ByStrategyForm.controls["Legs"] as FormArray;
      legs.clear();

      Object.keys(position.legs).forEach((legId: any) => {
        if (position.legs[legId].assetType === 'Options') {
          var parsedOption = this.utilityService.parseOption(position.legs[legId].product);

          this.optionsService.getSingleOptionSnapshot(position.legs[legId].product).pipe(take(1)).subscribe(result => {
            var legContent = {
              Symbol: position.legs[legId].product,
              Action: '',
              LimitPrice: 0,
              StrikePrice: parsedOption.StrikePrice,
              //StrikePrice: Math.floor(currentPrice * 0.9),
              Rights: parsedOption.Right,
              Direction: '',
              Quantity: position.legs[legId].dealSize,
              Expiry: parsedOption.Expiry.slice(0, 4) + "-" + parsedOption.Expiry.slice(4, 6) + "-" + parsedOption.Expiry.slice(6),
              FairValue: 0,
              OrderType: 'Limit'
            }

            if (position.legs[legId].direction == 'BUY') {
              legContent.Action = 'Sell';
              legContent.Direction = 'Long';
              legContent.LimitPrice = result.Bid
              legContent.FairValue = result.Bid;
            }
            else if (position.legs[legId].direction == 'SELL') {
              legContent.Action = 'Buy';
              legContent.Direction = 'Short';
              legContent.LimitPrice = result.Ask;
              legContent.FairValue = result.Ask;
            }
            legs.push(this.formBuilder.group(legContent));
          });
        }
        else {
          this.StockData$.pipe(take(1)).subscribe(value => {
            this.ByStrategyForm.patchValue({ Quantity: position.legs[legId].dealSize });
            if (position.legs[legId].direction == 'BUY') {
              this.ByStrategyForm.patchValue({ Action: 'Sell' });
              this.ByStrategyForm.patchValue({ Direction: 'Long' });
              this.ByStrategyForm.patchValue({ LimitPrice: value.BidPrice });
            }
            else if (position.legs[legId].direction == 'SELL') {
              this.ByStrategyForm.patchValue({ Action: 'Buy' });
              this.ByStrategyForm.patchValue({ Direction: 'Short' });
              this.ByStrategyForm.patchValue({ LimitPrice: value.AskPrice });
            }
          });
        }
      })
    });
    const modalRef = this.modalService.open(CloseStrategyPositionComponent, { size: 'lg'});
    modalRef.componentInstance.SelectedBrokerAccount = this.SelectedBrokerAccount;
    modalRef.componentInstance.StrategyPositionToClose = this.StrategyPositionToClose;
  } 

  setActivePositionMode(modeType: string): void {
    this.activePositionMode = modeType;
  }

  setActivePositionAlertData(activePosition: any) {
    console.log("activePosition: ", activePosition);
  }

  toggleCollapsedActivePosition(activePosition: any) {
    activePosition.value.isCollapsed = !activePosition.value.isCollapsed;
    this.isCollapsed = !activePosition.value.isCollapsed;
  }  
  
  ngAfterViewInit() {
    // $('tr.OnClickAdd td.AddPlus').click(function(){
    //   $(this).toggleClass('added');
    //   $(this).parent().next('tr.showhide').slideToggle();
    // });
  }

  checkIsEmptyObject(objectValue: any) {
    return Object.keys(objectValue).length === 0;
  }

  async getActivePositions() {
    if (this.firestore) {
      switch (this.SelectedBrokerAccount.brokerType) {
        case 'Interactive Brokers':
          await this.getActivePositionsIb();
          break;
        case 'FUTU':
          await this.getActivePositionsFutu();
          break;
        case 'Tiger':
          await this.getActivePositionsTiger();
          break;
      }
    }
  }

  async getActivePositionsIb() {
    this.isLoadingActivePositions = true;
    this.ActivePositionList = {};
    var uid = localStorage.getItem('ib-uid') || "";

    if (uid) {
      const group$ = this.firestore.collection('users').doc(uid).collection('positionGroups')
        .doc(this.SelectedBrokerAccount.id).collection(this.SelectedBrokerAccount.id).valueChanges();

      group$.pipe(
        map((mp: any) => mp.map((coll: any) => {
          return {
            isCollapsed: true,
            groupId: coll.groupId,
            strategy: coll.strategy,
            legs: coll.legs,
            hasFilledLeg: false,
            product: coll.product,
            aggregatedUPL: 50
          };
        })),
        tap((query: any) => console.log(`Querying 1 for ${query.groupId}...`)),
        // map((coll: any) => {
        //   const emptyLeg: { [key: number]: ActivePositionLegEntry } = {};
        //   return {
        //     isCollapsed: true,
        //     groupId: coll.groupId,
        //     strategy: coll.strategy,
        //     legs: coll.legs,
        //     hasFilledLeg: true,
        //     product: coll.product,
        //     aggregatedUPL: 0
        //   }
        // }),
        // tap((query: any) => console.log(`Querying 2 for ${query.groupId}...`)),
        // switchMap((entry: any) =>
        //   entry.map((cd: any) =>
        //     forkJoin(
        //       Object.keys(cd.legs).map((legId: any) => of(cd.legs[legId]))
        //     )
        //   )
        // ),
        // mergeAll() // Flatten the nested Observables

        switchMap((entry: any) => {
          //return cd;
          if (entry.length > 0) {
            return entry.map((cd: any) => {
              var streams = Object.keys(cd.legs).map((legId: any) => {
                // return of(cd.legs[legId]);
                //console.log("Tracing position legs " + cd.legs[legId]);
                const leg$ = this.firestore.collection('users').doc(uid).collection('positionLegs')
                  .doc(this.SelectedBrokerAccount.id).collection(this.SelectedBrokerAccount.id)
                  .doc(cd.legs[legId].toString()).valueChanges();
  
                return leg$.pipe(switchMap(
                  (x: any) => {
                    //console.log("GroupID: " + cd.groupId + ", product: " + x.product);
                    const activePosition$ = this.firestore.collection('users').doc(uid).collection('openPositions')
                      .doc(this.SelectedBrokerAccount.id).collection(this.SelectedBrokerAccount.id).doc(x.product).valueChanges()
                    return activePosition$.pipe(
                      filter(value => value !== null && value !== undefined),
                      switchMap(
                      (doc3: any) => {
                        doc3.unrealizedPNL = 10; // replace with signalr
                        doc3.entryTime *= 1000;
                        return of(doc3);
                      }
                    ));
                  }
                ));
              });
              var combined$ = combineLatest(streams);
              return combined$.pipe(map((x: any) => {
                cd.legs = x;
                cd.hasFilledLeg = true;
                return cd;
              }))
            });     
          }
          else {
            // Return nested observable of null if entries not available
            return of(of(null));
          }  
        }),
        mergeAll(), // Flatten the nested Observables

        //   // return forkJoin(Object.keys(cd.legs).map((legId: any) => {
        //   //   //return of(cd.legs[legId]);
        //   //   const leg$ = this.firestore.collection('users').doc(uid).collection('positionLegs')
        //   //     .doc(this.SelectedBrokerAccount.id).collection(this.SelectedBrokerAccount.id)
        //   //     .doc(cd.legs[legId].toString()).valueChanges()
        //   //   return leg$.pipe(switchMap(
        //   //     (x: any) => {
        //   //       const activePosition$ = this.firestore.collection('users').doc(uid).collection('openPositions')
        //   //         .doc(this.SelectedBrokerAccount.id).collection(this.SelectedBrokerAccount.id).doc(x.product).valueChanges()
        //   //       return activePosition$.pipe(take(1));
        //   //     }
        //   //   ), take(1));
        //   // }))
        // }),
        // // switchAll(),
        // tap(query => console.log(`Querying 3 for ${query}...`))
      ).subscribe({
        next: (x: any) => {
          if (x) {
            this.ActivePositionList[x.groupId] = x;
          }
          this.isLoadingActivePositions = false;
          console.log(x);  
        },
        error: (error: any) => {
          console.error(error);
        }
      });      
    }
  }

  async getActivePositionsFutu() {
    this.isLoadingActivePositions = true;
    var uid = localStorage.getItem('futu-uid') || "";

    if (uid) {
      const group$ = this.firestore.collection('users').doc(uid).collection('positionGroups')
        .doc(this.SelectedBrokerAccount.id).collection(this.SelectedBrokerAccount.id).valueChanges();
      //const group$ = this.firestore.collection('users').doc(uid).collection('groups').valueChanges();
      group$.subscribe((doc: any) => {
        this.ActivePositionList = {};
        doc.forEach((coll: ActivePositionGroupEntry) => {
          const emptyLeg: { [key: number]: ActivePositionLegEntry } = {};
          // Add to dictionary
          this.ActivePositionList[coll.groupId] = {
            isCollapsed: true,
            groupId: coll.groupId,
            strategy: coll.strategy,
            legs: emptyLeg,
            hasFilledLeg: false,
            product: coll.product,
            aggregatedUPL: 0
          };

          Object.keys(coll.legs).forEach((legId: any) => {
            const leg$ = this.firestore.collection('users').doc(uid).collection('positionsLegs')
              .doc(this.SelectedBrokerAccount.id).collection(this.SelectedBrokerAccount.id)
              .doc(coll.legs[legId].toString()).valueChanges();
            leg$.subscribe((doc2: any) => {
              //console.log(JSON.stringify(doc2));
              if (uid) {
                const activePosition$ = this.firestore.collection('users').doc(uid).collection('openPositions')
                  .doc(this.SelectedBrokerAccount.id).collection(this.SelectedBrokerAccount.id).doc(doc2.product).valueChanges();
                activePosition$.subscribe((doc3: any) => {
                  if (doc3) {
                    if (doc3.assetType === 'Options') {
                      doc3.multiplier = 100;
                      //doc3.unrealizedPNL *= doc3.multiplier;
                      doc3.unrealizedPNLPct = (doc3.unrealizedPNL / 100) / (doc3.openingPrice * Math.abs(doc3.dealSize));
                    }
                    else {
                      doc3.unrealizedPNLPct = doc3.unrealizedPNL / (doc3.openingPrice * Math.abs(doc3.dealSize));
                    }
                    this.ActivePositionList[coll.groupId].legs[legId] = doc3;
                    if (doc3) {
                      if (doc3.strategy == "") {
                        this.ActivePositionList[coll.groupId].aggregatedUPL = doc3.unrealizedPNL;
                      } else {
                        this.ActivePositionList[coll.groupId].aggregatedUPL += doc3.unrealizedPNL;
                      }
                      this.ActivePositionList[coll.groupId].hasFilledLeg = true;
                    }
                  }
                });
              }
              //console.log(JSON.stringify(doc2));
            });
          });
        });
        this.isLoadingActivePositions = false;
        console.log(this.ActivePositionList);
        // console.log(Object.keys(this.ActivePositionList[Number(607)].legs))

        if (!this.checkIsEmptyObject(this.ActivePositionList)) {
          var listChannel = Object.values(this.ActivePositionList).map(p => p.product);

          setTimeout(() => {
            this.signalRservice.registerChannel(listChannel).subscribe();
            
            listChannel.forEach(channel =>
              this.signalRservice.registerDataListener(channel).pipe().subscribe(
                result => {
                  
                  let tmp = JSON.parse(result);
                  setTimeout(() => {
                    Object.keys(this.ActivePositionList).forEach(key => {
                      Object.keys(this.ActivePositionList[Number(key)].legs).forEach(leg => {
                        if (this.ActivePositionList[Number(key)].legs[Number(leg)] &&
                          this.ActivePositionList[Number(key)].legs[Number(leg)].product == tmp.symbol) {
                          this.ActivePositionList[Number(key)].legs[Number(leg)].unrealizedPNL = tmp.last;
                        }
                      })
                    });
                  }, 1000);
                }
              ))
          }, 2000);
        }
      });
    }
  }

  async getActivePositionsTiger() {
    this.isLoadingActivePositions = true;
    var uid = localStorage.getItem('tiger-uid') || "";

    if (uid) {
      const group$ = this.firestore.collection('users').doc(uid).collection('positionGroups')
        .doc(this.SelectedBrokerAccount.id).collection(this.SelectedBrokerAccount.id).valueChanges();
      //const group$ = this.firestore.collection('users').doc(uid).collection('groups').valueChanges();
      group$.subscribe((doc: any) => {
        this.ActivePositionList = {};
        doc.forEach((coll: ActivePositionGroupEntry) => {
          const emptyLeg: { [key: number]: ActivePositionLegEntry } = {};
          // Add to dictionary
          this.ActivePositionList[coll.groupId] = {
            isCollapsed: true,
            groupId: coll.groupId,
            strategy: coll.strategy,
            legs: emptyLeg,
            hasFilledLeg: false,
            product: coll.product,
            aggregatedUPL: 0
          };

          Object.keys(coll.legs).forEach((legId: any) => {
            const leg$ = this.firestore.collection('users').doc(uid).collection('positionsLegs')
              .doc(this.SelectedBrokerAccount.id).collection(this.SelectedBrokerAccount.id)
              .doc(coll.legs[legId].toString()).valueChanges();
            leg$.subscribe((doc2: any) => {
              //console.log(JSON.stringify(doc2));
              if (uid) {
                const activePosition$ = this.firestore.collection('users').doc(uid).collection('openPositions')
                  .doc(this.SelectedBrokerAccount.id).collection(this.SelectedBrokerAccount.id).doc(doc2.product).valueChanges();
                activePosition$.subscribe((doc3: any) => {
                  if (doc3.assetType === 'Options') {
                    doc3.unrealizedPNL *= doc3.multiplier;
                    doc3.unrealizedPNLPct = doc3.unrealizedPNL / (doc3.openingPrice * doc3.dealSize * doc3.multiplier);
                  }
                  else {
                    doc3.unrealizedPNLPct = doc3.unrealizedPNL / (doc3.openingPrice * doc3.dealSize);
                  }
                  this.ActivePositionList[coll.groupId].legs[legId] = doc3;
                  if (doc3) {
                    this.ActivePositionList[coll.groupId].aggregatedUPL += doc3.unrealizedPNL;
                    this.ActivePositionList[coll.groupId].hasFilledLeg = true;
                  }
                });
              }
              //console.log(JSON.stringify(doc2));
            });
          });
        });
        this.isLoadingActivePositions = false;
        console.log(this.ActivePositionList);
        // console.log(Object.keys(this.ActivePositionList[Number(607)].legs))

        if (!this.checkIsEmptyObject(this.ActivePositionList)) {
          var listChannel = Object.values(this.ActivePositionList).map(p => p.product);
          
          setTimeout(() => {
            this.signalRservice.registerChannel(listChannel).subscribe();
            listChannel.forEach(channel =>
              this.signalRservice.registerDataListener(channel).pipe().subscribe(
                result => {
                  
                  let tmp = JSON.parse(result);
                  setTimeout(() => {
                    Object.keys(this.ActivePositionList).forEach(key => {
                      Object.keys(this.ActivePositionList[Number(key)].legs).forEach(leg => {
                        if (this.ActivePositionList[Number(key)].legs[Number(leg)] &&
                          this.ActivePositionList[Number(key)].legs[Number(leg)].product == tmp.symbol) {
                          this.ActivePositionList[Number(key)].legs[Number(leg)].unrealizedPNL = tmp.last;
                        }
                      })
                    });
                  }, 1000);
                }
              ))
          }, 2000);
        }
      });
    }
  }

  ngOnChanges(changes: any) {
    if (this.SelectedBrokerAccount.brokerType === 'Tiger') {
      this.firestore = this.tigerFirestore;
    }
    if (this.SelectedBrokerAccount.brokerType === 'FUTU') {
      this.firestore = this.futuFirestore;
    }
    if (this.SelectedBrokerAccount.brokerType === 'Interactive Brokers') {
      this.firestore = this.ibFirestore;
    }

    this.getActivePositions();
  }

  ngOnInit(): void {
    this.signalRservice.startConnection();
    this.getActivePositions();
  }
}