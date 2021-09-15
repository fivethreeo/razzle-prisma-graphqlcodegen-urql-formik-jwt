import React from "react";
import { hydrate } from "react-dom";
import { BrowserRouter } from "react-router-dom";

import {
  createClient,
  dedupExchange,
  cacheExchange,
  fetchExchange,
  ssrExchange,
} from "@urql/core";
import { authExchange } from '@urql/exchange-auth';
// add query to getAuth
// import { authExchange } from "./auth/authExchange";

import Me from "./auth/mequery";
import Refresh from "./auth/refreshmutation";

import { Provider } from "urql";

const isServerSide = typeof window === "undefined";

// The `ssrExchange` must be initialized with `isClient` and `initialState`
const ssr = ssrExchange({
  isClient: !isServerSide,
  initialState: !isServerSide ? window.__URQL_DATA__ : undefined,
});

const client = createClient({
  url: "http://localhost:3000/graphql",
  exchanges: [
    dedupExchange,
    cacheExchange,
    ssr, // Add `ssr` in front of the `fetchExchange`
    authExchange({
      async getAuth({ authState, mutate, query }) {
        if (!authState) {
          const token = getToken();
          const refreshToken = getRefreshToken();

          // const me = await query(Me);

          if (token && refreshToken) {
            return { token, refreshToken };
          }

          return null;
        }

        const result = await mutate(Refresh, {
          refreshToken: authState.refreshToken,
        });

        if (result.data?.refreshCredentials) {
          saveAuthData(result.data.refreshCredentials);

          return result.data.refreshCredentials;
        }

        // This is where auth has gone wrong and we need to clean up and redirect to a login page
        clearStorage();
        window.location.reload();

        return null;
      },

      addAuthToOperation({ authState, operation }) {
        if (!authState || !authState.token) {
          return operation;
        }

        const fetchOptions =
          typeof operation.context.fetchOptions === "function"
            ? operation.context.fetchOptions()
            : operation.context.fetchOptions || {};

        return makeOperation(operation.kind, operation, {
          ...operation.context,
          fetchOptions: {
            ...fetchOptions,
            headers: {
              ...fetchOptions.headers,
              Authorization: `Bearer ${authState.token}`,
            },
          },
        });
      },

      didAuthError({ error }) {
        return error.graphQLErrors.some(
          (e) => e.extensions?.code === "UNAUTHORIZED"
        );
      },

      willAuthError({ operation, authState }) {
        if (!authState) {
          // Detect our login mutation and let this operation through:
          return (
            operation.kind !== "mutation" ||
            // Here we find any mutation definition with the "signin" field
            !operation.query.definitions.some((definition) => {
              return (
                definition.kind === "OperationDefinition" &&
                definition.selectionSet.selections.some((node) => {
                  // The field name is just an example, since register may also be an exception
                  return node.kind === "Field" && node.name.value === "signin";
                })
              );
            })
          );
        }

        return false;
      },
    }),
    fetchExchange,
  ],
});

import App from "./App";

hydrate(
  <Provider value={client}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  document.getElementById("root")
);

if (module.hot) {
  module.hot.accept();
}
