export type ServersList = Array<string>;

export type Obj = Record<string, unknown>;

export type OptionalKey<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
