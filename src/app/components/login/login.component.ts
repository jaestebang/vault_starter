import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { AutoLockService } from '../../services/auto-lock.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [FormsModule],
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  masterPassword = signal('');
  error = signal('');

  constructor(
    private fb: FirebaseService,
    private router: Router,
    private autoLock: AutoLockService
  ) {}

  async register() {
    try {
      await this.fb.register(this.email(), this.password());
      alert('User registered. Now login.');
    } catch (e: any) {
      this.error.set(e.message || e);
    }
  }

  async login() {
    try {
      await this.fb.login(this.email(), this.password());
      // store master in AutoLockService (memory only)
      this.autoLock.setMaster(this.masterPassword());
      this.router.navigate(['/vault']);
    } catch (e: any) {
      this.error.set(e.message || e);
    }
  }
}
