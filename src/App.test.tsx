// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { it } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";

import { store } from "./store";

it("renders without crashing", () => {
  const root = createRoot(document.createElement("div"));
  act(() => {
    root.render(
      <Provider store={store}>
        <App />
      </Provider>
    );
  });
  act(() => root.unmount());
});
