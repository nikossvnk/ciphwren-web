// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { List, ListItem, ListSubheader, ListDivider } from "../widgets/List";
import ActionCode from "@mui/icons-material/Code";
import ActionHome from "@mui/icons-material/Home";
import ActionSettings from "@mui/icons-material/Settings";
import ActionJournals from "@mui/icons-material/LibraryBooks";
import ActionBugReport from "@mui/icons-material/BugReport";
import ActionQuestionAnswer from "@mui/icons-material/QuestionAnswer";
import LogoutIcon from "@mui/icons-material/PowerSettingsNew";
import IconImport from "@mui/icons-material/ImportExport";
import IconInvitation from "@mui/icons-material/MailOutlined";

import logo from "../images/logo.svg";

import { routeResolver } from "../App";

import { store } from "../store";
import { logout } from "../store/actions";

import * as C from "../constants";
import { useTheme } from "@mui/material";
import { useCredentials } from "../credentials";
import { useNavigate } from "react-router";

interface PropsType {
  onCloseDrawerRequest: () => void;
}

export default function SideMenu(props: PropsType) {
  const theme = useTheme();
  const etebase = useCredentials();
  const username = etebase?.user.username ?? C.appName;
  const navigate = useNavigate();

  function logoutDo() {
    store.dispatch(logout(etebase!));
    props.onCloseDrawerRequest();
  }

  let loggedInItems;
  if (etebase) {
    loggedInItems = (
      <React.Fragment>
        <ListItem
          primaryText="Collections"
          leftIcon={<ActionJournals />}
          onClick={() => {
            props.onCloseDrawerRequest();
            navigate(routeResolver.getRoute("collections"));
          }}
        />
        <ListItem
          primaryText="Invitations"
          leftIcon={<IconInvitation />}
          onClick={() => {
            props.onCloseDrawerRequest();
            navigate(routeResolver.getRoute("collections.invitations"));
          }}
        />
        <ListItem
          primaryText="Import"
          leftIcon={<IconImport />}
          onClick={() => {
            props.onCloseDrawerRequest();
            navigate(routeResolver.getRoute("collections.import"));
          }}
        />
        <ListItem
          primaryText="Settings"
          leftIcon={<ActionSettings />}
          onClick={() => {
            props.onCloseDrawerRequest();
            navigate(routeResolver.getRoute("settings"));
          }}
        />
        <ListItem primaryText="Log Out" leftIcon={<LogoutIcon />} onClick={logoutDo} />
      </React.Fragment>
    );
  }

  return (
    <div style={{ overflowX: "hidden", width: 250 }}>
      <div className="App-drawer-header">
        <img alt="App logo" className="App-drawer-logo" src={logo} />
        <div style={{ color: theme.palette.secondary.contrastText }}>
          {username}
        </div>
      </div>
      <List>
        <ListItem
          primaryText="Main"
          leftIcon={<ActionHome />}
          onClick={() => {
            props.onCloseDrawerRequest();
            navigate(routeResolver.getRoute("home"));
          }}
        />
        {loggedInItems}
        <ListDivider />
        <ListSubheader>External Links</ListSubheader>
        <ListItem primaryText="Website" leftIcon={<ActionHome />} href={C.homePage} />
        <ListItem primaryText="FAQ" leftIcon={<ActionQuestionAnswer />} href={C.faq} />
        <ListItem primaryText="Source Code" leftIcon={<ActionCode />} href={C.sourceCode} />
        <ListItem primaryText="Report Issue" leftIcon={<ActionBugReport />} href={C.reportIssue} />
      </List>
    </div>
  );
}
