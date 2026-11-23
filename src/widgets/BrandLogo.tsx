// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { useTheme } from "@mui/material/styles";

import logoHorizontal from "../images/logo-horizontal.svg";
import logoInverse from "../images/logo-horizontal-inverse.svg";

// The horizontal Ciphwren logo, on navy in the dark theme
export default function BrandLogo() {
  const theme = useTheme();
  return (
    <img
      alt="Ciphwren"
      src={theme.palette.mode === "dark" ? logoInverse : logoHorizontal}
      style={{ width: 200, display: "block", margin: "24px 0 16px" }}
    />
  );
}
