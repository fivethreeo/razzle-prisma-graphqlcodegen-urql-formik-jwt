
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { loadDocuments } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
// import { mergeResolvers } from "@graphql-tools/merge";

import AuthResolver from "../auth/resolver";

const addApollo = async (server) => {

  // this can also be a glob pattern to match multiple files!
  const typeDefs = await loadDocuments("./src/**/*.graphql", {
    loaders: [new GraphQLFileLoader()],
  });

  const schema = await buildSchema({
    typeDefs,
    resolvers: [AuthResolver],
  });

  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res }),
  });


  await apolloServer.start();

  apolloServer.applyMiddleware({ app: server });

  return server;
} 

export default addApollo;
