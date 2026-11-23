// SPDX-FileCopyrightText: © 2020 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { Tabs, Tab } from "@mui/material";
import { useNavigate } from "react-router";
import { routeResolver } from "../App";
import { brand } from "../brand";

export type TabValue = "contacts" | "events" | "tasks";

interface PropsType {
  value: TabValue;
}

export default function PimNavigationTabs(props: PropsType) {
  const navigate = useNavigate();

  const tabs = [
    { title: "Address Book", linkValue: "contacts" },
    { title: "Calendar", linkValue: "events" },
    { title: "Tasks", linkValue: "tasks" },
  ];

  let selected;
  switch (props.value) {
    case "contacts": {
      selected = 0;
      break;
    }
    case "events": {
      selected = 1;
      break;
    }
    case "tasks": {
      selected = 2;
      break;
    }
  }

  return (
    <Tabs
      variant="fullWidth"
      indicatorColor="secondary"
      textColor="inherit"
      // Continues the navy app bar; cyan indicator for the current tab
      style={{ backgroundColor: brand.navy, color: "#fff" }}
      value={selected}
    >
      {tabs.map((x) => (
        <Tab
          key={x.linkValue}
          label={x.title}
          // Not Tabs' onChange: since MUI 5 it doesn't fire for the selected tab, and clicking that
          // one has to go back to its list (e.g. from an event to the calendar)
          onClick={() => navigate(routeResolver.getRoute(`pim.${x.linkValue}`))}
        />
      ))}
    </Tabs>
  );
}
