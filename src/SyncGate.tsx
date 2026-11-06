// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Route, Routes, Navigate, Outlet, useLocation } from "react-router";

import moment from "moment";
// From the ES module build of moment, which is the one that the app gets (the locale in moment/locale/
// would be added to the CommonJS build instead)
import "moment/dist/locale/en-gb";

import { routeResolver } from "./App";

import AppBarOverride from "./widgets/AppBarOverride";
import LoadingIndicator from "./widgets/LoadingIndicator";
import Container from "./widgets/Container";
import ContactsMain from "./Contacts/Main";
import CalendarsMain from "./Calendars/Main";
import TasksMain from "./Tasks/Main";
import CollectionsMain from "./Collections/Main";

import Settings from "./Settings";
import Debug from "./Debug";

import { SyncManager } from "./sync/SyncManager";

import { StoreState } from "./store";
import { performSync } from "./store/actions";
import { useCredentials } from "./credentials";
import PimNavigationTabs from "./Pim/NavigationTabs";
import PageNotFound from "./PageNotFound";

export default function SyncGate() {
  const etebase = useCredentials();
  const settings = useSelector((state: StoreState) => state.settings);
  const dispatch = useDispatch();
  const [loading, setLoading] = React.useState(true);

  // Doing this so we refresh on route changes
  useLocation();

  React.useEffect(() => {
    (async () => {
      const syncManager = SyncManager.getManager(etebase!);
      const sync = syncManager.sync();
      dispatch(performSync(sync));
      await sync;
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (<LoadingIndicator style={{ display: "block", margin: "40px auto" }} />);
  }

  // FIXME: Shouldn't be here
  moment.locale(settings.locale);

  return (
    <Routes>
      <Route
        path={routeResolver.getRoute("home")}
        element={<Navigate to={routeResolver.getRoute("pim")} replace />}
      />
      <Route
        path={routeResolver.getRoute("pim")}
        element={<><AppBarOverride title="EteSync" /><Outlet /></>}
      >
        <Route
          index
          element={<Navigate to={routeResolver.getRoute("pim.events")} replace />}
        />
        <Route
          path={routeResolver.getRoute("pim.contacts") + "/*"}
          element={
            <>
              <PimNavigationTabs value="contacts" />
              <Container>
                <ContactsMain />
              </Container>
            </>
          }
        />
        <Route
          path={routeResolver.getRoute("pim.events") + "/*"}
          element={
            <>
              <PimNavigationTabs value="events" />
              <Container>
                <CalendarsMain />
              </Container>
            </>
          }
        />
        <Route
          path={routeResolver.getRoute("pim.tasks") + "/*"}
          element={
            <>
              <PimNavigationTabs value="tasks" />
              <Container>
                <TasksMain />
              </Container>
            </>
          }
        />
        <Route
          path="*"
          element={<Container><PageNotFound /></Container>}
        />
      </Route>
      <Route
        path={routeResolver.getRoute("collections") + "/*"}
        element={<CollectionsMain />}
      />
      <Route
        path={routeResolver.getRoute("settings")}
        element={<Settings />}
      />
      <Route
        path={routeResolver.getRoute("debug")}
        element={<Debug />}
      />
      <Route
        path="*"
        element={<Container><PageNotFound /></Container>}
      />
    </Routes>
  );
}
