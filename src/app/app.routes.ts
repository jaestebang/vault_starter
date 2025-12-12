import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { VaultComponent } from './components/vault/vault.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'vault', component: VaultComponent },
];