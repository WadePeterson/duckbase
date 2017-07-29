import { Path } from './query';

export const SET_NODE_VALUE = '@@duckbase/SET_NODE_VALUE';

export interface SetNodeValuePayload { path: Path; value: any; }
export const setNodeValue = (payload: SetNodeValuePayload) => ({ type: SET_NODE_VALUE, payload });
