export const Result = {
  from: Result_from,
  fromAsync: Result_fromAsync,
  fromPipe: Result_fromPipe,
  ok,
  err,
} as const;

type TSuccess<T> = { success: true; data: T } & {
  unwrap: () => T;
  unwrapOr: <U>(fn: (() => U) | U) => T | U;
};

type TFailure<E> = { success: false; error: E } & {
  unwrap: () => never;
  unwrapOr: <U>(fn: (() => U) | U) => U;
};

export type Result<T, E = Error> = TSuccess<T> | TFailure<E>;

function ok<T>(val: T): Result<T, never> {
  return {
    success: true,
    data: val,
    unwrap: () => val,
    unwrapOr: () => val,
  };
}

function err<E>(err: E): Result<never, E> {
  return {
    success: false,
    error: err,
    unwrap: () => {
      throw err;
    },
    unwrapOr: resolveUnwrapOr,
  };
}

function Result_from<T>(fn: () => T): Result<T, Error> {
  try {
    const data = fn();
    return { success: true, data, unwrap: () => data, unwrapOr: () => data };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      success: false,
      error: err,
      unwrap: () => {
        throw err;
      },
      unwrapOr: resolveUnwrapOr,
    };
  }
}

async function Result_fromAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    const data = await fn();
    return { success: true, data, unwrap: () => data, unwrapOr: () => data };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      success: false,
      error: err,
      unwrap: () => {
        throw err;
      },
      unwrapOr: resolveUnwrapOr,
    };
  }
}

function Result_fromPipe<T1, E = Error>(value: T1): Result<T1, E>;
function Result_fromPipe<T1, T2, E = Error>(value: T1, fn1: (input: T1) => T2): Result<T2, E>;
function Result_fromPipe<T1, T2, T3, E = Error>(
  value: T1,
  fn1: (input: T1) => T2,
  fn2: (input: T2) => T3,
): Result<T3, E>;
function Result_fromPipe<T1, T2, T3, T4, E = Error>(
  value: T1,
  fn1: (input: T1) => T2,
  fn2: (input: T2) => T3,
  fn3: (input: T3) => T4,
): Result<T4, E>;
function Result_fromPipe<T1, T2, T3, T4, T5, E = Error>(
  value: T1,
  fn1: (input: T1) => T2,
  fn2: (input: T2) => T3,
  fn3: (input: T3) => T4,
  fn4: (input: T4) => T5,
): Result<T5, E>;
function Result_fromPipe<E = Error>(
  value: unknown,
  ...fns: Array<(input: unknown) => unknown>
): Result<unknown, E> {
  try {
    const data = fns.reduce((acc, fn) => fn(acc), value);
    return {
      success: true,
      data,
      unwrap: () => data,
      unwrapOr: () => data,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      success: false,
      error: err as E,
      unwrap: () => {
        throw err;
      },
      unwrapOr: resolveUnwrapOr,
    };
  }
}

function resolveUnwrapOr<U>(fn: (() => U) | U): U {
  return typeof fn === "function" ? (fn as () => U)() : fn;
}
