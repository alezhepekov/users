import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { User } from '../types/user';

@Component({
  selector: 'app-users',
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.less'
})
export class UsersComponent implements OnInit {
  checked = false;
  loading = false;
  indeterminate = false;
  currentPageUsers: readonly User[] = [];
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  onQueryParamsChange(params: NzTableQueryParams) {
    let httpParams: HttpParams = new HttpParams();
    httpParams = httpParams.set('pageIndex', params.pageIndex - 1);
    httpParams = httpParams.set('pageSize', params.pageSize);
    params.sort?.forEach((field) => {
      if (field.value) {
        httpParams = httpParams.set('sort', `${field.key},${field.value === 'ascend' ? 'asc' : 'desc'}`);
      }
    });
    params.filter?.forEach((filter) => {
      if (filter.value?.length > 0) {
        httpParams = httpParams.set('filter', `${filter.key},in,${filter.value.join(';')}`);
      }
    });
    this.http.get('http://localhost:3000/api/users', {
      params: httpParams
    }).subscribe((data: any) => {
      this.users = [...data.users];
      this.total = data.meta.total;
    });
  }

  updateCheckedSet(id: number, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  onCurrentPageDataChange(currentPageUsers: readonly User[]): void {
    this.currentPageUsers = currentPageUsers;
    this.refreshCheckedStatus();
  }

  refreshCheckedStatus(): void {
    const listOfEnabledData = this.currentPageUsers.filter(({ disabled }) => !disabled);
    this.checked = listOfEnabledData.every(({ id }) => this.setOfCheckedId.has(id));
    this.indeterminate = listOfEnabledData.some(({ id }) => this.setOfCheckedId.has(id)) && !this.checked;
  }

  onItemChecked(id: number, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  onAllChecked(checked: boolean): void {
    this.currentPageUsers
      .filter(({ disabled }) => !disabled)
      .forEach(({ id }) => this.updateCheckedSet(id, checked));
    this.refreshCheckedStatus();
  }

  sendRequest(): void {
    this.loading = true;
    const requestData = this.users.filter(currentUser => this.setOfCheckedId.has(currentUser.id));
    console.log(requestData);
    setTimeout(() => {
      this.setOfCheckedId.clear();
      this.refreshCheckedStatus();
      this.loading = false;
    }, 1000);
  }
}
