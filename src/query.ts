import * as firebase from 'firebase';

export interface Path {
  key: string;
  query?: DuckbaseQuery;
}

export interface PathMap {
  [key: string]: Path;
}

export function diffKeys<T>(pathsA: { [key: string]: T }, pathsB: { [key: string]: T }): T[] {
  return Object.keys(pathsA).filter(key => !pathsB[key]).map(key => pathsA[key]);
}

function normalizePath(path: string) {
  return path.split('/').filter(p => !!p).join('/');
}

export function getPath(pathLike: string | DuckbaseQuery): Path {
  if (typeof pathLike === 'string') {
    return { key: normalizePath(pathLike) };
  }
  return { key: pathLike.toString(), query: pathLike };
}

export function getRefFromPath(app: firebase.app.App, path: Path) {
  return path.query ? buildRefFromQuery(app, path.query) : app.database().ref(path.key);
}

function buildRefFromQuery(app: firebase.app.App, query: DuckbaseQuery) {
  const options = query.options;
  let ref: firebase.database.Query = app.database().ref(options.path);

  if (options.orderByType === OrderByType.Key) {
    ref = ref.orderByKey();
  } else if (options.orderByType === OrderByType.Child) {
    ref = ref.orderByChild(options.orderByChildPath as string);
  } else if (options.orderByType === OrderByType.Priority) {
    ref = ref.orderByPriority();
  } else if (options.orderByType === OrderByType.Value) {
    ref = ref.orderByValue();
  }

  if (typeof options.limitToFirst !== 'undefined') {
    ref = ref.limitToFirst(options.limitToFirst);
  }
  if (typeof options.limitToLast !== 'undefined') {
    ref = ref.limitToLast(options.limitToLast);
  }
  if (typeof options.startAtValue !== 'undefined') {
    ref = ref.startAt(options.startAtValue, options.startAtKey);
  }
  if (typeof options.endAtValue !== 'undefined') {
    ref = ref.endAt(options.endAtValue, options.endAtKey);
  }
  if (typeof options.equalToValue !== 'undefined') {
    ref = ref.equalTo(options.equalToValue, options.equalToKey);
  }

  return ref;
}

export enum OrderByType {
  Child = 'child',
  Key = 'key',
  Priority = 'priority',
  Value = 'value'
}

export interface QueryOptions {
  startAtValue?: number | string | boolean | null;
  startAtKey?: string;
  endAtValue?: number | string | boolean | null;
  endAtKey?: string;
  orderByType?: OrderByType;
  orderByChildPath?: string;
  limitToFirst?: number;
  limitToLast?: number;
  equalToValue?: number | string | boolean | null;
  equalToKey?: string;
  path: string;
  name: string;
}

export class DuckbaseQueryBuilder {
  name(name: string) {
    return new DuckbaseQueryBuilderWithName(name);
  }
}

export class DuckbaseQueryBuilderWithName {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  ref(path: string) {
    path = normalizePath(path);
    return new DuckbaseQueryNoOrder({ name: this.name, path });
  }
}

export class DuckbaseQuery {
  public options: QueryOptions & { [key: string]: any };

  constructor(queryOptions: QueryOptions) {
    this.options = queryOptions;
  }

  limitToFirst(limit: number) {
    this.options.limitToFirst = limit;
    return this;
  }

  limitToLast(limit: number) {
    this.options.limitToLast = limit;
    return this;
  }

  toString() {
    const queryParams = Object.keys(this.options)
      .filter(key => key !== 'path' && key !== 'name' && typeof this.options[key] !== 'undefined')
      .map(key => {
        const value = this.options[key];
        return key + '=' + (typeof value === 'string' ? `"${value}"` : value);
      }).join('&');
    return this.options.path + (queryParams ? '?' + queryParams : '');
  }
}

export class DuckbaseQueryNoOrder extends DuckbaseQuery {
  orderByKey() {
    this.options.orderByType = OrderByType.Key;
    return new DuckbaseQueryOrderedByKey(this.options);
  }

  orderByChild(path: string) {
    this.options.orderByType = OrderByType.Child;
    this.options.orderByChildPath = path;
    return new DuckbaseQueryOrderedByNonKey(this.options);
  }

  orderByPriority() {
    this.options.orderByType = OrderByType.Priority;
    return new DuckbaseQueryOrderedByNonKey(this.options);
  }

  orderByValue() {
    this.options.orderByType = OrderByType.Value;
    return new DuckbaseQueryOrderedByNonKey(this.options);
  }
}

export class DuckbaseQueryOrderedByKey extends DuckbaseQuery {
  startAt(value: string) {
    this.options.startAtValue = value;
    return this;
  }

  endAt(value: string) {
    this.options.endAtValue = value;
    return this;
  }

  equalTo(value: string) {
    this.options.equalToValue = value;
    return this;
  }
}

export class DuckbaseQueryOrderedByNonKey extends DuckbaseQuery {
  startAt(value: number | string | boolean | null, key?: string) {
    this.options.startAtValue = value;
    this.options.startAtKey = key;
    return this;
  }

  endAt(value: number | string | boolean | null, key?: string) {
    this.options.endAtValue = value;
    this.options.endAtKey = key;
    return this;
  }

  equalTo(value: number | string | boolean | null, key?: string) {
    this.options.equalToValue = value;
    this.options.equalToKey = key;
    return this;
  }
}
