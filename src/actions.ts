import { Path } from './query';

export const SET_NODE_VALUE = '@@duckbase/SET_NODE_VALUE';
export interface SetNodeValuePayload { path: Path; value: any; }
export const setNodeValue = (payload: SetNodeValuePayload) => ({ type: SET_NODE_VALUE, payload });

export const START_FETCH = '@@duckbase/START_FETCH';
export interface StartFetchPayload { path: Path; }
export const startFetch = (payload: StartFetchPayload) => ({ type: START_FETCH, payload });

export const STOP_LISTENING = '@@duckbase/STOP_LISTENING';
export interface StopListeningPayload { path: Path; }
export const stopListening = (payload: StopListeningPayload) => ({ type: STOP_LISTENING, payload });

export const SET_ERROR = '@@duckbase/SET_ERROR';
export interface SetErrorPayload { error: any; path: Path; }
export const setError = (payload: SetErrorPayload) => ({ type: SET_ERROR, payload });
