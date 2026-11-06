// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Params, useParams } from "react-router";

// Calls `children` with the params of the enclosing route, for building a route's `element` from its params.
export function RouteParams(props: { children: (params: Params) => React.ReactElement }) {
  return props.children(useParams());
}

export interface RouteKeysType {
  [Identifier: string]: any;
}

export class RouteResolver {
  public routes: {};

  constructor(routes: {}) {
    this.routes = routes;
  }

  public getRoute(name: string, _keys?: RouteKeysType): string {
    let dict: any = this.routes;

    let path: string[] = [];
    name.split(".").forEach((key) => {
      const val = (typeof dict[key] === "string") ? dict[key] : (dict[key]._base) ? dict[key]._base : key;
      path.push(val);

      dict = dict[key];
    });

    if (_keys) {
      const keys = Object.assign({}, _keys);

      path = path.map((pathComponent) => {
        return pathComponent.split("/").map((val) => {
          if (val[0] === ":") {
            const ret = keys[val.slice(1)];
            if (ret === undefined) {
              throw new Error("Missing key: " + val.slice(1));
            }

            delete keys[val.slice(1)];
            return ret;
          }

          return val;
        }).join("/");
      });

      if (Object.keys(keys).length !== 0) {
        throw new Error("Too many keys for route.");
      }
    }

    return "/" + path.join("/");
  }

  // The path of route `name` relative to the route `parentName`, for the routes of a descendant <Routes>
  // rendered under `parentName`.
  public getRelativeRoute(name: string, parentName: string): string {
    const path = this.getRoute(name);
    const parentPath = this.getRoute(parentName);
    const prefix = parentPath.endsWith("/") ? parentPath : parentPath + "/";
    if (!path.startsWith(prefix)) {
      throw new Error(`Route ${name} is not under ${parentName}.`);
    }

    return path.slice(prefix.length);
  }
}
