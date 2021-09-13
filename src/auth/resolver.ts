import { sign } from "jsonwebtoken";
import { hash, compare} from "bcryptjs";
import { Resolvers } from "../types/resolvers-types";
import { getTokens, setCookieTokens } from "./jwt";

const resolvers: Resolvers = {
  Query: {
    async me(_, _args, { prisma, auth }) {
      if (!user) throw new Error("You are not authenticated");
      return await prisma.user.findFirst({ where: { id: user.id }});
    },
    async user(_parent, { id }, { prisma, auth }) {
      try {
        if (!user) throw new Error("You are not authenticated!");
        return await prisma.user.findFirst({ where: { id: id }});
      } catch (error) {
        throw new Error(error.message);
      }
    },
    async allUsers(_parent, _args, { prisma, auth }) {
      try {
        if (!user) throw new Error("You are not authenticated!");
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
        const tokens = getTokens(user);
        if (process.env.JWT_COOKIE_TOKENS || process.env.JWT_REFRESH_COOKIE_TOKEN_ONLY) {
        return setCookieTokens(tokens, res, !!process.env.JWT_REFRESH_COOKIE_TOKEN_ONLY)
        }
        else {
          return tokens
        }
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

        const userToken = await prisma.usertoken.findFirst({ where: { userId: user.id } });

        return {
          accessToken,
          refreshToken
        };
      } catch (error) {
        throw new Error(error.message);
      }
    },
    async refreshTokens(_, { refreshToken }, { prisma, res }) {
      try {
        const userToken = await prisma.usertoken.findFirst({ where: { userId: user.id } });

        return {
          accessToken,
          refreshToken
        };
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
};

export default resolvers;
