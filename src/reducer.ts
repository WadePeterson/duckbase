import * as Actions from './actions';
import { DuckbaseState } from './utils';

const initialState: DuckbaseState = {
  data: {},
  query: {
    data: {},
    namesToKeys: {}
  }
};

export interface Action<T> {
  type: string;
  payload: T;
}

function updateDeep(state: { [key: string]: any } = {}, path: string[], value: any): any {
  if (path.length === 0) {
    return value;
  }

  const key = path[0];

  return {
    ...state,
    [key]: updateDeep(state[key], path.slice(1), value)
  };
}

function handleSetNodeValue(state: DuckbaseState, action: Action<Actions.SetNodeValuePayload>) {
  const path = action.payload.path;
  const dataPath = action.payload.path.key.split('/').filter(p => !!p);

  if (!path.query) {
    return {
      ...state,
      data: updateDeep(state.data, dataPath, action.payload.value)
    };
  }

  return {
    ...state,
    query: {
      ...state.query,
      data: updateDeep(state.query.data, dataPath, action.payload.value),
      namesToKeys: {
        ...state.query.namesToKeys,
        [path.query.options.name]: path.key
      }
    }
  };
}

export default function reducer(state = initialState, action: Action<any>): DuckbaseState {
  switch (action.type) {
    case Actions.SET_NODE_VALUE: {
      return handleSetNodeValue(state, action);
    }
    default:
      return state;
  }
}
