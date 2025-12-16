import { Injectable } from '@angular/core';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
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

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  constructor(private auth: Auth, private firestore: Firestore) {}

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
    return new Observable((subscriber) => {
      onAuthStateChanged(this.auth, (user) => {
        subscriber.next(user);
      });
    });
  }

  async saveEntry(uid: string, payload: any) {
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
  }

  async loadEntries(uid: string) {
    const col = collection(this.firestore, 'vaultEntries');
    const q = query(col, where('userId', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async deleteEntry(docId: string) {
    const ref = doc(this.firestore, 'vaultEntries', docId);
    await deleteDoc(ref);
  }
}
