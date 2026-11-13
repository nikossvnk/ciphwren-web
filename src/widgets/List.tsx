// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import MuiList from "@mui/material/List";
import MuiListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import MuiListSubheader from "@mui/material/ListSubheader";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";

import ExternalLink from "./ExternalLink";

const insetStyle = { marginLeft: 64 };
const nestedSx = { pl: 4 };

export const List = MuiList;

export const ListSubheader = MuiListSubheader;

export const ListDivider = React.memo(function ListDivider(props: { inset?: boolean }) {
  return (
    <Divider style={props.inset ? insetStyle : undefined} />
  );
});

interface ListItemPropsType {
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  style?: React.CSSProperties;
  primaryText?: string;
  secondaryText?: string;
  children?: React.ReactNode | React.ReactNode[];
  onClick?: () => void;
  href?: string;
  insetChildren?: boolean;
  nestedItems?: React.ReactNode[];
  selected?: boolean;
  secondaryTextColor?: "initial" | "inherit" | "primary" | "secondary" | "textPrimary" | "textSecondary" | "error";
  secondaryAction?: React.ReactNode;
}

export const ListItem = React.memo(function ListItem(_props: ListItemPropsType) {
  const {
    leftIcon,
    rightIcon,
    primaryText,
    secondaryText,
    children,
    onClick,
    href,
    style,
    insetChildren,
    nestedItems,
    selected,
    secondaryTextColor,
    secondaryAction,
  } = _props;

  const content = (
    <>
      {leftIcon && (
        <ListItemIcon>
          {leftIcon}
        </ListItemIcon>
      )}
      <ListItemText inset={insetChildren} primary={primaryText} secondary={secondaryText} slotProps={{ secondary: { color: secondaryTextColor } }}>
        {children}
      </ListItemText>
      {rightIcon && (
        <ListItemIcon>
          {rightIcon}
        </ListItemIcon>
      )}
    </>
  );

  let item;
  if (onClick || href) {
    const button = (
      <ListItemButton
        style={secondaryAction ? undefined : style}
        onClick={onClick}
        selected={selected}
        {...(href ? { component: ExternalLink, href } : { component: "div" })}
      >
        {content}
      </ListItemButton>
    );
    item = secondaryAction ? (
      <MuiListItem style={style} secondaryAction={secondaryAction} disablePadding>
        {button}
      </MuiListItem>
    ) : button;
  } else {
    item = (
      <MuiListItem style={style} secondaryAction={secondaryAction}>
        {content}
      </MuiListItem>
    );
  }

  return (
    <>
      {item}
      {nestedItems && (
        <List sx={nestedSx} disablePadding>
          {nestedItems}
        </List>
      )}
    </>
  );
});
