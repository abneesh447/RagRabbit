import NextAuth, { DefaultSession, NextAuthResult, Session } from "./auth";
import authConfig from "./config";
import { logger } from "@repo/logger";
import { redirect } from "next/navigation";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import db from "@repo/db";
import {
  User,
  usersTable,
  accountsTable,
  sessionsTable,
  verificationTokensTable,
  authenticatorsTable,
} from "@repo/db/schema";

const log = logger.child({ context: "auth" });

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      organizationId: number;
    } & DefaultSession["user"];
  }
}

log.info({ providers: authConfig.providers.map((p) => p?.name) }, "Auth config");

const result: NextAuthResult = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable,
    accountsTable,
    sessionsTable,
    verificationTokensTable,
    authenticatorsTable,
  }),
  ...authConfig,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    /** Extends the session.user object to keep also the id and organizationId values */
    session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.organizationId = (token.orgId as number | undefined) ?? 1;
      return session;
    },

    /** Extends the JWT token to keep also the orgId value */
    async jwt({ token, account, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      if (user && "organizationId" in user && user.organizationId != null) {
        token.orgId = user.organizationId as number;
        if (account) {
          log.info({ user }, "New user registered");
        }
      } else if (account && user && !token.orgId) {
        const defaultOrg = await db.query.organizationsTable.findFirst();
        if (defaultOrg) {
          token.orgId = defaultOrg.id;
        }
      }
      return token;
    },
  },
  logger: {
    error(error) {
      log.error(error);
    },
    warn(code) {
      log.warn(code);
    },
    debug(message, meta: any) {
      log.trace({ ...meta }, message);
    },
  },
});
export const handlers: NextAuthResult["handlers"] = result.handlers;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
export const auth: NextAuthResult["auth"] = result.auth;

export async function authOrLogin(): Promise<Session> {
  const session = await auth();
  log.info({ session }, "authOrLogin");
  if (!session || !session.user || !session.user.id) {
    log.info("Redirecting to signin");
    redirect("/login");
  }
  return session;
}
