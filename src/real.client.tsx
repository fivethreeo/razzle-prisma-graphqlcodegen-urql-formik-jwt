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
// import { authExchange } from '@urql/exchange-auth';
// add query to getAuth
import { authExchange } from "./auth/authExchange";

import { Provider } from "urql";
import { gql } from "./gql";

const { Me, Refresh }  = gql(/* GraphQL */ `
  query Me {
    me {
      id
    }
  }

  mutation Refresh {
    refreshTokens {
      success
    }
  }
`);

const isServerSide = typeof window === "undefined";

// The `ssrExchange` must be initialized with `isClient` and `initialState`
const ssr = ssrExchange({
  isClient: !isServerSide,
  initialState: !isServerSide ? window.__URQL_DATA__ : undefined,
});

const client = createClient({
  fetchOptions: {
    credentials: "include"
  },
  url: "http://localhost:3000/graphql",
  exchanges: [
    dedupExchange,
    cacheExchange,
    ssr, // Add `ssr` in front of the `fetchExchange`
    authExchange({
      async getAuth({ authState, mutate, query}) {
        if (!authState) {
          const meresult = await query(Me, {});

          if (!meresult.error.graphQLErrors.some(
            (e) => /not authenticated/.test(e.extensions?.code||'')
          )) {
            return true;
          }

          return null;
        }

        const result = await mutate(Refresh, {});

        if (result.data?.refreshTokens.success) {
          return true;
        }

        return null;
      },

      addAuthToOperation({ authState, operation }) {
        /* if (!authState || !authState.token) {
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
        }); */
        return operation;
      },

      didAuthError({ error }) {
        return error.graphQLErrors.some(
          (e) => /not authenticated/.test(e.extensions?.code||'')
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
                  return node.kind === "Field" && /login|registerUser/.test(node.name.value);
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
