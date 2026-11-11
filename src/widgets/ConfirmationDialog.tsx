// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

export default React.memo((_props: any) => {
  const {
    title,
    children,
    onCancel,
    onOk,
    labelOk,
    ...props
  } = _props;

  return (
    <Dialog
      onClose={onCancel}
      {...props}
    >
      <DialogTitle>
        {title}
      </DialogTitle>
      <DialogContent>
        {children}
      </DialogContent>
      <DialogActions>
        <Button
          color="primary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          onClick={onOk}
        >
          {labelOk || "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
