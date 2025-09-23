import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { catchError, Observable, of } from 'rxjs';
import { subDays } from 'date-fns';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { User } from '../types/user';
import { Meta } from '../types/meta';
import { Utils } from '../types/utils';
import { FormsModule } from '@angular/forms';
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
  originalUsersTest: User[] = [];
  usersTest: User[] = [];
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.generateRandomUserList();
  }

  searchFirstName() {
    if (this.firstName) {
      this.usersTest = this.usersTest.filter((currentser: User) => currentser.firstName.toLowerCase() === this.firstName.toLowerCase());
      this.loadDataFromServer(1, 10, null, null, []);
    }
  }

  generateRandomUserList(count: number = 1000000) {
    const manNames: string[] = ["Oliver", "Jack", "Harry", "Jacob", "George", "Noah", "Charlie", "Thomas", "Oscar", "William", "James", "Alexey", "Alexander", "Jhon", "Mike"];
    const womanNames: string[] = ["Olivia", "Amelia", "Isla", "Ava", "Emily"];
    const accuntTypes: string[] = ["ADMIN", "NORMAL", "GUEST"];

    for (let i = 0; i < count; i++) {
      const dateOfBirth: string = subDays(new Date(), Utils.randomIntFromInterval(0, 100 * 365)).toISOString();
      const gender: string = i % 2 === 0 ? "MALE" : "FEMALE";
      const name: string = i % 2 === 0 ? manNames[Utils.randomIntFromInterval(0, manNames.length - 1)] : womanNames[Utils.randomIntFromInterval(0, womanNames.length - 1)];
      const accuntType: string = accuntTypes[Utils.randomIntFromInterval(0, accuntTypes.length - 1)];
      this.usersTest.push(
        {
          id: i + 1,
          firstName: name,
          dateOfBirth: dateOfBirth,
          gender: gender,
          email: `user.${i + 1}@myorg.net`,
          phone: `+${i + 1}`,
          password: `${i + 1}`,
          accountType: accuntType,
          disabled: false
        }
      );
    }
    this.originalUsersTest = [...this.usersTest];
  }

  loadDataFromServer(
    pageIndex: number,
    pageSize: number,
    sortField: string | null,
    sortOrder: string | null,
    filter: Array<{ key: string; value: string[] }>
  ): void {
    this.loading = true;
    this.total = 1000000;
    if (sortField && sortOrder) {
      if (sortField === 'firstName') {
        if (sortOrder === 'ascend') {
          this.usersTest.sort((a: User, b: User) => {
            if (a.firstName > b.firstName) {
              return 1;
            }
            if (a.firstName < b.firstName) {
              return -1;
            }
            return 0;
          });
        } else {
          this.usersTest.sort((a: User, b: User) => {
            if (a.firstName < b.firstName) {
              return 1;
            }
            if (a.firstName > b.firstName) {
              return -1;
            }
            return 0;
          });
        }
      } else if (sortField === 'dateOfBirth') {
        if (sortOrder === 'ascend') {
          this.usersTest.sort((a: User, b: User) => {
            if (new Date(a.dateOfBirth) > new Date(b.dateOfBirth)) {
              return 1;
            }
            if (new Date(a.dateOfBirth) < new Date(b.dateOfBirth)) {
              return -1;
            }
            return 0;
          });
        } else {
          this.usersTest.sort((a: User, b: User) => {
            if (new Date(a.dateOfBirth) < new Date(b.dateOfBirth)) {
              return 1;
            }
            if (new Date(a.dateOfBirth) > new Date(b.dateOfBirth)) {
              return -1;
            }
            return 0;
          });
        }
      }
    } else {
      if (this.firstName.length === 0) {
        this.usersTest = [...this.originalUsersTest];
      }
    }
    filter?.forEach((curentFilter) => {
      if (curentFilter.key === 'gender') {
        if (curentFilter.value && Array.isArray(curentFilter.value) && curentFilter.value.length > 0) {
          this.usersTest = this.usersTest.filter((currentser: User) => curentFilter.value.includes(currentser.gender))
        }
      } else if (curentFilter.key === 'accountType') {
        if (curentFilter.value && Array.isArray(curentFilter.value) && curentFilter.value.length > 0) {
          this.usersTest = this.usersTest.filter((currentser: User) => curentFilter.value.includes(currentser.accountType))
        }
      }
    })
    this.users = this.usersTest.slice((pageIndex - 1) * pageSize, ((pageIndex - 1) * pageSize) + pageSize);
    this.loading = false;
    // this.getUsers(pageIndex, pageSize, sortField, sortOrder, filter).subscribe(data => {
    //   this.total = data.meta.total;
    //   this.users = data.users;
    //   this.loading = false;
    // });
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
