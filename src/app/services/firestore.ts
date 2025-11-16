import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  docData,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  firestore: Firestore = inject(Firestore);

  constructor() {}
  getCollection<T extends object>(path: string): Observable<T[]> {
    const ref = collection(this.firestore, path);
    return collectionData(ref, { idField: 'id' }) as Observable<T[]>;
  }

  getDocument<T extends object>(path: string): Observable<T | undefined> {
    const ref = doc(this.firestore, path);
    return docData(ref) as Observable<T | undefined>;
  }

  addDocument<T extends object>(path: string, data: T) {
    const ref = collection(this.firestore, path);
    return addDoc(ref, data);
  }

  updateDocument<T extends object>(path: string, id: string, data: T) {
    const ref = doc(this.firestore, `${path}/${id}`);
    return updateDoc(ref, data);
  }

  deleteDocument(path: string, id: string) {
    const ref = doc(this.firestore, `${path}/${id}`);
    return deleteDoc(ref);
  }

  getCollectionWhere<T extends object>(path: string, field: string, value: any): Observable<T[]> {
    const ref = collection(this.firestore, path);
    const q = query(ref, where(field, '==', value));
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  getSubcollection<T extends object>(parentPath: string, parentId: string, subcollectionName: string, orderByField: string): Observable<T[]> {
    const path = `${parentPath}/${parentId}/${subcollectionName}`;
    const ref = collection(this.firestore, path);
    const q = query(ref, orderBy(orderByField, 'asc')); // Sortiert Nachrichten aufsteigend nach Zeit
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }
}
