import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UsersService } from './../users.service';
import { User } from '../types/user';

@UntilDestroy()
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
  sendRequestIsloading = false;
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
    private readonly cdr: ChangeDetectorRef,
    private readonly usersService: UsersService
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
    this.usersService.getUsers(pageIndex, pageSize, sortField, sortOrder, filter)
      .pipe(untilDestroyed(this))
      .subscribe(data => {
        this.total = data.meta.total;
        this.users = data.users;
        this.loading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      });
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
    this.usersService.getFUsersList(Array.from(this.setOfCheckedId).map((value: number) => value.toString()))
      .pipe(untilDestroyed(this))
      .subscribe(data => {
        console.log(data);
      });
    this.sendRequestIsloading = true;
    setTimeout(() => {
      this.setOfCheckedId.clear();
      this.refreshCheckedStatus();
      this.sendRequestIsloading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }, 1000);
  }
}
