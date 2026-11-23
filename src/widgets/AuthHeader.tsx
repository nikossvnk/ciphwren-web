// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

import logo from "../images/logo.svg";
import logoDark from "../images/logo-dark.svg";

// The top of the login and signup cards: the Ciphwren mark, a title and a line under it
export default function AuthHeader(props: { title: string, children?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Box sx={{ textAlign: "center", pt: 2, pb: 1 }}>
      <img
        alt="Ciphwren"
        src={theme.palette.mode === "dark" ? logoDark : logo}
        width={72}
        height={72}
        style={{ display: "block", margin: "0 auto 12px" }}
      />
      <Typography component="h1" sx={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
        {props.title}
      </Typography>
      {props.children && (
        <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: "0.95rem" }}>
          {props.children}
        </Typography>
      )}
    </Box>
  );
}
