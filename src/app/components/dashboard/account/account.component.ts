import { Component, OnInit, Input, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, Validators, FormGroup, FormBuilder, AbstractControl } from '@angular/forms';
import { debounceTime, delay, switchMap, tap, catchError, map, share, take, filter, distinctUntilChanged } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { ClipboardService } from 'ngx-clipboard';

import { DasboardService } from 'src/app/components/dashboard/dashboard.service';
import { AccountService } from './account.service';
import Swal from 'sweetalert2'

@Component({
  selector: 'ow-account-tab',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {

  uid = '' as any;
  bradcrumb = '' as any;
  tigerForm: FormGroup = new FormGroup({
    tigerID: new FormControl(''),
    accountID: new FormControl('')
  });
  futuForm: FormGroup = new FormGroup({
    futuId: new FormControl(''),
    futuPassword: new FormControl(''),
    tradingPassword: new FormControl('')
  });
  //@ViewChild('brokerListModal') brokerListModal;

  brokerAccounts = [] as any;
  myAddedBokerAccounts = [] as any;
  selectedBrokerIndex = null as any;
  publicKey: string;
  accountId = '';

  constructor(
    private formBuilder: FormBuilder,
    private dashboardService: DasboardService,
    private router: Router,
    private auth: AngularFireAuth,
    private modalService: NgbModal,
    private toast: ToastrService,
    private clipboardService: ClipboardService,
    private AccountService: AccountService
  ) {
    this.publicKey = '';
    this.bradcrumb = {
      title: 'Account',
      subtitle: '',
      data: [
        {
          name: 'Home',
          navigation: '/dashboard',
        },
        {
          name: 'Account',
          navigation: false,
        }
      ]
    }
    //this.brokerListModal = '' as any;
  }

  ngOnInit(): void {
    this.tigerForm = this.formBuilder.group(
      {
        tigerID: ['', [Validators.required]],
        accountID: ['', [Validators.required]]
      }
    );
    this.futuForm = this.formBuilder.group(
      {
        futuId: ['', [Validators.required]],
        futuPassword: ['', [Validators.required]],
        tradingPassword: ['', [Validators.required]]
      }
    );
    this.initBrokerAccounts();
    this.myAddedBrokerAccounts();
    const Swal = require('sweetalert2')
  }

  // openModal(ModalName: any){
  //   document.getElementById(ModalName)?.click();
  // }

  selectBrokerAccount(index: number) {
    this.selectedBrokerIndex = index;
  }

  selectedBrokerAccount(key: any) {
    if (this.selectedBrokerIndex !== null) {
      return this.brokerAccounts[this.selectedBrokerIndex][key];
    }
    return '';
  }

  checkAccountType(): boolean {
    if (this.selectedBrokerIndex !== null) {
      if (this.brokerAccounts[this.selectedBrokerIndex]['name'] === 'FUTU') {
        this.toast.warning('Only Tiger and IB account linking is available for now.', 'Warning!')
        return false;
      }
    }
    return false;
  }

  randomString(length: number) {
    var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
      result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return result;
  }

  generatePublicKey() {
    this.publicKey = this.randomString(250).toString().trim();
  }

  copyPublicKey() {
    if (this.publicKey === '') {
      this.toast.error('Public key not copied or Public key is empty!', 'Error!');
    }
    if (this.publicKey !== '') {
      this.clipboardService.copyFromContent((this.publicKey).toString().trim());
      this.toast.success('Public key copied successfully!', 'Success!');
    }
  }

  linkTigerAccount() {
    if (localStorage.getItem('accounts') !== null && localStorage.getItem('accounts') !== '') {
      let existingAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      var accontsJSON = [{ tigerID: this.tigerForm.value.tigerID, accountID: this.tigerForm.value.accountID }];
      existingAccounts.push(accontsJSON);
      localStorage.setItem('accounts', JSON.stringify(existingAccounts));
      this.myAddedBrokerAccounts();
    } else {
      var accontsJSON = [{ tigerID: this.tigerForm.value.tigerID, accountID: this.tigerForm.value.accountID }];
      localStorage.setItem('accounts', JSON.stringify(accontsJSON));
      this.myAddedBrokerAccounts();
    }
  }
  linkFutuAccount() {
    var accontsJSON = {
      FutuId: this.futuForm.value.futuId,
      FutuPwd: this.futuForm.value.futuPassword,
      FutuTradingPwd: this.futuForm.value.tradingPassword
    };
    this.AccountService.setupFutuClient(accontsJSON).pipe().subscribe(result => {
      console.log(result);
    });
    if (localStorage.getItem('accounts') !== null && localStorage.getItem('accounts') !== '') {
      let existingAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      existingAccounts.push(accontsJSON);
      localStorage.setItem('accounts', JSON.stringify(existingAccounts));
      this.myAddedBrokerAccounts();
    } else {
      localStorage.setItem('accounts', JSON.stringify([accontsJSON]));
      this.myAddedBrokerAccounts();
    }
  }

  turnOnVm() {
    let AccountService = this.AccountService;
    Swal.fire({
      title: 'Create VM',
      text: 'A VM will be provisioned',
      icon: 'info',
      confirmButtonText: 'Yes',
      showCancelButton: true,
      buttonsStyling:false,
      cancelButtonText: 'No',
      customClass:{
        confirmButton:'BtnDefault confirmation-box',
        cancelButton:'BtnSecondary confirmation-box'
      },
      reverseButtons:true,
    }).then(function (action) {
      if (action.isConfirmed) {
        AccountService.turnOnVM();
        $('#IBModal2NextButton').removeClass('disabled')
      }
    })
  }

  accessVm() {
    const newTab: any = window.open('', '_blank');
    newTab.document.write('Connecting to VM...');

    this.AccountService.getGuacamoleCredentials().subscribe(result => {
      console.debug(result);
      console.log('GUAC CREDS: ' + result)
      const body= `username=${result.Username}&password=${result.Password}`;
      this.AccountService.getGuacamoleToken(body).subscribe(data=>{
        if (!data) {
          // this.cookies.remove('GUAC_AUTH');
          delete window.localStorage['GUAC_AUTH'];
        }

        if (data.username !== '') {
          // this.cookies.putObject('GUAC_AUTH', data);
          window.localStorage['GUAC_AUTH'] = JSON.stringify(data);
        }

        newTab.location.href = '/guac/';
      })
    });
  }

  finnishConfigIB() {
    //getIBInformation
    var accontsJSON = {
      brokerType:'Interactive Brokers',
      brokerId: 'IB12344',
      accountType: 'Margin',
      availableCapital : 12323.112,
      image : '//am708403.blob.core.windows.net/images/optionpi/img/Interactive.png',
      margin: 459.22
    };
    
    if (localStorage.getItem('accounts') !== null && localStorage.getItem('accounts') !== '') {
      let existingAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      existingAccounts.push(accontsJSON);
      localStorage.setItem('accounts', JSON.stringify(existingAccounts));
      this.myAddedBrokerAccounts();
    } else {
      localStorage.setItem('accounts', JSON.stringify([accontsJSON]));
      this.myAddedBrokerAccounts();
    }
  }

  removeAccount(index: any) {
    if (this.myAddedBokerAccounts.length > 0) {
      var updatedAccont = [... this.myAddedBokerAccounts];
      updatedAccont.splice(index, 1);
      if (updatedAccont.length > 0) {
        localStorage.setItem('accounts', JSON.stringify(updatedAccont));
        this.myAddedBrokerAccounts();
      } else {
        localStorage.removeItem('accounts');
        this.myAddedBrokerAccounts();
      }
    }
  }

  initBrokerAccounts() {
    this.brokerAccounts = [
      {
        id: 1,
        name: 'Interactive Brokers',
        image: '//am708403.blob.core.windows.net/images/optionpi/img/Interactive.png',
        link: 'https://www.interactivebrokers.com/inv/en/main.php#open-account',
        modalId: 'IBModal'
      },
      {
        id: 2,
        name: 'Tiger',
        image: '//am708403.blob.core.windows.net/images/optionpi/img/tiger.png',
        link: 'https://www.tigersecurities.com/login?invite=QUANT&next=https://quant.itigerup.com/developer#developer',
        modalId: 'TigerModal'
      },
      // {
      //   id: 3,
      //   name: 'FUTU',
      //   image: '//am708403.blob.core.windows.net/images/optionpi/img/futu.png',
      //   link: '',
      //   modalId : 'FutuModal'
      // }      
    ]
  }

  myAddedBrokerAccounts() {
    this.myAddedBokerAccounts = (localStorage.getItem('accounts') !== null ? JSON.parse(localStorage.getItem('accounts') || '[]') : []);
  }

}