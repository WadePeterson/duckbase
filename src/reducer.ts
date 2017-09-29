import * as Actions from './actions';
import { Path, splitPath } from './query';
import { DuckbaseState, MetaState } from './utils';

const initialState: DuckbaseState = {
  data: {},
  meta: {},
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
  const dataPath = splitPath(action.payload.path.key);
  state = updateMetaForPath(state, path, { isFetching: false, lastLoadedTime: new Date().getTime() });

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
      data: updateDeep(state.query.data, dataPath, action.payload.value)
    }
  };
}

function updateMetaForPath(state: DuckbaseState, path: Path, metaUpdates: Partial<MetaState>): DuckbaseState {
  const existingMetaForPath = state.meta[path.key] || {};
  return {
    ...state,
    meta: {
      ...state.meta,
      [path.key]: {
        ...existingMetaForPath,
        ...metaUpdates
      }
    }
  };
}

function handleStartFetch(state: DuckbaseState, action: Action<Actions.StartFetchPayload>) {
  const { path } = action.payload;
  state = updateMetaForPath(state, action.payload.path, { isFetching: true });

  if (path.query) {
    state = {
      ...state,
      query: {
        ...state.query,
        namesToKeys: {
          ...state.query.namesToKeys,
          [path.query.options.name]: path.key
        }
      }
    };
  }

  return state;
}

function handleStopListening(state: DuckbaseState, action: Action<Actions.StopListeningPayload>) {
  return updateMetaForPath(state, action.payload.path, { isFetching: false });
}

function handleSetError(state: DuckbaseState, action: Action<Actions.SetErrorPayload>) {
  return updateMetaForPath(state, action.payload.path, {
    error: action.payload.error,
    isFetching: false,
    lastLoadedTime: new Date().getTime()
  });
}

export default function reducer(state = initialState, action: Action<any>): DuckbaseState {
  switch (action.type) {
    case Actions.SET_NODE_VALUE: {
      return handleSetNodeValue(state, action);
    }
    case Actions.START_FETCH: {
      return handleStartFetch(state, action);
    }
    case Actions.STOP_LISTENING: {
      return handleStopListening(state, action);
    }
    case Actions.SET_ERROR: {
      return handleSetError(state, action);
    }
    default:
      return state;
  }
}
