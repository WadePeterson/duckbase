import { Action } from './utils';
import * as Actions from './actions';
import isObject = require('lodash.isobject');

type State = { [key: string]: any };
const initialState = {};

export type Action<T> = { type: string, payload: T };

function updateDeep(currentNodeValue: {[key: string]: any} = {}, currentPath: string[], targetPath: string[], targetValue: any) {
  let newValueForCurrentNode: any;

  if (targetPath.length === 0) {
    if (isObject(targetValue)) {
      newValueForCurrentNode = Object.keys(targetValue).reduce((acc, key) => {
        return updateDeep(acc, [], [key], targetValue[key]);
      }, currentNodeValue);
    } else {
      newValueForCurrentNode = targetValue;
    }
  } else {
    const key = targetPath[0];
    const childNodeValue = updateDeep(currentNodeValue[key], currentPath.concat(key), targetPath.slice(1), targetValue);
    newValueForCurrentNode = { ...currentNodeValue, [key]: childNodeValue };

    // If I only have one child, and its value is null, then I should also be null
    if (childNodeValue === null) {
      if (Object.keys(newValueForCurrentNode).length === 1) {
        newValueForCurrentNode = null;
      } else {
        delete newValueForCurrentNode[key];
      }
    }
  }

  return newValueForCurrentNode;
}

function handleSetNodeValue(state: State, action: Action<Actions.SetNodeValuePayload>) {
  const path = action.payload.path.split('/').filter(p => !!p);
  return updateDeep(state, [], path, action.payload.value) || {};
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
