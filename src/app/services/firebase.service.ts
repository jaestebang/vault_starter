import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  Auth,
  User,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';
import {
  Firestore,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface VaultEntry {
  id: string;
  name: string;
  username: string;
  ciphertext: string;
  iv: string;
  salt: string;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  register(email: string, password: string) {
    return runInInjectionContext(this.injector, () =>
      createUserWithEmailAndPassword(this.auth, email, password)
    );
  }

  login(email: string, password: string) {
    return runInInjectionContext(this.injector, () =>
      signInWithEmailAndPassword(this.auth, email, password)
    );
  }

  logout() {
    // Standard logout is synchronous in its call, but safe to wrap
    return runInInjectionContext(this.injector, () => signOut(this.auth));
  }

  currentUser(): User | null {
    return this.auth.currentUser;
  }

  getUser(): Observable<User | null> {
    return authState(this.auth);
  }

  async saveEntry(uid: string, payload: any) {
    return runInInjectionContext(this.injector, async () => {
      const col = collection(this.firestore, 'vaultEntries');
      const q = query(
        col,
        where('userId', '==', uid),
        where('name', '==', payload.name),
        where('username', '==', payload.username)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, {
          ...payload,
          updatedAt: Timestamp.now(),
        });
        return snap.docs[0].id;
      }

      const docRef = await addDoc(col, {
        ...payload,
        userId: uid,
        createdAt: Timestamp.now(),
      });

      return docRef.id;
    });
  }

  async loadEntries(uid: string): Promise<VaultEntry[]> {
    return runInInjectionContext(this.injector, async () => {
      const col = collection(this.firestore, 'vaultEntries');
      const q = query(col, where('userId', '==', uid));
      const snap = await getDocs(q);
      return snap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...d.data(),
          } as VaultEntry)
      );
    });
  }

  async deleteEntry(docId: string) {
    return runInInjectionContext(this.injector, async () => {
      const ref = doc(this.firestore, 'vaultEntries', docId);
      await deleteDoc(ref);
    });
  }
}