import { getRequest } from "@tanstack/react-start/server";
import { auth } from "./server";

export class UnauthorizedError extends Error {
  status = 401;
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function getSessionUser() {
  const request = getRequest();
  if (!request) return null;
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function requireUserId(): Promise<string> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user.id;
}
