import { Express } from "express";
import { ApolloServer } from "apollo-server-express";
import { loadSchema } from "@graphql-tools/load";
import { addResolversToSchema } from "@graphql-tools/schema";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { PrismaClient } from "../prisma";
import { getAccessTokenFromReq, verifyAccessToken } from "../auth/jwt";
import { AccessJwtPayload } from "../auth/appJwt";
import { mergeResolvers } from "@graphql-tools/merge";


import AuthResolver from "../auth/resolver";

const addApollo = async (server: Express, prisma: PrismaClient) => {
  
  // this can also be a glob pattern to match multiple files
  const schema = await loadSchema("./src/**/*.graphql", {
    loaders: [new GraphQLFileLoader()],
  });

  const schemaWithResolvers = addResolversToSchema({
    schema,
    resolvers: mergeResolvers([AuthResolver]),
  });

  const apolloServer = new ApolloServer({
    schema: schemaWithResolvers,
    context: ({ req, res }) => {
      const token = getAccessTokenFromReq(req);
      console.log(token)
      return { req, res, prisma, auth: verifyAccessToken<AccessJwtPayload>(token) };
    },
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app: server, cors: false } );

  return server;
};

export default addApollo;
