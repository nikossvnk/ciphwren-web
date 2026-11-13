// SPDX-FileCopyrightText: © 2020 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router";

import * as Etebase from "etebase";

import { Button, useTheme } from "@mui/material";
import IconEdit from "@mui/icons-material/Edit";
import IconDuplicate from "@mui/icons-material/FileCopy";
import IconChangeHistory from "@mui/icons-material/ChangeHistory";

import { EventType, PimType } from "../pim-types";
import { useCredentials } from "../credentials";
import { useItems, useCollections } from "../etebase-helpers";
import { routeResolver } from "../App";
import { RouteParams } from "../routes";
import Calendar from "./Calendar";
import Event from "./Event";
import LoadingIndicator from "../widgets/LoadingIndicator";
import EventEdit from "./EventEdit";
import PageNotFound from "../PageNotFound";

import { CachedCollection, getItemNavigationUid, getDecryptCollectionsFunction, getDecryptItemsFunction, PimFab, itemDelete, itemSave, defaultColor } from "../Pim/helpers";
import { historyPersistor } from "../persist-state-history";
import ItemChangeHistory from "../Pim/ItemChangeHistory";

const PersistCalendar = historyPersistor("Calendar")(Calendar);

const colType = "etebase.vevent";

const decryptCollections = getDecryptCollectionsFunction(colType);
const decryptItems = getDecryptItemsFunction(colType, EventType.parse);

