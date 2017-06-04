import { Action } from './utils';
import * as Actions from './actions';
import isObject = require('lodash.isobject');

type State = { [key: string]: any };
const initialState = {};

export type Action<T> = { type: string, payload: T };

function updateDeep(state: State = {}, path: string[], value: any): any {
  if (path.length === 0) {
    return value;
  }

  const key = path[0];

  return {
    ...state,
    [key]: updateDeep(state[key], path.slice(1), value)
  };
}

function handleSetNodeValue(state: State, action: Action<Actions.SetNodeValuePayload>) {
  const path = action.payload.path.split('/').filter(p => !!p);
  return updateDeep(state, path, action.payload.value);
}

export default function (state = initialState, action: Action<any>) {
  switch (action.type) {
    case Actions.SET_NODE_VALUE: {
      return handleSetNodeValue(state, action);
    }
    default:
      return state;
  }
}
