import { Component, OnInit, OnDestroy, signal } from '@angular/core';
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
    const docs = await this.fb.loadEntries(user.uid);
    this.entries.set(docs);
  }

  async reveal(e: any) {
    if (!this.master()) return alert('Master password missing');
    const plain = await this.crypto.decryptEntry(
      this.master(),
      e.ciphertext,
      e.iv,
      e.salt
    );
    const obj = JSON.parse(plain);
    // copy to clipboard and clear after 8 seconds
    await navigator.clipboard.writeText(obj.password);
    alert('Password copied to clipboard for 8 seconds');
    setTimeout(async () => {
      try {
        await navigator.clipboard.writeText('');
      } catch (_) {}
    }, 8000);
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
