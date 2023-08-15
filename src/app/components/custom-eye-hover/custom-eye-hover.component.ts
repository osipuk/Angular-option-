import { Component, OnInit, Input } from '@angular/core';
import { AiSignalResult } from 'src/app/interface/aiSignal';
import { WatchListData } from 'src/app/interface/watchList-result';
import { ScreenerDataResult } from 'src/app/interface/screener-result';
import { CustomEyeHoverInput } from 'src/app/interface/custom-eye-hover';

@Component({
  selector: 'app-custom-eye-hover',
  templateUrl: './custom-eye-hover.component.html',
  styleUrls: ['./custom-eye-hover.component.css'],
})
export class CustomEyeHoverComponent implements OnInit {
  
  @Input() AiSignal:AiSignalResult;
  @Input() Watch: WatchListData;
  @Input() ScreenerData: ScreenerDataResult;
  @Input() CalcData: any[] = [];  

  @Input() index:number;

  isSymbol: boolean = true;
  symbols:any[];
  underlying: string = '';
  optionContract: string = '';

  constructor() {
    this.AiSignal = {
      Name: '',
      OptionContracts: '',
      Strategy: '',
      Timestamp: 0,
      Underlying: '',
    };

    this.Watch = {
      Strategy: '',
      Underlying: '',
      Name: '',
      OptionContracts: '',
      LastUnderlyingPrice: 0,
      BidBundlePrice: 0,
      AskBundlePrice: 0,
      LastBundlePrice: 0,
    };

    this.ScreenerData = {
      Underlying:'',
      Name:'',
      OptionContracts:'',
      Breakeven1:0,
      Breakeven2:0,
      MaxLoss:0,
      MaxProfit:0,
      MaxProfitToLoss:0,
      NetPremium:0,
      NetPremiumToMaxLoss:0,
      RiskNeutralWinProbability:0,
      Delta:0,
      Gamma:0,
      HV:0,
      IV:0,
      IVChange:0,
      UnderlyingPrice:0,
      HVPrediction:'',
      IVPrediction:'',
      BehaviorPrediction:'',
      SentimentPrediction:'',
    }

    this.index = 1;
    this.symbols = [];
  }

  ngOnInit(): void {
    this.getSymbol();
  }
  
  extractDateAndValues(data: any): string {
    const strElements = data.split(' ').length - 2;
    const dateAndValues = data.split(' ').slice(strElements).join(' ');
    return dateAndValues;
  }

  getDate(data:any): any {
    const dateRegex = /\d{4}-\d{2}-\d{2}/;
    const matches = data.match(dateRegex);

    var dateString;

    if (matches && matches.length > 0) {
      dateString = matches[0];
    } else {
      console.log("Date not found in the input string");
    }

    const tempDate = String(dateString)

    const date = new Date(tempDate);

    date.setDate(date.getDate() + 1);

    const year = date.getFullYear().toString().substr(-2);

    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const formattedDate = year + month + day;

    return formattedDate;
  }

  getPrice(data:any): any {
    const DateAndPrices = this.extractDateAndValues(data)
    const prices = DateAndPrices.split(" ")[1].split("|") 
    return prices;
  }

  getExpiry(data:any): any{
    const day = data.substring(0, 2);
    const month = data.substring(2, 4);
    const year = data.substring(4);
    const expiry = `${day}-${month}-${year}`;

    return expiry;
  }

  getSymbol(): any {
    var tempSymbol:String = '';
    var underlying:String = '';
    var optionContract:String = '';

    if(this.AiSignal.Underlying && this.AiSignal.OptionContracts){
      underlying = this.AiSignal.Underlying;
      optionContract = this.AiSignal.OptionContracts;
    }else if(this.Watch.Underlying && this.Watch.OptionContracts){
      underlying = this.Watch.Underlying;
      optionContract = this.Watch.OptionContracts;
    }else if(this.ScreenerData.Underlying && this.ScreenerData.OptionContracts){
      underlying = this.ScreenerData.Underlying;
      optionContract = this.ScreenerData.OptionContracts;
    }else if(this.CalcData[0] && this.CalcData[1]){
      underlying = this.CalcData[0];
      optionContract = this.CalcData[1];
    }

    // optionContract = "Bear Put Spread 2023-07-07 130.11|55.21|260.332|80.123"
    var date = this.getDate(optionContract);  
    var expiryDate = this.getExpiry(date);
    var prices = this.getPrice(optionContract);

    tempSymbol = underlying + date;

    if(prices.length > 0){
      prices.map((data:number, index:any) => {
        var symbol = '';
        var type = '';

        const integralPart = parseInt(data.toString());
        const decimalPart = parseFloat((data % 1).toFixed(3));

        const integerLength = integralPart.toString().length;
        const decimalLength = decimalPart.toString().length-2;
        const integerOfDecimal = decimalPart * (10 ** decimalLength)

        if(index >= 2){
          symbol = tempSymbol + "C" + "0".repeat(5 - integerLength) + integralPart + (integerOfDecimal != 0 ? integerOfDecimal : "") + "0".repeat(3 - (decimalLength != -1 ? decimalLength : 0))
          type = "Call"
        } else{
          symbol = tempSymbol + "P" + "0".repeat(5 - integerLength) + integralPart + (integerOfDecimal != 0 ? integerOfDecimal : "") + "0".repeat(3 - (decimalLength != -1 ? decimalLength : 0))
          type = "Put"
        }
        this.symbols.push([symbol, type, expiryDate, data])
      })
    }else {
      console.log('There is no result.')
    }
  }
}
