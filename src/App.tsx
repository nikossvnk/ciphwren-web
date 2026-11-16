// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { useSelector } from "react-redux";
import { BrowserRouter } from "react-router";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { amber, grey, lightBlue } from "@mui/material/colors";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";

import NavigationMenu from "@mui/icons-material/Menu";
import NavigationRefresh from "@mui/icons-material/Refresh";
import ErrorsIcon from "@mui/icons-material/Error";

import "react-virtualized/styles.css"; // only needs to be imported once

import "./App.css";

import ConfirmationDialog from "./widgets/ConfirmationDialog";
import { List, ListItem } from "./widgets/List";
import withSpin from "./widgets/withSpin";
import ErrorBoundary from "./components/ErrorBoundary";
import SideMenu from "./SideMenu";
import { RouteResolver } from "./routes";

import * as store from "./store";
import * as actions from "./store/actions";

import { useCredentials } from "./credentials";
import { SyncManager } from "./sync/SyncManager";
import MainRouter from "./MainRouter";
import { AppBarSlotsContext } from "./widgets/AppBarOverride";

export const routeResolver = new RouteResolver({
  home: "",
  pim: {
    contacts: {
      _id: {
        _base: ":itemUid",
        edit: {
          contact: "contact",
          group: "group",
        },
        log: "log",
      },
      new: {
        contact: "contact",
        group: "group",
      },
    },
    events: {
      _id: {
        _base: ":itemUid",
        edit: "edit",
        duplicate: "duplicate",
        log: "log",
      },
      new: "new",
    },
    tasks: {
      _id: {
        _base: ":itemUid",
        edit: "edit",
        log: "log",
      },
      new: "new",
    },
  },
  collections: {
    _id: {
      _base: ":colUid",
      edit: "edit",
      items: {
        _id: {
          _base: ":itemUid",
        },
      },
      entries: {
        _id: {
          _base: ":entryUid",
        },
      },
      members: {
      },
    },
    invitations: {
      incoming: {
      },
      outgoing: {
      },
    },
    new: "new",
    import: "import",
  },
  login: {
  },
  signup: {
  },
  wizard: {
  },
  settings: {
  },
  debug: {
  },
});

interface AppBarPropsType {
  toggleDrawerIcon: any;
  iconElementRight: any;
  titleRef: (el: HTMLDivElement | null) => void;
  buttonsRef: (el: HTMLDivElement | null) => void;
}

function AppBarWitHistory(props: AppBarPropsType) {
  const {
    toggleDrawerIcon,
    iconElementRight,
    titleRef,
    buttonsRef,
    ...rest
  } = props;
  return (
    <AppBar
      position="static"
      {...rest}
    >
      <Toolbar>
        <div style={{ marginLeft: -12, marginRight: 20 }}>
          {toggleDrawerIcon}
        </div>

        <div style={{ flexGrow: 1, fontSize: "1.25em" }} id="appbar-title" ref={titleRef} />

        <div style={{ marginRight: -12 }} id="appbar-buttons" ref={buttonsRef}>
          {iconElementRight}
        </div>
      </Toolbar>
    </AppBar>
  );
}

const IconRefreshWithSpin = withSpin(NavigationRefresh);

const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

