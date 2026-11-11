// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Route, Routes, Navigate, useLocation } from "react-router";
import { useCredentials } from "./credentials";
import LoadingIndicator from "./widgets/LoadingIndicator";
import SyncGate from "./SyncGate";
import { routeResolver } from "./App";
import SignupPage from "./SignupPage";
import LoginPage from "./LoginPage";
import WizardPage from "./WizardPage";
import { Snackbar } from "@mui/material";
import Alert from "@mui/material/Alert";
import { useSelector, useDispatch } from "react-redux";
import { StoreState } from "./store";
import { popMessage } from "./store/actions";


export default function MainRouter() {
  return (
    <>
      <Routes>
        <Route
          path={routeResolver.getRoute("signup")}
          element={<SignupPage />}
        />
        <Route
          path={routeResolver.getRoute("login")}
          element={<LoginPage />}
        />
        <Route
          path={routeResolver.getRoute("wizard")}
          element={<PrivateRoute><WizardPage /></PrivateRoute>}
        />
        <Route
          path="*"
          element={<PrivateRoute><SyncGate /></PrivateRoute>}
        />
      </Routes>
      <GlobalMessages />
    </>
  );
}

function GlobalMessages() {
  const dispatch = useDispatch();
  const message = useSelector((state: StoreState) => state.messages.first(undefined));

  function handleClose() {
    dispatch(popMessage());
  }

  return (
    <Snackbar
      key={message?.message}
      open={!!message}
      autoHideDuration={5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert onClose={handleClose} severity={message?.severity}>
        {message?.message}
      </Alert>
    </Snackbar>
  );
}

function PrivateRoute(props: { children: React.ReactElement }) {
  const credentials = useCredentials();
  const location = useLocation();

  if (credentials === undefined) {
    return (<LoadingIndicator style={{ display: "block", margin: "40px auto" }} />);
  }

  return (credentials) ? (
    props.children
  ) : (
    <Navigate
      to="/login"
      state={{ from: location }}
      replace
    />
  );
}
