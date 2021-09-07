import express, { Request, Response } from "express";

import cookieParser from "cookie-parser";
import cors from "cors";
import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import addApollo from "./apollo";

import App from "./App";

type STATIC_CONTEXT = {
  statusCode?: number;
  url?: string;
};

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST);

const cssLinksFromAssets = (
  public_path: string,
  assets: unknown,
  entrypoint: string
): string => {
  return assets[entrypoint]
    ? assets[entrypoint].css
      ? assets[entrypoint].css
          .map(
            (asset: string) =>
              `<link rel="stylesheet" href="${public_path}${asset}">`
          )
          .join("")
      : ""
    : "";
};

const jsScriptTagsFromAssets = (
  public_path: string,
  assets: unknown,
  entrypoint: string,
  extra: string = ""
): string => {
  return assets[entrypoint]
    ? assets[entrypoint].js
      ? assets[entrypoint].js
          .map(
            (asset: string) =>
              `<script src="${public_path}${asset}"${extra}></script>`
          )
          .join("")
      : ""
    : "";
};

const server = express();

export const renderApp = async (req: Request, res: Response) => {
  const public_path =
    typeof CODESANDBOX_HOST !== "undefined"
      ? `https://${CODESANDBOX_HOST}/`
      : "http://localhost:3001/";

  const context: STATIC_CONTEXT = {};
  const markup = renderToString(
    <StaticRouter location={req.url} context={context}>
      <App />
    </StaticRouter>
  );

  const html =
    // prettier-ignore
    `<!doctype html>
      <html lang="">
      <head>
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta charSet='utf-8' />
          <title>Welcome to Razzle</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script type="text/javascript">
            window.PUBLIC_PATH = '${public_path}';
          </script>
          ${cssLinksFromAssets(public_path, assets, 'client')}            
      </head>
      <body>
          <div id="root">${markup}</div>
          <!-- razzle_static_js -->
          ${jsScriptTagsFromAssets(public_path, assets, 'client', ' defer crossorigin')}
      </body>
  </html>`;

  return { html, context };
};

const corsOptionsDelegate = function (req, callback) {
  let corsOptions = {
    credentials: true
  };
  corsOptions.origin = req.headers.origin;
  callback(null, corsOptions) // callback expects two parameters: error and options
}

const createserver = async () => {

  let server = express()
    .use(
      cors(corsOptionsDelegate)
    )
    .options('*', cors(corsOptionsDelegate))
    .use(cookieParser());

  if (addApollo) {
    server = await addApollo(server);
  }

  server = server
    .disable("x-powered-by")
    .use(express.static(process.env.RAZZLE_PUBLIC_DIR))
    .get("/*", async (req, res) => {
      const { html, context } = await renderApp(req, res);

      if (context.url) {
        // Somewhere a `<Redirect>` was rendered
        return res.redirect(301, context.url);
      }

      res.send(html);
    });

  return server;
};

export default createserver();
