// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only


import MuiMenu, { MenuProps } from "@mui/material/Menu";
import { PopoverOrigin } from "@mui/material/Popover";

const anchorOrigin: PopoverOrigin = {
  vertical: "bottom",
  horizontal: "right",
};

const transferOrigin: PopoverOrigin = {
  vertical: "top",
  horizontal: "right",
};

export default function Menu(props: MenuProps) {
  return (
    <MuiMenu
      anchorOrigin={anchorOrigin}
      transformOrigin={transferOrigin}
      {...props}
    />
  );
}