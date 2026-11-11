// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import { useTheme } from "@mui/material/styles";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";

import { ContactType } from "../pim-types";

import Sidebar from "./Sidebar";
import Toolbar from "./Toolbar";
import AddressBook from "./AddressBook";

// The spacing of MUI 4's Grid: padded items in a container with negative margins
const containerSx = { m: -2, width: "calc(100% + 32px)" };
const topBarSx = { p: 2, bgcolor: "primary.main" };

interface PropsType {
  entries: ContactType[];
  onItemClick: (contact: ContactType) => void;
  onNewGroupClick: () => void;
}

export default function SearchableAddressBook(props: PropsType) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterByGroup, setFilterByGroup] = React.useState<string>();
  const theme = useTheme();

  const groups = React.useMemo(
    (() => props.entries.filter((x) => x.group)),
    [props.entries]
  );
  const group = React.useMemo(
    (() => groups.find((x) => x.uid === filterByGroup)),
    [groups, filterByGroup]
  );

  function filterFunc(ent: ContactType) {
    return (
      (!group || (group.members.includes(ent.uid))) &&
      !!ent.fn?.match(reg)
    );
  }

  const reg = new RegExp(searchQuery, "i");

  return (
    <Grid container sx={containerSx}>
      <Grid size={3} sx={topBarSx}>
        {/* spacer */}
      </Grid>

      <Grid size={9} sx={topBarSx}>
        <Toolbar
          searchTerm={searchQuery}
          setSearchTerm={setSearchQuery}
        />
      </Grid>

      <Grid size={3} sx={{ p: 2 }} style={{ borderRight: `1px solid ${theme.palette.divider}` }}>
        <Sidebar
          groups={groups}
          filterByGroup={filterByGroup}
          setFilterByGroup={setFilterByGroup}
          newGroup={props.onNewGroupClick}
          editGroup={props.onItemClick}
        />
      </Grid>

      <Grid size="grow" sx={{ p: 2 }}>
        <Divider style={{ marginTop: "1em" }} />

        <AddressBook filter={filterFunc} {...props} />
      </Grid>
    </Grid>
  );
}
