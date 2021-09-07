
declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<React.SVGProps<
    SVGSVGElement
  > & { title?: string }>;

  const src: string;
  export default src;
}

declare const CODESANDBOX_HOST: string | undefined;

declare interface Window {
  __URQL_DATA__: any;
}

