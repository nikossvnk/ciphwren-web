// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { it, expect, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import SignupPage from "./SignupPage";
import type * as Constants from "./constants";

import { store } from "./store";

vi.mock("./constants", async (importOriginal) => ({
  ...(await importOriginal<typeof Constants>()),
  signupUrl: "https://app.example.com/signup",
}));

it("sends people to the signup URL instead of signing up when one is set", () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() => {
    root.render(
      <Provider store={store}>
        <MemoryRouter>
          <SignupPage />
        </MemoryRouter>
      </Provider>
    );
  });
  const link = Array.from(container.querySelectorAll("a")).find((a) => a.textContent === "Create an account");
  expect(link?.getAttribute("href")).toBe("https://app.example.com/signup");
  expect(container.querySelector("input[name=password]")).toBeNull();
  act(() => root.unmount());
});
