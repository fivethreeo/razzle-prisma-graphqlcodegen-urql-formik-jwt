import { sign } from "jsonwebtoken";
import { hash, compare} from "bcryptjs";
import { AuthPayload, Resolvers } from "../types/resolvers-types";
import { getTokens, refreshCookieTokens, setCookieTokens } from "./jwt";

import { AccessJwtPayload, RefreshJwtPayload } from "../auth/appJwt";
import { PayloadHandlers } from "../auth/jwt";

const resolvers: Resolvers = {
  Query: {
    async me(_, _args, { prisma, auth }) {
      if (!auth) throw new Error("You are not authenticated");
      return await prisma.user.findFirst({ where: { id: user.id }});
    },
    async user(_parent, { id }, { prisma, auth }) {
      try {
        if (!auth) throw new Error("You are not authenticated!");
        return await prisma.user.findFirst({ where: { id: id }});
      } catch (error) {
        throw new Error(error.message);
      }
    },
    async allUsers(_parent, _args, { prisma, auth }) {
      try {
        if (!auth) throw new Error("You are not authenticated!");
        return prisma.user.findMany();
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
  Mutation: {
    async registerUser(_parent, { username, email, password }, { prisma, res }) {
      try {
        const user = await prisma.user.create({
          data: {
            username,
            email,
            password: await hash(password, 10),
          },
        });
        const tokens = await getTokens(<PayloadHandlers<AccessJwtPayload, RefreshJwtPayload>>{
          verifyRefresh: async (refreshToken, refreshPayload) => {
            return true;
          },
          createRefreshPayload: async (prevRefreshPayload) => {
            return {userid: user.id};
          },
          createAccessPayload: async (refreshPayload) => {
            return {userid: user.id};
          },
          storeRefreshToken: async (refreshPayload, refreshToken) => {
            return true;
          }
        });
        return <AuthPayload>setCookieTokens(tokens, res)
      } catch (error) {
        throw new Error(process.env.NODE_ENV === 'development' ? error.message : 'Registration failed' );
      }
    },
    async login(_, { email, password }, { prisma, res }) {
      try {
        const user = await prisma.user.findFirst({ where: { email } });
        if (!user) {
          throw new Error(process.env.NODE_ENV === 'development' ? "No user with that email" : 'Login failed' );
        }
        const isValid = await compare(password, user.password);
        if (!isValid) {
          throw new Error(process.env.NODE_ENV === 'development' ? "Incorrect password" : 'Login failed' );
        }

        const tokens = await getTokens(<PayloadHandlers<AccessJwtPayload, RefreshJwtPayload>>{
          verifyRefresh: async (refreshToken, refreshPayload) => {
            return true;
          },
          createRefreshPayload: async (prevRefreshPayload) => {
            return {userid: user.id};
          },
          createAccessPayload: async (refreshPayload) => {
            return {userid: user.id};
          },
          storeRefreshToken: async (refreshPayload, refreshToken) => {
            return true;
          }
        });
        return <AuthPayload>setCookieTokens(tokens, res)
      } catch (error) {
        throw new Error(error.message);
      }
    },
    async refreshTokens(_, { refreshToken }, { prisma, req, res }) {
      try {

        let user = {id:1};

        const tokens = await refreshCookieTokens(<PayloadHandlers<AccessJwtPayload, RefreshJwtPayload>>{
          verifyRefresh: async (refreshToken, refreshPayload) => {
            return true;
          },
          createRefreshPayload: async (prevRefreshPayload) => {
            return {userid: user.id};
          },
          createAccessPayload: async (refreshPayload) => {
            return {userid: user.id};
          },
          storeRefreshToken: async (refreshPayload, refreshToken) => {
            return true;
          }
        }, req, res, false);
        return <AuthPayload>tokens
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
};

export default resolvers;
