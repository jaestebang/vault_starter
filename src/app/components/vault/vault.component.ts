import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { CryptoService } from '../../services/crypto.service';
import { AutoLockService } from '../../services/auto-lock.service';
import { FormsModule } from '@angular/forms';
import { User } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-vault',
  templateUrl: './vault.component.html',
  standalone: true,
  imports: [FormsModule],
})
export class VaultComponent implements OnInit, OnDestroy {
  entries = signal<any[]>([]);
  master = signal('');
  newName = signal('');
  newUsername = signal('');
  newPassword = signal('');
  isVaultOk = computed(() => {
    return this.newName() && this.newUsername() && this.newPassword();
  });
  user = signal<User | null>(null);

  private userSubscription: Subscription | undefined;

  constructor(
    public fb: FirebaseService,
    private crypto: CryptoService,
    private autoLock: AutoLockService,
    private router: Router
  ) {}

  ngOnInit() {
    this.master.set(this.autoLock.getMaster());
    if (!this.master()) {
      alert('Master password required — please login again');
      this.router.navigate(['/']);
      return;
    }

    this.userSubscription = this.fb.getUser().subscribe(async (user) => {
      this.user.set(user);
      if (user) {
        const docs = await this.fb.loadEntries(user.uid);
        this.entries.set(docs);
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  async save() {
    if (!this.master()) return alert('Master password required');
    const user = this.user();
    if (!user) return alert('You must be logged in to save an entry');
    if (!this.isVaultOk()) return alert('Vault data is mandatory');

    const payload = {
      name: this.newName(),
      username: this.newUsername(),
      password: this.newPassword(),
    };
    const { ciphertext, iv, salt } = await this.crypto.encryptWithMaster(
      this.master(),
      JSON.stringify(payload)
    );
    await this.fb.saveEntry(user.uid, {
      name: this.newName(),
      username: this.newUsername(),
      ciphertext,
      iv,
      salt,
    });
    this.newName.set('');
    this.newUsername.set('');
    this.newPassword.set('');
    this.load();
  }

  async load() {
    const user = this.user();
    if (!user) return alert('You must be logged in to save an entry');
    const docs = await this.fb.loadEntries(user.uid);
    this.entries.set(docs);
  }

  async revealPassword(e: any): Promise<string | null> {
    if (!this.master()) {
      alert('Master password missing');
      return null;
    }
    const plain = await this.crypto.decryptEntry(this.master(), e.ciphertext, e.iv, e.salt);
    const obj = JSON.parse(plain);
    return obj.password;
  }

  async revealView(e: any, el: HTMLInputElement) {
    const password = await this.revealPassword(e);
    el.value = password!;
  }

  async delete(e: any) {
    await this.fb.deleteEntry(e.id);
    this.load();
  }

  generate() {
    this.newPassword.set(
      this.crypto.generatePassword(16, {
        upper: true,
        lower: true,
        digits: true,
        symbols: false,
      })
    );
  }

  logout() {
    this.fb.logout();
    this.router.navigate(['/']);
  }
}
