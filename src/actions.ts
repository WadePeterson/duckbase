export const SET_NODE_VALUE = '@@duckbase/SET_NODE_VALUE';

export type SetNodeValuePayload = { path: string; value: any };
export const setNodeValue = (payload: SetNodeValuePayload) => ({ type: SET_NODE_VALUE, payload });
