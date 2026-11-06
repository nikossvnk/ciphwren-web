// SPDX-FileCopyrightText: © 2020 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Routes, Route, useNavigate } from "react-router";

import * as Etebase from "etebase";

import { useCredentials } from "../credentials";
import { useCollections, getCollectionManager } from "../etebase-helpers";
import { routeResolver } from "../App";
import { RouteParams } from "../routes";
import LoadingIndicator from "../widgets/LoadingIndicator";

import { CachedCollection, getDecryptCollectionsFunction, PimFab } from "../Pim/helpers";
import CollectionList from "./CollectionList";
import CollectionImport from "./CollectionImport";
import PageNotFound from "../PageNotFound";
import CollectionEdit from "./CollectionEdit";
import CollectionMembers from "./CollectionMembers";
import Collection from "./Collection";
import { useAsyncDispatch } from "../store";
import { collectionUpload, pushMessage } from "../store/actions";
import Invitations from "./Invitations";

const decryptCollections = getDecryptCollectionsFunction();

export default function CollectionsMain() {
  const [cachedCollections, setCachedCollections] = React.useState<CachedCollection[]>();
  const navigate = useNavigate();
  const etebase = useCredentials()!;
  const collections = useCollections(etebase);
  const dispatch = useAsyncDispatch();

  React.useEffect(() => {
    if (collections) {
      decryptCollections(collections)
        .then((entries) => setCachedCollections(entries));
      // FIXME: handle failure to decrypt collections
    }
  }, [collections]);

  if (!cachedCollections) {
    return (
      <LoadingIndicator />
    );
  }

  async function onSave(collection: Etebase.Collection): Promise<void> {
    const colMgr = getCollectionManager(etebase);
    await dispatch(collectionUpload(colMgr, collection));
    dispatch(pushMessage({ message: "Collection saved", severity: "success" }));

    navigate(routeResolver.getRoute("collections"));
  }

  async function onDelete(collection: Etebase.Collection) {
    const colMgr = getCollectionManager(etebase);
    const mtime = (new Date()).getTime();
    const meta = collection.getMeta();
    collection.setMeta({ ...meta, mtime });
    collection.delete(true);
    await dispatch(collectionUpload(colMgr, collection));
    dispatch(pushMessage({ message: "Collection deleted", severity: "success" }));

    navigate(routeResolver.getRoute("collections"));
  }

  function onCancel() {
    navigate(-1);
  }

  return (
    <Routes>
      <Route
        index
        element={
          <>
            <CollectionList
              collections={cachedCollections}
            />
            <PimFab
              onClick={() => navigate(
                routeResolver.getRoute("collections.new")
              )}
            />
          </>
        }
      />
      <Route
        path={routeResolver.getRelativeRoute("collections.import", "collections")}
        element={
          <CollectionImport
            collections={cachedCollections}
          />
        }
      />
      <Route
        path={routeResolver.getRelativeRoute("collections.new", "collections")}
        element={
          <CollectionEdit
            onSave={onSave}
            onDelete={onDelete}
            onCancel={onCancel}
          />
        }
      />
      <Route
        path={routeResolver.getRelativeRoute("collections.invitations", "collections") + "/*"}
        element={<Invitations />}
      />
      <Route
        path={routeResolver.getRelativeRoute("collections._id", "collections") + "/*"}
        element={
          <RouteParams>
            {(params) => {
              const colUid = params.colUid;
              const collection = cachedCollections.find((x) => x.collection.uid === colUid);
              if (!collection) {
                return (<PageNotFound />);
              }

              return (
                <Routes>
                  <Route
                    path={routeResolver.getRelativeRoute("collections._id.edit", "collections._id")}
                    element={
                      <CollectionEdit
                        collection={collection}
                        onSave={onSave}
                        onDelete={onDelete}
                        onCancel={onCancel}
                      />
                    }
                  />
                  <Route
                    path={routeResolver.getRelativeRoute("collections._id.members", "collections._id")}
                    element={<CollectionMembers collection={collection} />}
                  />
                  <Route
                    index
                    element={<Collection collection={collection} />}
                  />
                </Routes>
              );
            }}
          </RouteParams>
        }
      />
    </Routes>
  );
}
