import { Component, Input, Output, EventEmitter } from '@angular/core';

declare var $: any;

@Component({
  selector: 'app-multi-select-dropdown',
  templateUrl: './multi-select-dropdown.component.html',
  styleUrls: ['./multi-select-dropdown.component.css']
})
export class MultiSelectDropdownComponent {
    @Input() list:any[];
    @Input() placeHolder: string = "";

    @Output() shareCheckedList = new EventEmitter();
    @Output() shareIndividualCheckedList = new EventEmitter();


    checkedList : any = [];
    currentSelected : any = {};
    showDropDown: boolean = false;

    constructor() {
      this.list = [];
      this.placeHolder = '';
      this.checkedList = [
        {name:'Underlying', checked:true, index:0},
        {name:'Name', checked:true, index:1},
        {name:'Option Contracts', checked:true, index:2},
        {name:'Underlying Price', checked:true, index:16},
        {name:'HV Prediction', checked:true,  index:17},
        {name:'IV Prediction', checked:true,  index:18},
        {name:'Behavior Prediction', checked:true,  index:19},
        {name:'Sentiment Prediction', checked:true,  index:20},
      ];
    }

    onShowDropDown() {
      if(window.innerWidth >= 700) {
        this.showDropDown = !this.showDropDown;
      } else {
        $("#multiDropDownModal").modal("show");
      }
    }

    onBackButtonClick() {
      $("#multiDropDownModal").modal("hide");
    }

    getSelectedValue(status:Boolean,value:String, indexOfItem: number){
        if(status){
          let insertIndex = 0;
          const newItem = {checked: status, name: value, index: indexOfItem};
          
          for(let i = 0; i < this.checkedList.length; i ++){
            if(this.checkedList[i].index > indexOfItem){
              break;
            }
            insertIndex ++;
          }
          this.checkedList.splice(insertIndex, 0, newItem);
        } else{
            const updatedList = this.checkedList.filter((item: any) => item.name !== value)
            this.checkedList = updatedList
            console.log(updatedList)
        }

        this.currentSelected = { name:value, checked : status, id:indexOfItem};

        //share checked list
        this.shareCheckedlist();

        //share individual selected item
        this.shareIndividualStatus();
    }

    shareCheckedlist(){
         this.shareCheckedList.emit(this.checkedList);
    }

    shareIndividualStatus(){
        this.shareIndividualCheckedList.emit(this.currentSelected);
    }
}