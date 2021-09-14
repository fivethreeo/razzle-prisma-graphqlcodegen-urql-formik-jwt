import { hash, compare} from "bcryptjs";
import { AuthPayload, Resolvers } from "../types/resolvers-types";
import { getTokens, refreshCookieTokens, setCookieTokens } from "./jwt";
import { getPayloadHandlers } from "./appJwt";

const resolvers: Resolvers = {
  Query: {
    async me(_, _args, { prisma, auth }) {
      if (!auth) throw new Error("You are not authenticated");
      return await prisma.user.findFirst({ where: { id: auth.userid }});
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
        const tokens = await getTokens(getPayloadHandlers(prisma, user));
        return <AuthPayload>{ success: true, ...setCookieTokens(tokens, res)}
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

        const tokens = await getTokens(getPayloadHandlers(prisma, user));
        return <AuthPayload>{ success: true, ...setCookieTokens(tokens, res)}
      } catch (error) {
        throw new Error(error.message);
      }
    },
    async refreshTokens(_, { refreshToken }, { prisma, req, res }) {
      try {
        const tokens = await refreshCookieTokens(getPayloadHandlers(prisma), req, res, false);
        return <AuthPayload>{ success: true, ...tokens}
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
};

export default resolvers;
