// SPDX-FileCopyrightText: © 2020 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Routes, Route, useNavigate } from "react-router";

import * as Etebase from "etebase";

import { Button, useTheme } from "@mui/material";
import IconEdit from "@mui/icons-material/Edit";
import IconChangeHistory from "@mui/icons-material/ChangeHistory";

import { ContactType, PimType } from "../pim-types";
import { useCredentials } from "../credentials";
import { useItems, useCollections } from "../etebase-helpers";
import { routeResolver } from "../App";
import { RouteParams } from "../routes";
import SearchableAddressBook from "./SearchableAddressBook";
import Contact from "./Contact";
import LoadingIndicator from "../widgets/LoadingIndicator";
import ContactEdit from "./ContactEdit";
import GroupEdit from "./GroupEdit";
import PageNotFound from "../PageNotFound";

import { CachedCollection, getItemNavigationUid, getDecryptCollectionsFunction, getDecryptItemsFunction, PimFab, itemSave, itemDelete } from "../Pim/helpers";
import ItemChangeHistory from "../Pim/ItemChangeHistory";

const colType = "etebase.vcard";

const decryptCollections = getDecryptCollectionsFunction(colType);
const decryptItems = getDecryptItemsFunction(colType, ContactType.parse);

export default function ContactsMain() {
  const [entries, setEntries] = React.useState<Map<string, Map<string, ContactType>>>();
  const [cachedCollections, setCachedCollections] = React.useState<CachedCollection[]>();
  const theme = useTheme();
  const navigate = useNavigate();
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

    navigate(routeResolver.getRoute("pim.contacts"));
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

  const allGroups = flatEntries.filter((x) => x.group);

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
            <SearchableAddressBook
              entries={flatEntries}
              onItemClick={(item) => navigate(
                routeResolver.getRoute("pim.contacts._id", { itemUid: getItemNavigationUid(item) })
              )}
              onNewGroupClick={() => navigate(
                routeResolver.getRoute("pim.contacts.new.group")
              )}
            />
            <PimFab
              onClick={() => navigate(
                routeResolver.getRoute("pim.contacts.new.contact")
              )}
            />
          </>
        }
      />
      <Route
        path={routeResolver.getRelativeRoute("pim.contacts.new.group", "pim.contacts")}
        element={
          <GroupEdit
            collections={cachedCollections}
            onSave={onItemSave}
            onDelete={onItemDelete}
            onCancel={goBack}
            goBack={goBack}
            allGroups={allGroups}
          />
        }
      />
      <Route
        path={routeResolver.getRelativeRoute("pim.contacts.new.contact", "pim.contacts")}
        element={
          <ContactEdit
            collections={cachedCollections}
            onSave={onItemSave}
            onDelete={onItemDelete}
            onCancel={goBack}
            goBack={goBack}
            allGroups={allGroups}
          />
        }
      />
      <Route
        path={routeResolver.getRelativeRoute("pim.contacts._id.log", "pim.contacts") + "/*"}
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
        path={routeResolver.getRelativeRoute("pim.contacts._id", "pim.contacts") + "/*"}
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
              const path = `pim.contacts._id.edit.${item.group ? "group" : "contact"}`;

              return (
                <Routes>
                  <Route
                    path={routeResolver.getRelativeRoute(path, "pim.contacts._id")}
                    element={item.group ?
                      <GroupEdit
                        key={itemUid}
                        initialCollection={item.collectionUid}
                        item={item}
                        collections={cachedCollections}
                        onSave={onItemSave}
                        onDelete={onItemDelete}
                        onCancel={goBack}
                        goBack={goBack}
                        allGroups={allGroups}
                      />
                      :
                      <ContactEdit
                        key={itemUid}
                        initialCollection={item.collectionUid}
                        item={item}
                        collections={cachedCollections}
                        onSave={onItemSave}
                        onDelete={onItemDelete}
                        onCancel={goBack}
                        goBack={goBack}
                        allGroups={allGroups}
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
                              navigate(routeResolver.getRoute("pim.contacts._id.log", { itemUid: getItemNavigationUid(item) }))
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
                              navigate(routeResolver.getRoute(path, { itemUid: getItemNavigationUid(item) }))
                            }
                          >
                            <IconEdit style={styles.leftIcon} />
                            Edit
                          </Button>

                        </div>
                        <Contact item={item} />
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
