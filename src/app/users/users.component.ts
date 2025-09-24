import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, Observable, of } from 'rxjs';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { User } from '../types/user';
import { Meta } from '../types/meta';
@Component({
  selector: 'app-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.less'
})
export class UsersComponent implements OnInit {
  checked = false;
  loading = false;
  indeterminate = false;
  setOfCheckedId = new Set<number>();
  users: User[] = [];
  total: number = 0;
  filterGender = [
    { text: 'Male', value: 'MALE' },
    { text: 'Female', value: 'FEMALE' }
  ];
  filterAccountType = [
    { text: 'Admin', value: 'ADMIN' },
    { text: 'Normal', value: 'NORMAL' },
    { text: 'Guest', value: 'GUEST' }
  ];
  firstName: string = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {}

  searchFirstName(): void {}

  loadDataFromServer(
    pageIndex: number,
    pageSize: number,
    sortField: string | null,
    sortOrder: string | null,
    filter: Array<{ key: string; value: string[] }>
  ): void {
    this.loading = true;
    this.getUsers(pageIndex, pageSize, sortField, sortOrder, filter).subscribe(data => {
      this.total = data.meta.total;
      this.users = data.users;
      this.loading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  getUsers(
    pageIndex: number,
    pageSize: number,
    sortField: string | null,
    sortOrder: string | null,
    filters: Array<{ key: string; value: string[] }>
  ): Observable<{ users: User[], meta: Meta }> {
    let params = new HttpParams()
      .append('pageIndex', `${pageIndex}`)
      .append('pageSize', `${pageSize}`)
      .append('sortField', `${sortField}`)
      .append('sortOrder', `${sortOrder}`);
    filters.forEach(filter => {
      filter.value.forEach(value => {
        params = params.append(filter.key, value);
      });
    });
    return this.http
      .get<{ users: User[], meta: Meta }>('http://localhost:3000/api/users', { params })
      .pipe(catchError(() => of({ users: [], meta: { pageIndex: pageIndex, pageSize: pageSize, total: 0 } })));
  }

  onQueryParamsChange(params: NzTableQueryParams) {
    const { pageSize, pageIndex, sort, filter } = params;
    const currentSort = sort.find(item => item.value !== null);
    const sortField = (currentSort && currentSort.key) || null;
    const sortOrder = (currentSort && currentSort.value) || null;
    this.loadDataFromServer(pageIndex, pageSize, sortField, sortOrder, filter);
  }

  updateCheckedSet(id: number, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  refreshCheckedStatus(): void {
    const listOfEnabledUser = this.users.filter(({ disabled }) => !disabled);
    this.checked = listOfEnabledUser.every(({ id }) => this.setOfCheckedId.has(id));
    this.indeterminate = listOfEnabledUser.some(({ id }) => this.setOfCheckedId.has(id)) && !this.checked;
  }

  onItemChecked(id: number, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  onAllChecked(checked: boolean): void {
    this.users
      .filter(({ disabled }) => !disabled)
      .forEach(({ id }) => this.updateCheckedSet(id, checked));
    this.refreshCheckedStatus();
  }

  sendRequest(): void {
    console.log(Array.from(this.setOfCheckedId))
    this.loading = true;
    setTimeout(() => {
      this.setOfCheckedId.clear();
      this.refreshCheckedStatus();
      this.loading = false;
    }, 1000);
  }
}
