import { normalizePath, splitPath } from './query';

export interface DuckbaseState {
  data: { [key: string]: any };
  meta: { [key: string]: MetaState };
  query: QueryState;
}

export interface QueryState {
  data: { [key: string]: any };
  namesToKeys: { [name: string]: string };
}

export interface MetaState {
  lastLoadedTime?: number;
  isFetching: boolean;
}

export class DuckbaseRef<T> {
  private state: DuckbaseState;
  private path: string;
  private pathArr: string[];
  private value: T | null;
  private meta: MetaState;

  constructor(state: DuckbaseState, path: string) {
    this.state = state;
    this.pathArr = splitPath(path);
    this.path = this.pathArr.join('/');
  }

  private getMeta() {
    if (typeof this.meta === 'undefined') {
      this.meta = this.state.meta[this.path] || {
        isFetching: false
      };
    }
    return this.meta;
  }

  val() {
    if (typeof this.value === 'undefined') {
      this.value = getDeepValue<T>(this.state.data, this.pathArr);
    }
    return this.value;
  }

  isFetching() {
    return this.getMeta().isFetching;
  }

  hasBeenLoaded() {
    return !!this.getMeta().lastLoadedTime;
  }
}

export function ref(state: DuckbaseState, path: string) {
  return new DuckbaseRef(state, path);
}

export function isLoading(state: DuckbaseState, path: string): boolean {
  path = normalizePath(path);
  const meta = state.meta[path];
  return !!(meta && meta.isFetching);
}

export function isQueryLoading(state: DuckbaseState, queryName: string): boolean {
  const queryKey = state.query.namesToKeys[queryName];
  return !!queryKey && isLoading(state, queryKey);
}

export function getValue<T>(state: DuckbaseState, path: string): T | null {
  return getDeepValue<T>(state.data, path);
}

export function getQueryValue<T>(state: DuckbaseState, queryName: string): T | null {
  const queryKey = state.query.namesToKeys[queryName];
  return queryKey ? getDeepValue(state.query.data, queryKey) : null;
}

function getDeepValue<T>(data: { [key: string]: any }, path: string | string[]): T | null {
  path = Array.isArray(path) ? path : splitPath(path);
  const value = path.reduce((acc, key) => acc && acc[key], data);
  return typeof value === 'undefined' ? null : value as T;
}
