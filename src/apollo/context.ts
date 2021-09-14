import { Request, Response } from "express";
import { AccessJwtPayload } from "../auth/appJwt";
import { PrismaClient } from "../prisma";

export interface Context {
  req: Request;
  res: Response;
  prisma: PrismaClient;
  auth: AccessJwtPayload;
}
