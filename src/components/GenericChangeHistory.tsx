// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import moment from "moment";

import * as Etebase from "etebase";

import { List as VirtualizedList } from "react-virtualized";
import { AutoSizer } from "react-virtualized-auto-sizer";

import { List, ListItem } from "../widgets/List";
import IconEdit from "@mui/icons-material/Edit";
import IconDelete from "@mui/icons-material/Delete";
import IconError from "@mui/icons-material/Error";

import { TaskType, EventType, ContactType, parseString } from "../pim-types";
import { brand } from "../brand";

export interface CachedItem {
  item: Etebase.Item;
  metadata: Etebase.ItemMetadata;
  content: string;
}

interface PropsType {
  items: CachedItem[];
  onItemClick: (item: CachedItem) => void;

}

export default function GenericChangeHistory(props: PropsType) {
  const entriesList = props.items.sort((a_, b_) => {
    const a = a_.metadata.mtime ?? 0;
    const b = b_.metadata.mtime ?? 0;
    return a - b;
  });

  const onItemClick = props.onItemClick;

  const rowRenderer = (params: { index: number, key: string, style: React.CSSProperties }) => {
    const { key, index, style } = params;
    const cacheItem = entriesList[entriesList.length - index - 1]!;
    let comp;
    try {
      comp = parseString(cacheItem.content);
    } catch (e) {
      const icon = (<IconError style={{ color: "red" }} />);
      return (
        <ListItem
          key={key}
          style={style}
          leftIcon={icon}
          primaryText="Failed parsing item"
          secondaryText="Unknown"
          onClick={() => onItemClick(cacheItem)}
        />
      );
    }

    let icon;
    if (!cacheItem.item.isDeleted) {
      icon = (<IconEdit style={{ color: brand.success }} />);
    } else {
      icon = (<IconDelete style={{ color: brand.error }} />);
    }

    let name;
    if (comp.name === "vcalendar") {
      if (EventType.isEvent(comp)) {
        const vevent = EventType.fromVCalendar(comp);
        name = vevent.summary;
      } else {
        const vtodo = TaskType.fromVCalendar(comp);
        name = vtodo.summary;
      }
    } else if (comp.name === "vcard") {
      const vcard = new ContactType(comp);
      name = vcard.fn;
    } else {
      name = "Error processing entry";
    }

    const mtime = (cacheItem.metadata.mtime) ? moment(cacheItem.metadata.mtime) : undefined;

    return (
      <ListItem
        key={key}
        style={style}
        leftIcon={icon}
        primaryText={name}
        secondaryText={mtime && mtime.format("llll")}
        onClick={() => onItemClick(cacheItem)}
      />
    );
  };

  return (
    <List style={{ height: "100%" }}>
      {(entriesList.length > 0) ? (
        <AutoSizer
          renderProp={({ height, width }) => (width !== undefined) && (height !== undefined) && (
            <VirtualizedList
              width={width}
              height={height}
              rowCount={entriesList.length}
              rowHeight={56}
              rowRenderer={rowRenderer}
            />
          )}
        />
      ) : (
        <ListItem
          primaryText="No entries found"
        />
      )}
    </List>
  );
}
