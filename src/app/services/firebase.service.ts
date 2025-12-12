import { Injectable } from '@angular/core';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User,
  onAuthStateChanged
} from '@angular/fire/auth';
import { 
  Firestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FirebaseService {

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {}

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }

  currentUser(): User | null {
    return this.auth.currentUser;
  }

  getUser(): Observable<User | null> {
    return new Observable(subscriber => {
      onAuthStateChanged(this.auth, user => {
        subscriber.next(user);
      });
    });
  }

  async saveEntry(uid: string, payload: any) {
    const col = collection(this.firestore, 'vaultEntries');
    const doc = await addDoc(col, {
      ...payload,
      userId: uid,
      createdAt: Timestamp.now()
    });
    return doc.id;
  }

  async loadEntries(uid: string) {
    const col = collection(this.firestore, 'vaultEntries');
    const q = query(col, where('userId', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}
