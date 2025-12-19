import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private searchQuerySubject = new BehaviorSubject<string>('');
  public searchQuery$ = this.searchQuerySubject.asObservable();

  private searchActiveSubject = new BehaviorSubject<boolean>(false);
  public searchActive$ = this.searchActiveSubject.asObservable();

  updateSearchQuery(query: string) {
    this.searchQuerySubject.next(query);
    this.searchActiveSubject.next(query.trim().length > 0);
  }

  clearSearch() {
    this.searchQuerySubject.next('');
    this.searchActiveSubject.next(false);
  }

  isSearchActive(): boolean {
    return this.searchActiveSubject.value;
  }
}
