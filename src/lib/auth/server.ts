import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Pool } from "pg";

const env = (key: string): string | undefined => process.env[key]?.trim() || undefined;
const databaseUrl = env("DATABASE_URL");
const secret = env("BETTER_AUTH_SECRET");
if (!databaseUrl) throw new Error("DATABASE_URL is required for authentication.");
if (!secret) throw new Error("BETTER_AUTH_SECRET is required for authentication.");

const globalRef = globalThis as typeof globalThis & { __authPool__?: Pool };
const pool = globalRef.__authPool__ ?? new Pool({ connectionString: databaseUrl, max: 5 });
globalRef.__authPool__ = pool;

export const authConfigured = true;
export const auth = betterAuth({
  baseURL: env("BETTER_AUTH_URL"),
  secret,
  database: pool,
  trustedOrigins: [env("BETTER_AUTH_URL") ?? "http://localhost:8080"],
  emailAndPassword: { enabled: true },
  session: { cookieCache: { enabled: true, maxAge: 300 } },
  advanced: {
    useSecureCookies: false,
    defaultCookieAttributes: { secure: true, sameSite: "lax", path: "/" },
  },
  plugins: [tanstackStartCookies()],
});

export const SESSION_TOKEN_COOKIE = "__Host-meridian-auth.session_token";
