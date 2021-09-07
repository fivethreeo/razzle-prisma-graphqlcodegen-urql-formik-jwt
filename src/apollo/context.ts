import { Request, Response } from "express";
import { PrismaClient } from "../prisma";

export interface Context {
  req: Request;
  res: Response;
  prisma: PrismaClient;
}
