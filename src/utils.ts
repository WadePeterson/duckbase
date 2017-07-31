export interface DuckbaseState {
  data: { [key: string]: any };
  query: QueryState;
}

export interface QueryState {
  data: { [key: string]: any };
  namesToKeys: { [name: string]: string };
}

export function getValue<T>(state: DuckbaseState, path: string): T | null {
  return getDeepValue<T>(state.data, path);
}

export function getQueryValue<T>(state: DuckbaseState, queryName: string): T | null {
  const queryKey = state.query.namesToKeys[queryName];
  return queryKey ? getDeepValue(state.query.data, queryKey) : null;
}

function getDeepValue<T>(data: { [key: string]: any }, path: string): T | null {
  const value = path.split('/').filter(p => !!p).reduce((acc, key) => acc && acc[key], data);
  return typeof value === 'undefined' ? null : value as T;
}
