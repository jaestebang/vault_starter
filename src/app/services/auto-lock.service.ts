import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';

// Simple AutoLockService: keeps the master password in memory and clears it after inactivity.
@Injectable({ providedIn: 'root' })
export class AutoLockService {
  private master: string = '';
  private timeoutId: any = null;
  private readonly timeoutMs = 1000 * 60 * 5; // 5 minutes

  constructor(private router: Router, private ngZone: NgZone) {
    this.resetListeners();
  }

  setMaster(m: string) {
    this.master = m;
    this.resetTimer();
  }
  getMaster() {
    return this.master;
  }
  clearMaster() {
    this.master = '';
  }

  private resetTimer() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    // run outside Angular to avoid change detection cycles
    this.ngZone.runOutsideAngular(() => {
      this.timeoutId = setTimeout(() => {
        this.ngZone.run(() => {
          this.clearMaster();
          // navigate to login
          this.router.navigate(['/']);
          alert('Vault locked due to inactivity');
        });
      }, this.timeoutMs);
    });
  }

  private resetListeners() {
    ['click', 'keydown', 'mousemove', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, () => this.resetTimer());
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.resetTimer();
    });
  }
}
