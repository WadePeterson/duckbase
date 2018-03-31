import * as Redux from 'redux';
import * as Actions from './actions';
import { Path, splitPath } from './query';
import { DuckbaseState, MetaState } from './utils';

const initialState: DuckbaseState = {
  auth: { user: null, meta: { isFetching: false } },
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

function handleAuthState(state: DuckbaseState, action: Action<Actions.SetAuthStatePayload>): DuckbaseState {
  return {
    ...state, auth: {
      meta: {
        ...state.auth.meta,
        lastLoadedTime: new Date().getTime()
      },
      user: action.payload.user
    }
  };
}

function handleAuthError(state: DuckbaseState, action: Action<Actions.SetAuthErrorPayload>): DuckbaseState {
  return {
    ...state, auth: {
      ...state.auth,
      meta: {
        ...state.auth.meta,
        error: action.payload.error,
        lastLoadedTime: new Date().getTime()
      }
    }
  };
}

const handlers: { [actionType: string]: (state: DuckbaseState, action: Action<any>) => DuckbaseState } = {
  [Actions.SET_NODE_VALUE]: handleSetNodeValue,
  [Actions.START_FETCH]: handleStartFetch,
  [Actions.STOP_LISTENING]: handleStopListening,
  [Actions.SET_ERROR]: handleSetError,
  [Actions.SET_AUTH_STATE]: handleAuthState,
  [Actions.SET_AUTH_ERROR]: handleAuthError
};

const reducer: Redux.Reducer<DuckbaseState> = (state = initialState, action) => {
  const handler = handlers[action.type];
  return handler ? handler(state, action as Action<any>) : state;
};

export default reducer;
