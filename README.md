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
node_modules/.bin/prisma generate
yarn graphql-codegen
yarn add -D @app/gql@link:./src/gql

# run a devserver with sqlite
rm db.sqlite
node createdb.js
DATABASE_URL=file:../db.sqlite JWT_SECRET=secret yarn start

# run a prod build with sqlite
rm db.sqlite
node createdb.js
yarn build
DATABASE_URL=file:../db.sqlite JWT_SECRET=secret yarn start:prod

# run a prod build with postgresql
sed -ie 's/sqlite/postgresql/g' prisma/schema.prisma
node_modules/.bin/prisma generate
yarn graphql-codegen
yarn build
export DATABASE_URL=postgres://username:password@localhost:5432/razzle
node_modules/.bin/prisma migrate
JWT_SECRET=secret yarn start:prod
```