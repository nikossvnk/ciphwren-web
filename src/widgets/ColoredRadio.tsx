// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import Radio from "@mui/material/Radio";
import FormControlLabel, { FormControlLabelProps } from "@mui/material/FormControlLabel";

interface Props {
  color: string;
  label: string;
}

export default function ColoredRadio(props: Props & Omit<FormControlLabelProps, keyof Props | "control">) {
  const { color, label, value, ...other } = props;

  return <FormControlLabel
    sx={{ color }}
    label={label}
    control={<Radio color="default" sx={{ color }} value={value} />}
    {...other}
  />;
}
