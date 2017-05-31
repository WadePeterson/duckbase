export interface Action<TPayload> {
  type: string;
  payload: TPayload;
}

export function returnType<T>(fn: (...args: any[]) => T): T {
  return null as any as T;
}
