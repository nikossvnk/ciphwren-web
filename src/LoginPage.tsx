// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import { useAppDispatch } from "./store";

import Container from "./widgets/Container";
import ExternalLink from "./widgets/ExternalLink";
import LoginForm from "./components/LoginForm";
import AuthHeader from "./widgets/AuthHeader";
import Divider from "@mui/material/Divider";
import IconCode from "@mui/icons-material/Code";

import { login } from "./store/actions";

import * as Etebase from "etebase";

import * as C from "./constants";

import { useCredentials } from "./credentials";
import LoadingIndicator from "./widgets/LoadingIndicator";
import { startTask } from "./helpers";
import { Link, Navigate, useLocation } from "react-router";
import { routeResolver } from "./App";

export default function LoginPage() {
  const credentials = useCredentials();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [loading, setLoading] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<Error>();

  if (credentials) {
    return (
      <Navigate to={routeResolver.getRoute("wizard")} state={location.state} replace />
    );
  }

  async function onFormSubmit(username: string, password: string, serverUrl: string) {
    try {
      setLoading(true);
      setFetchError(undefined);
      const etebase = await startTask((async () => {
        return await Etebase.Account.login(username, password, serverUrl);
      }));
      dispatch(login(etebase));
    } catch (e) {
      console.log(e);
      if ((e instanceof Etebase.HttpError) && (e.status === 404)) {
        setFetchError(new Error("Etebase server not found: are you sure the server URL is correct?"));
      } else {
        setFetchError(e);
      }
    } finally {
      setLoading(false);
    }
  }

  if (credentials === undefined) {
    return (
      <LoadingIndicator />
    );
  } else {
    return (
      <Container style={{ maxWidth: "28rem" }}>
        <AuthHeader title="Log in to Ciphwren">
          or {C.signupUrl ? <a href={C.signupUrl}>create an account</a> : <Link to={routeResolver.getRoute("signup")}>create an account</Link>}
        </AuthHeader>
        <LoginForm
          onSubmit={onFormSubmit}
          loading={loading}
          error={fetchError}
        />
        <Divider sx={{ mt: 3, mb: 2 }} />
        <ExternalLink
          href={C.sourceCode}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.875rem", textDecoration: "none" }}
        >
          <IconCode fontSize="small" /> Source code
        </ExternalLink>
      </Container>
    );
  }
}
