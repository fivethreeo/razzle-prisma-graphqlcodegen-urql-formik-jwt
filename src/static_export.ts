import { renderApp } from './real.server';
import { Request, Response } from "express";

export const render = async (req: Request, res: Response) => {
  const { html } = await renderApp(req, res);

  res.json({ html });
};

export const routes = async () => {
  return ['/', '/about'];
};