export default function CalendarsMain() {
  const [entries, setEntries] = React.useState<Map<string, Map<string, EventType>>>();
  const [cachedCollections, setCachedCollections] = React.useState<CachedCollection[]>();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const etebase = useCredentials()!;
  const collections = useCollections(etebase, colType);
  const items = useItems(etebase, colType);

  React.useEffect(() => {
    if (!collections || !items) {
      return;
    }
    (async () => {
      const colEntries = await decryptCollections(collections);

      const entries = await decryptItems(items);

      for (const collection of colEntries) {
        const items = entries.get(collection.collection.uid)!;
        for (const item of items.values()) {
          item.color = collection.metadata.color || defaultColor;
        }
      }

      setCachedCollections(colEntries);
      setEntries(entries);
    })();
  }, [items, collections]);

  if (!entries || !cachedCollections) {
    return (
      <LoadingIndicator />
    );
  }

  async function onItemSave(item: PimType, collectionUid: string, originalItem?: PimType): Promise<void> {
    const collection = collections!.find((x) => x.uid === collectionUid)!;
    await itemSave(etebase, collection, items!, item, collectionUid, originalItem);
  }

  async function onItemDelete(item: PimType, collectionUid: string) {
    const collection = collections!.find((x) => x.uid === collectionUid)!;
    await itemDelete(etebase, collection, items!, item, collectionUid);

    navigate(routeResolver.getRoute("pim.events"));
  }

  function goBack() {
    navigate(-1);
  }

  const flatEntries = [];
  for (const col of entries.values()) {
    for (const item of col.values()) {
      flatEntries.push(item);
    }
  }

  const styles = {
    button: {
      marginLeft: theme.spacing(1),
    },
    leftIcon: {
      marginRight: theme.spacing(1),
    },
  };

  return (
    <Routes>
      <Route
        index
        element={
          <>
            <PersistCalendar
              entries={flatEntries}
              onItemClick={(item: EventType) => navigate(
                routeResolver.getRoute("pim.events._id", { itemUid: getItemNavigationUid(item) })
              )}
              onSlotClick={(start?: Date, end?: Date) => navigate(
                routeResolver.getRoute("pim.events.new"),
                { state: { start, end } }
              )}
            />
            <PimFab
              onClick={() => navigate(
                routeResolver.getRoute("pim.events.new")
              )}
            />
          </>
        }
      />
      <Route
        path={routeResolver.getRelativeRoute("pim.events.new", "pim.events")}
        element={
          <EventEdit
            collections={cachedCollections}
            onSave={onItemSave}
            onDelete={onItemDelete}
            onCancel={goBack}
            goBack={goBack}
            locationState={location.state}
          />
        }
      />
      <Route
        path={routeResolver.getRelativeRoute("pim.events._id.log", "pim.events") + "/*"}
        element={
          <RouteParams>
            {(params) => {
              // We have this path outside because we don't want the item existing check
              const [colUid, itemUid] = params.itemUid!.split("|");
              const cachedCollection = cachedCollections!.find((x) => x.collection.uid === colUid)!;
              if (!cachedCollection) {
                return (<PageNotFound />);
              }

              return (
                <ItemChangeHistory collection={cachedCollection} itemUid={itemUid} />
              );
            }}
          </RouteParams>
        }
      />
      <Route
        path={routeResolver.getRelativeRoute("pim.events._id", "pim.events") + "/*"}
        element={
          <RouteParams>
            {(params) => {
              const [colUid, itemUid] = params.itemUid!.split("|");
              const item = entries.get(colUid)?.get(itemUid);
              if (!item) {
                return (<PageNotFound />);
              }

              const collection = collections!.find((x) => x.uid === colUid)!;
              const readOnly = collection.accessLevel === Etebase.CollectionAccessLevel.ReadOnly;

              return (
                <Routes>
                  <Route
                    path={routeResolver.getRelativeRoute("pim.events._id.edit", "pim.events._id")}
                    element={
                      <EventEdit
                        key={itemUid}
                        initialCollection={item.collectionUid}
                        item={item}
                        collections={cachedCollections}
                        onSave={onItemSave}
                        onDelete={onItemDelete}
                        onCancel={goBack}
                        goBack={goBack}
                        locationState={location.state}
                      />
                    }
                  />
                  <Route
                    path={routeResolver.getRelativeRoute("pim.events._id.duplicate", "pim.events._id")}
                    element={
                      <EventEdit
                        key={itemUid}
                        initialCollection={item.collectionUid}
                        item={item}
                        collections={cachedCollections}
                        onSave={onItemSave}
                        onDelete={onItemDelete}
                        onCancel={goBack}
                        goBack={goBack}
                        locationState={location.state}
                        duplicate
                      />
                    }
                  />
                  <Route
                    index
                    element={
                      <>
                        <div style={{ textAlign: "right", marginBottom: 15 }}>
                          <Button
                            variant="contained"
                            style={styles.button}
                            onClick={() =>
                              navigate(routeResolver.getRoute("pim.events._id.log", { itemUid: getItemNavigationUid(item) }))
                            }
                          >
                            <IconChangeHistory style={styles.leftIcon} />
                            Change History
                          </Button>

                          <Button
                            color="secondary"
                            variant="contained"
                            disabled={readOnly}
                            style={{ ...styles.button, marginLeft: 15 }}
                            onClick={() =>
                              navigate(routeResolver.getRoute("pim.events._id.edit", { itemUid: getItemNavigationUid(item) }))
                            }
                          >
                            <IconEdit style={styles.leftIcon} />
                            Edit
                          </Button>

                          <Button
                            color="secondary"
                            variant="contained"
                            disabled={readOnly}
                            style={{ ...styles.button, marginLeft: 15 }}
                            onClick={() =>
                              navigate(routeResolver.getRoute("pim.events._id.duplicate", { itemUid: getItemNavigationUid(item) }))
                            }
                          >
                            <IconDuplicate style={styles.leftIcon} />
                            Duplicate
                          </Button>

                        </div>
                        <Event item={item} />
                      </>
                    }
                  />
                  <Route
                    path="*"
                    element={<PageNotFound />}
                  />
                </Routes>
              );
            }}
          </RouteParams>
        }
      />
      <Route
        path="*"
        element={<PageNotFound />}
      />
    </Routes>
  );
}
