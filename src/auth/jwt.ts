import { JwtPayload, sign, verify } from "jsonwebtoken";
import { User as UserModel } from "../prisma/index.d";
import { Request, Response } from "express";
import { PrismaClient } from "../prisma/index.d";

interface PayloadUser {
  id: number;
}

interface UserJwtPayload extends JwtPayload {
  user: PayloadUser;
}

interface Tokens {
  accessToken: string;
  refreshToken?: string;
}

export const getTokens = (
  user: PayloadUser | UserModel,
  reuseRefreshToken?: string
): Tokens => {
  const sevenDays = 60 * 60 * 24 * 7 * 1000;
  const fifteenMins = 60 * 15 * 1000;
  const accessUser = {
    id: user.id,
  };
  const accessToken = sign({ user: accessUser }, process.env.JWT_SECRET, {
    expiresIn: fifteenMins,
  });

  const refreshUser = {
    id: user.id,
  };

  const refreshToken =
    reuseRefreshToken ||
    sign({ user: refreshUser }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: sevenDays,
    });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token): UserJwtPayload => {
  try {
    return <UserJwtPayload>verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token): UserJwtPayload => {
  try {
    return <UserJwtPayload>verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
};

export const getAccessTokenFromReq = (req: Request): string | undefined => {
  return (
    req.cookies.access_token ||
    req.headers["x-access-token"] ||
    req.get("Authorization").replace("Bearer ", "")
  );
};

export const getRefreshTokenFromReq = (req: Request): string | undefined => {
  return req.cookies.refresh_token || req.headers["x-refresh-token"];
};

export const refreshTokens = async (
  refreshToken: string | undefined,
  prisma: PrismaClient
): Promise<Tokens | null> => {
  if (!refreshToken) return null;
  /* 
  const rejectedToken = await prisma.rejectedtokens.findOne({
    where: { token: refreshToken },
  });
  if (rejectedToken) return null;
 */
  const decodedRefreshToken = verifyRefreshToken(refreshToken);
  if (decodedRefreshToken && decodedRefreshToken.user) {
    const user = await prisma.user.findFirst({
      where: { id: decodedRefreshToken.user.id },
    });
    if (!user) return null;

    return getTokens(user);
  }
  return null;
};

export const refreshCookieTokens = async (
  req: Request,
  res: Response,
  prisma: PrismaClient,
  refreshOnly: boolean
): Promise<Tokens | null> => {
  const refreshToken = getRefreshTokenFromReq(req);
  const tokens = await refreshTokens(refreshToken, prisma);
  if (tokens) {
    setCookieTokens(tokens, res, refreshOnly);
    return refreshOnly ? { accessToken: tokens.accessToken } : tokens;
  }
  return null;
};

export const setCookieTokens = (
  tokens: Tokens,
  res: Response,
  refreshOnly: boolean
): void => {
  if (!refreshOnly) {
    res.cookie("access_token", tokens.accessToken, {
      path: process.env.JWT_COOKIE_PATH || "/",
      domain: process.env.JWT_COOKIE_DOMAIN || "localhost",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  res.cookie("refresh_token", tokens.refreshToken, {
    path: process.env.JWT_COOKIE_PATH || "/",
    domain: process.env.JWT_COOKIE_DOMAIN || "localhost",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
};

export const clearCookieTokens = (
  res: Response,
  refreshOnly: boolean
): void => {
  if (!refreshOnly) {
    res.clearCookie("access_token", {
      path: process.env.JWT_COOKIE_PATH || "/",
      domain: process.env.JWT_COOKIE_DOMAIN || "localhost",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  res.clearCookie("refresh_token", {
    path: process.env.JWT_COOKIE_PATH || "/",
    domain: process.env.JWT_COOKIE_DOMAIN || "localhost",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
};
