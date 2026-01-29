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

  private searchTypeSubject = new BehaviorSubject<'all' | 'channels' | 'users'>('all');
  public searchType$ = this.searchTypeSubject.asObservable();

  updateSearchQuery(query: string) {
    let type: 'all' | 'channels' | 'users' = 'all';
    let cleanQuery = query;

    if (query.startsWith('#')) {
      type = 'channels';
      cleanQuery = query.slice(1);
    } else if (query.startsWith('@')) {
      type = 'users';
      cleanQuery = query.slice(1);
    }

    this.searchTypeSubject.next(type);
    this.searchQuerySubject.next(cleanQuery);
    this.searchActiveSubject.next(query.trim().length > 0);
  }

  clearSearch() {
    this.searchQuerySubject.next('');
    this.searchActiveSubject.next(false);
    this.searchTypeSubject.next('all');
  }

  isSearchActive(): boolean {
    return this.searchActiveSubject.value;
  }

  getSearchType(): 'all' | 'channels' | 'users' {
    return this.searchTypeSubject.value;
  }
}
