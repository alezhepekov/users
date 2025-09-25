import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, mergeMap, Observable, of } from 'rxjs';
import { User } from './types/user';
import { Meta } from './types/meta';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  constructor(
    private http: HttpClient
  ) {}

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

  getFUsersList(idList: string[]): void {
    let params = new HttpParams();
    const getUsersPromise = (value: string): Promise<User> => {
      return new Promise<User>((resolve) => {
        this.http
          .get<User>(`http://localhost:3000/api/users/${value}`, { params })
          .subscribe((data: User) => {
            resolve(data);
          });
      });
    };

    const usersList$: Observable<User[]> =
      of(idList)
        .pipe(mergeMap(q => forkJoin(...q.map(getUsersPromise))));
    usersList$
      .subscribe((value: User[]) => {
        console.log(value);
      });
  }
}
