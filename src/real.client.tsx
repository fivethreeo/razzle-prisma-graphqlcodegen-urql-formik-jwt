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
