// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

export const appName = "Ciphwren Web";
// The server the login and signup pages use unless another one is entered; without one set at build time
// the server has to be entered
export const defaultServerUrl: string | undefined = import.meta.env.REACT_APP_DEFAULT_API_PATH || undefined;
// Where accounts are created when the app is hosted by a service with its own signup (its dashboard): the signup
// page then links there instead of signing up on the server directly
export const signupUrl: string | undefined = import.meta.env.VITE_SIGNUP_URL || undefined;
export const sourceCode = "https://github.com/nikossvnk/ciphwren-web";
export const reportIssue = sourceCode + "/issues";
