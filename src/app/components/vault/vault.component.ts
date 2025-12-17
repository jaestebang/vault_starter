import { Component, computed, inject, resource, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutoLockService } from '../../services/auto-lock.service';
import { CryptoService } from '../../services/crypto.service';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-vault',
  templateUrl: './vault.component.html',
  standalone: true,
  imports: [FormsModule],
})
export class VaultComponent {
  // --- Services ---
  private fb = inject(FirebaseService);
  private crypto = inject(CryptoService);
  private autoLock = inject(AutoLockService);
  private router = inject(Router);

  // --- Auth State ---
  user = toSignal(this.fb.getUser(), { initialValue: null });

  // --- UI & Form State ---
  refreshTrigger = signal(0);
  saveSignal = signal(false);
  entryToDelete = signal<string | null>(null);

  entry: WritableSignal<{ name: string; username: string; password: string }> = signal({
    name: '',
    username: '',
    password: '',
  });

  // --- Resources (Data Handling) ---

  // Fetch Entries
  entriesResource = resource({
    params: () => ({
      user: this.user(),
      version: this.refreshTrigger(),
    }),
    loader: async ({ params }) => {
      if (!params.user) return [];
      return await this.fb.loadEntries(params.user.uid);
    },
  });

  entries = computed(() => this.entriesResource.value() ?? []);
  sortedEntries = computed(() => {
    return [...this.entries()].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  });

  // Delete Resource
  deleteResource = resource({
    params: () => this.entryToDelete(),
    loader: async ({ params: docId }) => {
      if (!docId) return null;
      try {
        await this.fb.deleteEntry(docId);
        this.resetEntry();
        this.refreshTrigger.update((n) => n + 1);
        return docId;
      } catch (error) {
        this.entryToDelete.set(null);
        throw error;
      }
    },
  });

  // Save/Update Resource
  saveResource = resource({
    params: () => ({
      user: this.user(),
      master: this.autoLock.master(),
      entry: this.entry(),
      save: this.saveSignal(),
    }),
    loader: async ({ params }) => {
      if (!params.save || !params.user || !params.entry || !params.master) return;

      const { ciphertext, iv, salt } = await this.crypto.encryptWithMaster(
        params.master!,
        JSON.stringify(params.entry)
      );

      const docId = await this.fb.saveEntry(params.user!.uid, {
        name: params.entry!.name,
        username: params.entry!.username,
        ciphertext,
        iv,
        salt,
      });

      this.saveSignal.set(false);
      this.resetEntry();
      this.refreshTrigger.update((n) => n + 1);

      return docId;
    },
  });

  // Check master resource
  masterCheckResource = resource({
    params: () => ({ master: this.autoLock.master() }),
    loader: async ({ params }) => {
      if (params.master && params.master.trim() !== '') return true;
      alert('Master password required — please login again');
      this.router.navigate(['/']);
      return false;
    },
  });

  // --- Component Actions ---

  updateField(field: string, value: string) {
    this.entry.update((state) => ({
      ...state,
      [field]: value,
    }));
  }

  resetEntry() {
    this.entry.set({ name: '', username: '', password: '' });
  }

  reload() {
    this.refreshTrigger.update((v) => v + 1);
    this.resetEntry();
  }

  generatePassword() {
    const generatedPassword = this.crypto.generatePassword(16, {
      upper: true,
      lower: true,
      digits: true,
      symbols: true,
    });
    this.updateField('password', generatedPassword);
  }

  // --- Crypto Logic ---

  async revealPassword(e: any): Promise<string | null> {
    const master = this.autoLock.master();
    if (!master) {
      alert('Master password missing');
      return null;
    }

    const plain = await this.crypto.decryptEntry(master, e.ciphertext, e.iv, e.salt);
    const obj = JSON.parse(plain);
    return obj.password;
  }

  async revealView(e: any, el: HTMLInputElement) {
    const password = await this.revealPassword(e);

    // Clear other visible passwords
    document.querySelectorAll('[name="decryptedPassword"]').forEach((input) => {
      (input as HTMLInputElement).value = '';
    });

    el.value = password!;

    // Load selected entry into form for editing
    this.entry.set({
      name: e.name,
      username: e.username,
      password: password!,
    });
  }

  logout() {
    this.fb.logout();
    this.router.navigate(['/']);
  }
}
