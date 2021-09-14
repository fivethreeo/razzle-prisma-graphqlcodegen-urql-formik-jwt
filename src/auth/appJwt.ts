import { PayloadHandlers } from "./jwt";
import { JwtPayload } from "jsonwebtoken";
import { PrismaClient } from "../prisma";
import { User as UserModel } from "../prisma/index.d";

export interface AccessJwtPayload extends JwtPayload {
  userid: number;
}
export interface RefreshJwtPayload extends JwtPayload {
  userid: number;
}

export const getPayloadHandlers = (
  prisma: PrismaClient,
  forUser?: UserModel
): PayloadHandlers<AccessJwtPayload, RefreshJwtPayload> => {
  let cachedUser = forUser;

  const getUser = async (userid?: number) => {
    if (!cachedUser && userid) {
      cachedUser = await prisma.user.findFirst({ where: { id: userid } });
    }

    return cachedUser;
  };

  return {
    verifyRefresh: async (refreshToken, refreshPayload) => {
      const user = await getUser(refreshPayload.userid);
      return true;
    },
    createRefreshPayload: async (prevRefreshPayload) => {
      const user = await getUser();
      return { userid: user.id };
    },
    createAccessPayload: async (refreshPayload) => {
      const user = await getUser();
      return { userid: user.id };
    },
    storeRefreshToken: async (refreshToken, refreshPayload) => {
      return true;
    },
  };
};
