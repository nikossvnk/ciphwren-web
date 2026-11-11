// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import Color from "color";

import { useTheme } from "@mui/material/styles";

export default function PimItemHeader(props: { text: string, backgroundColor?: string, children?: any, rightItem?: React.ReactNode }) {
  const theme = useTheme();
  const backgroundColor = props.backgroundColor ?? theme.palette.secondary.main;
  const foregroundColor = theme.palette.getContrastText(Color(backgroundColor).rgb().string());
  const style = {
    header: {
      backgroundColor,
      color: foregroundColor,
      padding: 15,
      display: "flex",
      justifyContent: "space-between",
    },
    headerText: {
      marginTop: 10,
      marginBottom: 10,
    },
  };

  return (
    <div style={style.header}>
      <div>
        <h2 style={style.headerText}>{props.text}</h2>
        {props.children}
      </div>
      {props.rightItem}
    </div>
  );
}
