import { createMiddleware } from "@tanstack/react-start";
import { requireAdmin } from "./admin-auth.server";

export const adminMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const admin = await requireAdmin();
  return next({ context: { admin } });
});
