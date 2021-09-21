/* eslint-disable */
import * as graphql from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

const documents = {
    "\n  query Me {\n    me {\n      id\n    }\n  }\n": graphql.MeDocument,
    "\n  mutation Refresh {\n    refreshTokens {\n      success\n    }\n  }\n": graphql.RefreshDocument,
};

export function gql(source: "\n  query Me {\n    me {\n      id\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      id\n    }\n  }\n"];
export function gql(source: "\n  mutation Refresh {\n    refreshTokens {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation Refresh {\n    refreshTokens {\n      success\n    }\n  }\n"];
export function gql(source: string): unknown;

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<
  infer TType,
  any
>
  ? TType
  : never;
