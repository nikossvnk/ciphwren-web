// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import moment from "moment";
import ICAL from "ical.js";

import { List, ListItem, ListDivider as Divider } from "../widgets/List";
import IconHome from "@mui/icons-material/Home";
import IconDate from "@mui/icons-material/DateRange";
import CommunicationCall from "@mui/icons-material/Call";
import CommunicationChatBubble from "@mui/icons-material/ChatBubble";
import CommunicationEmail from "@mui/icons-material/Email";
import CopyIcon from "../icons/Copy";

import PimItemHeader from "../components/PimItemHeader";

import { ContactType } from "../pim-types";
import { IconButton, Avatar } from "@mui/material";

class Contact extends React.PureComponent {
  public props: {
    item?: ContactType;
  };

  public render() {
    if (this.props.item === undefined) {
      throw Error("Contact should be defined!");
    }

    const contact = this.props.item;
    const name = contact.fn;

    const revProp = contact.comp.getFirstProperty("rev");
    const lastModified = (revProp) ?
      "Modified: " + moment((revProp.getFirstValue() as ICAL.Time).toJSDate()).format("LLLL") : undefined;

    const lists: Array<{ name: string, items: React.JSX.Element[] }> = [];

    function getAllType(
      propName: string,
      props_: any,
      valueToHref?: (value: string, type: string) => string,
      primaryTransform?: (value: string, type: string) => string,
      secondaryTransform?: (value: string, type: string) => string) {

      // The rows are read-only and in the vCard's order, which is all that tells two equal values apart: the
      // position is their identity. (Every value of a property had the property's index as its key.)
      const items = contact.comp.getAllProperties(propName).flatMap((prop, idx) => {
        const type = prop.toJSON()[1].type;
        const values = prop.getValues().map((val, valIdx) => {
          const primaryText = primaryTransform ? primaryTransform(val, type) : val;
          const clipboardButton = (
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                (window as any).navigator.clipboard.writeText(primaryText);
              }}
            >
              <CopyIcon />
            </IconButton>
          );

          const { ref, ...props } = props_;

          return (
            <ListItem
              // eslint-disable-next-line @eslint-react/no-array-index-key
              key={`${propName}-${idx}-${valIdx}`}
              href={valueToHref ? valueToHref(val, type) : undefined}
              primaryText={primaryText}
              rightIcon={clipboardButton}
              secondaryText={secondaryTransform ? secondaryTransform(val, type) : type}
              {...props}
            />
          );
        });
        return values;
      });
      return { name: propName, items };
    }

    lists.push(getAllType(
      "tel",
      {
        leftIcon: <CommunicationCall />,
      },
      (x) => ("tel:" + x)
    ));

    lists.push(getAllType(
      "email",
      {
        leftIcon: <CommunicationEmail />,
      },
      (x) => ("mailto:" + x)
    ));

    lists.push(getAllType(
      "impp",
      {
        leftIcon: <CommunicationChatBubble />,
      },
      (x) => x,
      (x) => (x.substring(x.indexOf(":") + 1)),
      (x) => (x.substring(0, x.indexOf(":")))
    ));

    lists.push(getAllType(
      "adr",
      {
        leftIcon: <IconHome />,
      }
    ));

    lists.push(getAllType(
      "bday",
      {
        leftIcon: <IconDate />,
      },
      undefined,
      ((x: any) => moment(x.toJSDate()).format("dddd, LL")),
      () => "Birthday"
    ));

    lists.push(getAllType(
      "anniversary",
      {
        leftIcon: <IconDate />,
      },
      undefined,
      ((x: any) => moment(x.toJSDate()).format("dddd, LL")),
      () => "Anniversary"
    ));

    const skips = ["tel", "email", "impp", "adr", "bday", "anniversary", "rev", "prodid", "uid", "fn", "n", "version", "photo", "note"];
    const theRest = contact.comp.getAllProperties().filter((prop) => (
      skips.indexOf(prop.name) === -1
    )).flatMap((prop, idx) => {
      const values = prop.getValues().map((_val, valIdx) => {
        const val = (_val instanceof String) ? _val : _val.toString();
        return (
          <ListItem
            // eslint-disable-next-line @eslint-react/no-array-index-key -- read-only, in the vCard's order
            key={`${prop.name}-${idx}-${valIdx}`}
            insetChildren
            primaryText={val}
            secondaryText={prop.name}
          />
        );
      });
      return values;
    });

    {
      const note = contact.comp.getFirstPropertyValue("note");
      const item = (
        <ListItem
          key="note"
          insetChildren
          secondaryText="note"
        >
          <pre style={{ wordWrap: "break-word", whiteSpace: "pre-wrap", overflowX: "auto" }}>{note?.toString()}</pre>
        </ListItem>
      );
      theRest.push(item);
    }

    function listIfNotEmpty(items: React.JSX.Element[]) {
      if (items.length > 0) {
        return (
          <React.Fragment>
            <List>
              {items}
            </List>
            <List>
              <Divider inset />
            </List>
          </React.Fragment>
        );
      } else {
        return undefined;
      }
    }

    const contactImageSrc = contact.comp.getFirstProperty("photo")?.getFirstValue() as string | undefined;

    return (
      <div>
        <PimItemHeader text={name} rightItem={contactImageSrc && (<Avatar style={{ width: "3em", height: "3em" }} src={contactImageSrc} />)}>
          {lastModified && (
            <span style={{ fontSize: "90%" }}>{lastModified}</span>
          )}
        </PimItemHeader>
        {lists.map((list) => (
          <React.Fragment key={list.name}>
            {listIfNotEmpty(list.items)}
          </React.Fragment>
        ))}
        <List>
          {theRest}
        </List>
      </div>
    );
  }
}

export default Contact;
