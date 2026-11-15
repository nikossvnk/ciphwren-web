// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { legacy_createStore as createStore, applyMiddleware, Action, Dispatch, Middleware, Store } from "redux";
import { persistStore } from "redux-persist";
import { thunk } from "redux-thunk";
import { createLogger } from "redux-logger";
import { ActionMeta } from "redux-actions";
import { useDispatch } from "react-redux";

import promiseMiddleware from "./promise-middleware";

import reducers from "./construct";

// Workaround babel limitation
export * from "./reducers";
export * from "./construct";

const middleware: Middleware[] = [
  thunk,
  promiseMiddleware,
];

if (import.meta.env.DEV) {
  middleware.push(createLogger());
}

// The actions of redux-actions are interfaces without an index signature, so they don't fit Redux's
// default UnknownAction: dispatch any action with a type.
export type AppDispatch = Dispatch<Action<string>>;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

// FIXME: Hack, we don't actually return a promise when one is not passed.
export function asyncDispatch<T, V>(action: ActionMeta<Promise<T> | T, V>): Promise<ActionMeta<T, V>> {
  return store.dispatch(action) as any;
}

export function useAsyncDispatch() {
  const dispatch = useAppDispatch();
  return function (action: any): any {
    return dispatch(action) as any;
  } as typeof asyncDispatch;
}

export const store = createStore(
  reducers,
  applyMiddleware(...middleware)
);

// persistStore only dispatches its own actions, but its type takes a store of Redux's UnknownAction
export const persistor = persistStore(store as unknown as Store, { manualPersist: true } as any);
