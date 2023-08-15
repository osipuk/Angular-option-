import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, Validators, FormGroup, FormBuilder, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { switchMap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { combineLatest, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { AuthGuard } from 'src/app/_service/auth-guard.service';
import { LoginService } from './login.service';
import { AuthService } from 'src/app/_service/auth.service';
import { Login } from 'src/app/interface/login';
import { AccountSelection } from 'src/app/interface/account-selection';

import { FIRESTORE_REFERENCES } from 'src/app/core/firebase.module';
import { ApiToken } from 'src/app/interface/api-token';

@Component({
  selector: 'ow-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  isCollapsed = true;
  form: FormGroup = new FormGroup({
    email: new FormControl(''),
    password: new FormControl('')
  });
  submitted = false;
  isLoading = false;
  uid = '' as any;

  constructor(
    private formBuilder: FormBuilder,
    private loginService: LoginService,
    private authService: AuthService,
    private router: Router,
    private _authGuard: AuthGuard,
    private toast: ToastrService,
    @Inject(FIRESTORE_REFERENCES.TIGER_FIREAUTH) private readonly tigerFireAuth: AngularFireAuth,
    @Inject(FIRESTORE_REFERENCES.FUTU_FIREAUTH) private readonly futuFireAuth: AngularFireAuth,
    @Inject(FIRESTORE_REFERENCES.IB_FIREAUTH) private readonly ibFireAuth: AngularFireAuth,
    @Inject(FIRESTORE_REFERENCES.TIGER_FIRESTORE) private readonly tigerFirestore: AngularFirestore,
    @Inject(FIRESTORE_REFERENCES.FUTU_FIRESTORE) private readonly futuFirestore: AngularFirestore,
    @Inject(FIRESTORE_REFERENCES.IB_FIRESTORE) private readonly ibFirestore: AngularFirestore,
  ) {
    if (this._authGuard.loggedIn) {
      this.router.navigate(['dashboard']);
    }
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]]
      }
    );
  }

  toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  logIn(): void {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    //console.log("Log in...");
    this.isLoading = true;
    let account: Login = {
      username: this.form.value.email,
      password: this.form.value.password
    };

    this.authService.login(account).pipe(
      switchMap((result: ApiToken) => {
        const jsonData = JSON.stringify(result)
        localStorage.setItem('user-credential', jsonData);
        return combineLatest([
          this.loginService.getUserProfile(result.access_token),
          this.authService.getTigerFirebaseToken(result.access_token),
          this.authService.getFutuFirebaseToken(result.access_token),
          this.authService.getIbFirebaseToken(result.access_token),
        ]);
      }),
      switchMap(([profile, tigerToken, futuToken, ibToken]) => {
        localStorage.setItem('uid', profile.UserId);
        localStorage.setItem('displayname', profile.RealName);
        localStorage.setItem('tiger_access_token', tigerToken.Token);
        localStorage.setItem('futu_access_token', futuToken.Token);
        localStorage.setItem('ib_access_token', ibToken.Token);
        return combineLatest([
          this.tigerFireAuth.signInWithCustomToken(tigerToken.Token),
          this.futuFireAuth.signInWithCustomToken(futuToken.Token),
          this.ibFireAuth.signInWithCustomToken(ibToken.Token)
        ]);
      }),
      switchMap(([tigerUserCred, futuUserCred, ibUserCred]) => {
        var promises = [
          new Promise<any>(() => null),
          new Promise<any>(() => null),
          new Promise<any>(() => null)
        ];
        if (tigerUserCred && tigerUserCred.user) {
          localStorage.setItem('tiger-uid', tigerUserCred.user.uid);
          promises[0] = this.tigerFirestore.collection('users').doc(tigerUserCred.user.uid).collection('accounts').ref.get();
        }
        if (futuUserCred && futuUserCred.user) {
          localStorage.setItem('futu-uid', futuUserCred.user.uid);
          promises[1] = this.futuFirestore.collection('users').doc(futuUserCred.user.uid).collection('accounts').ref.get();
        }
        if (ibUserCred && ibUserCred.user) {
          localStorage.setItem('ib-uid', ibUserCred.user.uid);
          promises[2] = this.ibFirestore.collection('users').doc(ibUserCred.user.uid).collection('accounts').ref.get();
        }
        return combineLatest(promises);
      })
    ).subscribe({
      next: async ([tp, fp, ibp]) => {
        var accountList: AccountSelection[] = [];
        if (tp) {
          var tigerAccounts = await tp;
          tigerAccounts.docs.map((doc: { data: () => any; }) => {
            var acc = doc.data() as any;
            accountList.push({
              id: acc.accountCode,
              brokerType: "Tiger",
            })
          });
        }
        if (fp) {
          var futuAccounts = await fp;
          futuAccounts.docs.map((doc: { data: () => any; }) => {
            var acc = doc.data() as any;
            accountList.push({
              id: acc.accountCode,
              brokerType: "FUTU",
            })
          });
        }
        if (ibp) {
          var ibAccounts = await ibp;
          ibAccounts.docs.map((doc: { data: () => any; }) => {
            var acc = doc.data() as any;
            accountList.push({
              id: acc.accountCode,
              brokerType: "Interactive Brokers",
            })
          });
        }

        this.isLoading = false;
        localStorage.setItem('accountSelections', JSON.stringify(accountList));
        this.router.navigateByUrl('/dashboard');
      },
      error: error => {
        this.toast.error('Login failed, ' + error.error.error_description, 'Error')
        this.isLoading = false;
      }
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 500) {
      // A client-side or network error occurred. Handle it accordingly.
      alert('Login failed, please check your account or password and try again');
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      alert('Login failed, please check your account or password and try again');
    }
    // Return an observable with a user-facing error message.
    return throwError('Login failed, please check your account or password and try again.');
  }
}