// Module-level, so that useSyncExternalStore gets the same functions on every render
function subscribeToDarkModePreference(onChange: () => void) {
  const query = window.matchMedia?.(DARK_MODE_QUERY);
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

function getDarkModePreference() {
  return Boolean(window.matchMedia?.(DARK_MODE_QUERY).matches);
}

export default function App() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [errorsDialog, setErrorsDialog] = React.useState(false);
  const [appBarTitle, setAppBarTitle] = React.useState<HTMLElement | null>(null);
  const [appBarButtons, setAppBarButtons] = React.useState<HTMLElement | null>(null);
  const appBarSlots = React.useMemo(() => ({ title: appBarTitle, buttons: appBarButtons }), [appBarTitle, appBarButtons]);
  const dispatch = store.useAppDispatch();
  const etebase = useCredentials();
  const darkModeUserSelection = useSelector((state: store.StoreState) => state.settings.darkModeUserSelection);
  const fetchCount = useSelector((state: store.StoreState) => state.fetchCount);
  const errors = useSelector((state: store.StoreState) => state.errors);

  function shouldBeDark(userSelection: string, browserPreference: boolean): boolean {
    if (userSelection === "auto") {
      return browserPreference;
    } else if (userSelection === "dark") {
      return true;
    }
    return false;
  }

  // The browser's dark mode preference, read and followed without an effect setting state
  const darkModeBrowserPreference = React.useSyncExternalStore(subscribeToDarkModePreference, getDarkModePreference);
  const darkMode = shouldBeDark(darkModeUserSelection, darkModeBrowserPreference);

  async function refresh() {
    const syncManager = SyncManager.getManager(etebase!);
    const sync = syncManager.sync();
    dispatch(actions.performSync(sync));
    await sync;
  }

  // Sync every 5 minutes. It depends on etebase: an interval set up once kept the first render's
  // (logged out) account, so it never synced after logging in.
  React.useEffect(() => {
    if (!etebase) {
      return undefined;
    }
    const interval = 5 * 60 * 1000;
    const id = setInterval(() => {
      if (navigator.onLine) {
        const sync = SyncManager.getManager(etebase).sync();
        dispatch(actions.performSync(sync));
      }
    }, interval);
    return () => clearInterval(id);
  }, [etebase, dispatch]);

  function toggleDrawer() {
    setDrawerOpen(!drawerOpen);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  const credentials = etebase ?? null;

  const fetching = fetchCount > 0;

  const muiTheme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: amber,
      secondary: {
        light: lightBlue.A200,
        main: lightBlue.A400,
        dark: lightBlue.A700,
        contrastText: "#fff",
      },
      // The background colors of MUI 4
      background: darkMode ? { default: "#303030", paper: grey[800] } : { default: grey[50] },
    },
    // Keeps the look of MUI 4 where newer versions changed the defaults
    components: {
      MuiAppBar: {
        defaultProps: { enableColorOnDark: true },
        // Also when static, so that its shadow is over what comes below it
        styleOverrides: { root: ({ theme }) => ({ zIndex: theme.zIndex.appBar }) },
      },
      // No lighter surfaces with elevation in the dark theme
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiListItemIcon: { styleOverrides: { root: { minWidth: 56 } } },
      // Grey instead of the primary color for selected items
      MuiListItemButton: { styleOverrides: { root: ({ theme }) => ({ "&.Mui-selected, &.Mui-selected:hover": { backgroundColor: theme.palette.action.selected } }) } },
      MuiMenuItem: { styleOverrides: { root: ({ theme }) => ({ "&.Mui-selected, &.Mui-selected:hover": { backgroundColor: theme.palette.action.selected } }) } },
      // Grey buttons when no color is set, also in the dark theme
      MuiButton: {
        defaultProps: { color: "inherit" },
        styleOverrides: {
          root: {
            variants: [{
              props: { variant: "contained", color: "inherit" },
              style: { color: "rgba(0, 0, 0, 0.87)", backgroundColor: grey[300], "&:hover": { backgroundColor: grey.A100 } },
            }],
          },
        },
      },
      MuiIconButton: { defaultProps: { size: "large" } },
      MuiCheckbox: { defaultProps: { color: "secondary" } },
      MuiRadio: { defaultProps: { color: "secondary" } },
      MuiSwitch: { defaultProps: { color: "secondary" } },
      MuiTextField: { defaultProps: { variant: "standard" } },
      MuiFormControl: { defaultProps: { variant: "standard" } },
      MuiSelect: { defaultProps: { variant: "standard" } },
    },
  });

  const styles: { [key: string]: React.CSSProperties } = {
    main: {
      backgroundColor: muiTheme.palette.background.default,
      color: muiTheme.palette.text.primary,
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
    },
  };

  return (
    <ThemeProvider theme={muiTheme}>
      {/* Without the trailing slash of BASE_URL, so that the base path without a trailing slash also matches */}
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div style={styles.main} className={darkMode ? "theme-dark" : "theme-light"}>
          <AppBarWitHistory
            titleRef={setAppBarTitle}
            buttonsRef={setAppBarButtons}
            toggleDrawerIcon={<IconButton onClick={toggleDrawer}><NavigationMenu /></IconButton>}
            iconElementRight={
              <>
                {(errors.size > 0) && (
                  <IconButton onClick={() => setErrorsDialog(true)} title="Errors">
                    <Badge badgeContent={errors.size} color="error">
                      <ErrorsIcon />
                    </Badge>
                  </IconButton>
                )}
                <IconButton disabled={!credentials || fetching} onClick={refresh} title="Refresh">
                  <IconRefreshWithSpin spin={fetching} />
                </IconButton>
              </>
            }
          />
          <ConfirmationDialog
            title="Sync Errors"
            open={errorsDialog}
            labelOk="OK"
            onCancel={() => setErrorsDialog(false)}
            onOk={() => setErrorsDialog(false)}
          >
            <h4>
              Please contact developers if any of the errors below persist.
            </h4>
            <List>
              {errors.map((error, index) => (
                <ListItem
                  // eslint-disable-next-line @eslint-react/no-array-index-key -- errors are only appended or all cleared
                  key={index}
                  style={{ height: "unset" }}
                  onClick={() => (window as any).navigator.clipboard.writeText(`${error.message}\n\n${error.stack}`)}
                >
                  {error.message}
                </ListItem>
              ))}
            </List>
          </ConfirmationDialog>

          <Drawer
            open={drawerOpen}
            onClose={toggleDrawer}
          >
            <SideMenu onCloseDrawerRequest={closeDrawer} />
          </Drawer>

          <AppBarSlotsContext value={appBarSlots}>
            <ErrorBoundary>
              <MainRouter />
            </ErrorBoundary>
          </AppBarSlotsContext>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
