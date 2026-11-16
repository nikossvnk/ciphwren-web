// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import * as ReactDOM from "react-dom";

// The title and buttons areas of the app bar, given by App once they are mounted (instead of being looked up
// in the DOM during render, which found nothing before the app bar was mounted)
export const AppBarSlotsContext = React.createContext<{ title: HTMLElement | null, buttons: HTMLElement | null }>({
  title: null,
  buttons: null,
});

export default (props: { title: string, children?: React.ReactNode | React.ReactNode[] }) => {
  const { title: titleEl, buttons: buttonsEl } = React.use(AppBarSlotsContext);

  return (
    <>
      {titleEl && ReactDOM.createPortal(
        <span>{props.title}</span>,
        titleEl
      )}
      {buttonsEl && props.children && ReactDOM.createPortal(
        props.children,
        buttonsEl
      )}
    </>
  );
};
