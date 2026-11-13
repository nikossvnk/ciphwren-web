// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import Input, { InputProps } from "@mui/material/Input";
import InputLabel from "@mui/material/InputLabel";
import InputAdornment from "@mui/material/InputAdornment";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

let formIdCounter = 0;

export default function PasswordField(props_: Omit<InputProps, "type"> & { helperText?: string, label?: string }) {
  const [showPassword, setShowPassword] = React.useState(false);
  const formId_ = React.useMemo(() => formIdCounter++, []);
  const { helperText, label, style, id, ...props } = props_;
  const formId = `password-field-${id ?? formId_}`;

  return (
    <FormControl style={style}>
      <InputLabel htmlFor={formId}>{label}</InputLabel>
      <Input
        {...props}
        id={formId}
        type={showPassword ? "text" : "password"}
        endAdornment={(
          <InputAdornment position="end">
            <IconButton
              aria-label="Toggle password visibility"
              title="Toggle password visibility"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        )}
      />
      <FormHelperText id={formId}>{helperText}</FormHelperText>
    </FormControl>
  );
}
