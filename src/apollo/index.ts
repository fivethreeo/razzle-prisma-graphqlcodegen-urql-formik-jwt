import { ApolloServer } from "apollo-server-express";
import { loadSchema } from "@graphql-tools/load";
import { addResolversToSchema } from "@graphql-tools/schema";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { PrismaClient } from "../prisma";
import { verify } from "jsonwebtoken";
import { mergeResolvers } from "@graphql-tools/merge";

const { JWT_SECRET } = process.env;

const getUser = (token) => {
  try {
    if (token) {
      return verify(token, JWT_SECRET);
    }
    return null;
  } catch (error) {
    return null;
  }
};

import AuthResolver from "../auth/resolver";

const addApollo = async (server) => {
  
  // this can also be a glob pattern to match multiple files
  const schema = await loadSchema("./src/**/*.graphql", {
    loaders: [new GraphQLFileLoader()],
  });

  const schemaWithResolvers = addResolversToSchema({
    schema,
    resolvers: mergeResolvers([AuthResolver]),
  });

  const prisma = new PrismaClient();

  const apolloServer = new ApolloServer({
    schema: schemaWithResolvers,
    context: ({ req, res }) => {
      const token = req.cookies.access_token || req.get("Authorization") || "";
      return { req, res, prisma, user: getUser(token.replace("Bearer", "")) };
    },
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app: server, cors: false } );

  return server;
};

export default addApollo;
