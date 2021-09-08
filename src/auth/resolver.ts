import { sign } from "jsonwebtoken";
import { hash, compare} from "bcryptjs";
import { Resolvers } from "../types/resolvers-types";

const resolvers: Resolvers = {
  Query: {
    async me(_, _args, { prisma, user }) {
      if (!user) throw new Error("You are not authenticated");
      return await prisma.user.findFirst({ where: { id: user.id }});
    },
    async user(_parent, { id }, { prisma, user }) {
      try {
        if (!user) throw new Error("You are not authenticated!");
        return await prisma.user.findFirst({ where: { id: id }});
      } catch (error) {
        throw new Error(error.message);
      }
    },
    async allUsers(_parent, _args, { prisma, user }) {
      try {
        if (!user) throw new Error("You are not authenticated!");
        return prisma.user.findMany();
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
  Mutation: {
    async registerUser(_parent, { username, email, password }, { prisma }) {
      try {
        const user = await prisma.user.create({
          data: {
            username,
            email,
            password: await hash(password, 10),
          },
        });
        const token = sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: "1y" }
        );
        return {
          token,
          user
        };
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
        // return jwt
        const accessToken = sign(
          { id: user.id },
          process.env.JWT_SECRET,
          { expiresIn: "15m" }
        );
        
        const refreshToken = sign(
          { id: user.id },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: "7d" }
        );

        res.cookie("access_token", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        })
        
        res.cookie("refresh_token", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        })

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
