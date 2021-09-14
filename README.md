# Razzle Typescript Graphql Example With Prisma and JWT Auth

## How to use
Download the example [or clone it](https://github.com/fivethreeo/razzle-prisma-graphqlcodegen-urql-formik-jwt.git):

```bash
mkdir example
curl https://codeload.github.com/fivethreeo/razzle-prisma-graphqlcodegen-urql-formik-jwt/tar.gz/main | tar -xz --strip-components=1 -C example 
cd example
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
DATABASE_URL=file:../db.sqlite JWT_SECRET=secret JWT_REFRESH_SECRET=secret yarn start
# Graphql at http://localhost:3000/graphql

# run a prod build with sqlite
rm db.sqlite
node createdb.js
yarn build
DATABASE_URL=file:../db.sqlite JWT_SECRET=secret JWT_REFRESH_SECRET=secret yarn start:prod

# run a prod build with postgresql
sed -ie 's/sqlite/postgresql/g' prisma/schema.prisma
node_modules/.bin/prisma generate
yarn graphql-codegen
yarn build
export DATABASE_URL=postgres://username:password@localhost:5432/razzle
node_modules/.bin/prisma migrate
JWT_SECRET=secret JWT_REFRESH_SECRET=secret yarn start:prod
```

https://levelup.gitconnected.com/designing-token-based-authentication-system-flow-868893870e03