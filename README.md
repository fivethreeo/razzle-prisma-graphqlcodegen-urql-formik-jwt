# Razzle Basic Example

## How to use
Download the example [or clone the whole project](https://github.com/jaredpalmer/razzle.git):

```bash
curl https://codeload.github.com/jaredpalmer/razzle/tar.gz/master | tar -xz --strip=2 razzle-master/examples/basic
cd basic
```

Install it and run:

```bash
yarn install

node createdb.js
sed -ie 's/postgresql/sqlite/g' prisma/schema.prisma 
DATABASE_URL=file:../db.sqlite node_modules/.bin/prisma db pull
DATABASE_URL=file:../db.sqlite node_modules/.bin/prisma generate
yarn graphql-codegen
yarn add -D @app/gql@link:./src/gql

yarn start

sed -ie 's/sqlite/postgresql/g' prisma/schema.prisma
DATABASE_URL=file:../db.sqlite node_modules/.bin/prisma generate
yarn build
pushd ../typegraphql-prisma
yarn link
popd
yarn link typegraphql-prisma
chmod u+x node_modules/.bin/typegraphql-prisma
```

## Idea behind the example
This is a basic, bare-bones example of how to use razzle. It satisfies the entry points
`src/index.js` for the server and and `src/client.js` for the browser.
