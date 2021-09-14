import { JwtPayload, sign, verify } from "jsonwebtoken";
import { Request, Response } from "express";
import { prisma } from "../prisma";

interface Tokens {
  accessToken?: string;
  refreshToken?: string;
}

export interface PayloadHandlers<T extends JwtPayload, U extends JwtPayload> {
  verifyRefresh: (refreshToken: string, refreshPayload: U) => Promise<boolean>;
  storeRefreshToken: (refreshToken: string, refreshPayload: U) => Promise<boolean>;
  createRefreshPayload: (prevRefreshPayload?: U) => Promise<U>;
  createAccessPayload: (refreshPayload: U) => Promise<T>;
}

const sevenDays = 60 * 60 * 24 * 7 * 1000;
const fifteenMins = 60 * 15 * 1000;

export const getAccessToken = async <T extends JwtPayload, U extends JwtPayload> (
  handlers: PayloadHandlers<T, U>,
  refreshPayload: U | null
): Promise<string> => {
  
  const accessPayload = await handlers.createAccessPayload(refreshPayload)

  const accessToken = sign(
    accessPayload,
    process.env.JWT_SECRET,
    {
      expiresIn: fifteenMins,
    }
  );

  return accessToken;
};

export const getRefreshToken = async <T extends JwtPayload, U extends JwtPayload>(
  handlers: PayloadHandlers<T, U>,
  prevRefreshPayload: U | null
): Promise<{ refreshToken?: string, refreshPayload: U}> => {

  const refreshPayload = await handlers.createRefreshPayload(prevRefreshPayload)

  const refreshToken = sign(
    refreshPayload,
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: sevenDays,
    }
  );

  await handlers.storeRefreshToken(refreshToken, refreshPayload);

  return { refreshToken, refreshPayload };
};

export const getTokens = async <T extends JwtPayload, U extends JwtPayload>(
  handlers: PayloadHandlers<T, U>,
  prevRefreshPayload?: U 
): Promise<Tokens> => {
  const { refreshToken, refreshPayload } = await getRefreshToken(handlers, prevRefreshPayload);
  return {
    accessToken: await getAccessToken(handlers, refreshPayload),
    ...(refreshToken && { refreshToken })
  };
};

export const verifyAccessToken = <T extends JwtPayload>(token: string): T | null => {
  try {
    return <T>verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

export const verifyRefreshToken = <T extends JwtPayload>(token: string): T | null => {
  try {
    return <T>verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
};

export const getAccessTokenFromReq = (req: Request): string | undefined => {
  return (
    req.cookies.access_token ||
    req.headers["x-access-token"] ||
    (req.get("Authorization")||'').replace("Bearer ", "")
  );
};

export const getRefreshTokenFromReq = (req: Request): string | undefined => {
  return req.cookies.refresh_token || req.headers["x-refresh-token"];
};

export const refreshTokens = async <T extends JwtPayload, U extends JwtPayload>(
  handlers: PayloadHandlers<T, U>,
  refreshToken: string | undefined
): Promise<Tokens | null> => {
  if (!refreshToken) return null;
  const decodedRefreshToken = verifyRefreshToken<U>(refreshToken);
  if (decodedRefreshToken) {
    const verifiedRefreshPayload = await handlers.verifyRefresh(
      refreshToken, decodedRefreshToken
    );
    return verifiedRefreshPayload ? getTokens<T, U>(handlers, decodedRefreshToken) : null;
  }
  return null;
};

export const refreshCookieTokens = async <T extends JwtPayload, U extends JwtPayload> (
  handlers: PayloadHandlers<T, U>,
  req: Request,
  res: Response,
  refreshOnly: boolean
): Promise<Tokens | null> => {
  const refreshToken = getRefreshTokenFromReq(req);
  const tokens = await refreshTokens(handlers, refreshToken);
  if (tokens) {
    return setCookieTokens(
      refreshOnly ? { refreshToken: tokens.refreshToken } : tokens,
      res
    );
  }
  return tokens;
};

export const setCookieTokens = (tokens: Tokens, res: Response): Tokens => {
  if (tokens.accessToken) {
    res.cookie("access_token", tokens.accessToken, {
      path: process.env.JWT_COOKIE_PATH || "/",
      domain: process.env.JWT_COOKIE_DOMAIN || "localhost",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  if (tokens.refreshToken) {
    res.cookie("refresh_token", tokens.refreshToken, {
      path: process.env.JWT_REFRESH_COOKIE_PATH || "/",
      domain: process.env.JWT_REFRESH_COOKIE_DOMAIN || "localhost",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return tokens;
};

export const clearCookieTokens = (res: Response): void => {
  res.clearCookie("access_token", {
    path: process.env.JWT_COOKIE_PATH || "/",
    domain: process.env.JWT_COOKIE_DOMAIN || "localhost",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  res.clearCookie("refresh_token", {
    path: process.env.JWT_REFRESH_COOKIE_PATH || "/",
    domain: process.env.JWT_REFRESH_COOKIE_DOMAIN || "localhost",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
};
