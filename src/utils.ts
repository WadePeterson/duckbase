import * as firebase from 'firebase';
import { User } from './auth';
import { splitPath } from './query';

export interface DuckbaseState {
  auth: { user: User | null, meta: MetaState<firebase.auth.Error> };
  data: { [key: string]: any };
  meta: { [key: string]: MetaState };
  query: QueryState;
}

export interface QueryState {
  data: { [key: string]: any };
  namesToKeys: { [name: string]: string };
}

export interface MetaState<E = firebase.FirebaseError> {
  lastLoadedTime?: number;
  isFetching: boolean;
  error?: E;
}

export interface DuckbaseQuerySnapshotPath {
  queryName: string;
}

export interface DuckbaseSnapshot<T, E = firebase.FirebaseError> {
  val: () => T | null;
  lastError: () => E | null;
  lastLoadedTime: () => number | null;
  isFetching: () => boolean;
  hasLoaded: () => boolean;
}

class DuckbaseDataSnapshot<T> implements DuckbaseSnapshot<T> {
  private _state: DuckbaseState;
  private _value?: T | null;
  private _meta?: MetaState;
  private _path?: string;
  private _dataPathArr?: string[];

  constructor(state: DuckbaseState, path: string | DuckbaseQuerySnapshotPath) {
    this._state = state;

    if (typeof path !== 'string') {
      this._path = state.query.namesToKeys[path.queryName];
    } else {
      this._dataPathArr = splitPath(path);
      this._path = this._dataPathArr.join('/');
    }
  }

  private meta() {
    if (typeof this._meta === 'undefined') {
      this._meta = (this._path && this._state.meta[this._path]) || { isFetching: false };
    }
    return this._meta;
  }

  val() {
    if (typeof this._value === 'undefined') {
      if (this._dataPathArr) {
        this._value = getDeepValue(this._state.data, this._dataPathArr);
      } else {
        this._value = this._path ? getDeepValue(this._state.query.data, this._path) : null;
      }
    }
    return this._value as T | null;
  }

  lastError() {
    return this.meta().error || null;
  }

  lastLoadedTime() {
    return this.meta().lastLoadedTime || null;
  }

  isFetching() {
    return this.meta().isFetching;
  }

  hasLoaded() {
    return !!this.meta().lastLoadedTime;
  }
}

export function currentUserSnapshot(state: DuckbaseState): DuckbaseSnapshot<firebase.UserInfo, firebase.auth.Error> {
  return {
    hasLoaded: () => !!state.auth.meta.lastLoadedTime,
    isFetching: () => state.auth.meta.isFetching,
    lastError: () => state.auth.meta.error || null,
    lastLoadedTime: () => state.auth.meta.lastLoadedTime || null,
    val: () => state.auth.user
  };
}

export function getCurrentUser(state: DuckbaseState) {
  return state.auth.user;
}

export function snapshot<T>(state: DuckbaseState, path: string | DuckbaseQuerySnapshotPath): DuckbaseSnapshot<T> {
  return new DuckbaseDataSnapshot<T>(state, path);
}

export function hasLoaded(state: DuckbaseState, path: string): boolean {
  return snapshot(state, path).hasLoaded();
}

export function isLoading(state: DuckbaseState, path: string): boolean {
  return snapshot(state, path).isFetching();
}

export const isFetching = isLoading;

export function isQueryLoading(state: DuckbaseState, queryName: string): boolean {
  return snapshot(state, { queryName }).isFetching();
}

export function getValue<T>(state: DuckbaseState, path: string): T | null {
  return snapshot<T>(state, path).val();
}

export function getQueryValue<T>(state: DuckbaseState, queryName: string): T | null {
  return snapshot<T>(state, { queryName }).val();
}

function getDeepValue<T>(data: { [key: string]: any }, path: string | string[]): T | null {
  path = Array.isArray(path) ? path : splitPath(path);
  const value = path.reduce((acc, key) => acc && acc[key], data);
  return typeof value === 'undefined' ? null : value as T;
}
