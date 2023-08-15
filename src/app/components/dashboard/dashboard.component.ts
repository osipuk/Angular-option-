import { Component, OnInit, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'ow-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  @Input()
  uid: string;
  bradcrumb: any;
  selectedTab:string = '';

  constructor(private router: Router) {
    this.uid = '';
    this.bradcrumb = {
      title: 'OptionPi',
      subtitle: 'Your one-stop A.I. based Options trading solution',
      data: []
    }
  }

  ngOnInit(): void {
  }

  onTabSelected(tab:string) {
    this.selectedTab = tab;
  }
}