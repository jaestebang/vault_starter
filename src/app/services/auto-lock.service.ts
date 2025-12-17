import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AutoLockService {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private _master = signal<string | null>(null);
  public readonly master = this._master.asReadonly();

  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly TIMEOUT_MS = 1000 * 60 * 5;

  constructor() {
    this.initIdleListeners();
  }

  setMaster(value: string) {
    this._master.set(value);
    this.resetTimer();
  }

  clearMaster() {
    this._master.set(null);
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.router.navigate(['/']);
  }

  private resetTimer() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.clearMaster();
      alert('Vault locked due to inactivity');
    }, this.TIMEOUT_MS);
  }

  private initIdleListeners() {
    const events = ['click', 'keydown', 'mousemove', 'touchstart'];
    const handler = () => this.resetTimer();

    events.forEach((evt) => window.addEventListener(evt, handler));

    const visibilityHandler = () => {
      if (document.hidden) this.resetTimer();
    };
    document.addEventListener('visibilitychange', visibilityHandler);
    this.destroyRef.onDestroy(() => {
      events.forEach((evt) => window.removeEventListener(evt, handler));
      document.removeEventListener('visibilitychange', visibilityHandler);
      if (this.timeoutId) clearTimeout(this.timeoutId);
    });
  }
}
