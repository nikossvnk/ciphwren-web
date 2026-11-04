// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

export const appName = "EteSync";
// The server the login and signup pages use unless another one is entered; without one set at build time
// the server has to be entered
export const defaultServerUrl: string | undefined = import.meta.env.REACT_APP_DEFAULT_API_PATH || undefined;
export const homePage = "https://www.etesync.com/";
export const faq = homePage + "faq/";
export const pricing = homePage + "pricing/";
export const getApps = homePage + "get-apps/";
export const terms = homePage + "tos/";
export const sourceCode = "https://github.com/nikossvnk/etesync-web";
export const reportIssue = sourceCode + "/issues";

export const forgotPassword = "https://www.etesync.com/faq/#forgot-password";
