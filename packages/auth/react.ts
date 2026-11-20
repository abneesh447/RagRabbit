import { NextAuthResult } from "next-auth";
import { signOut as clientSignOut } from "next-auth/react";

export * from "next-auth/react";
export type { NextAuthResult };

/** Client sign-out with redirect to the login page (use from onClick handlers). */
export function signOutToLogin() {
  return clientSignOut({ redirectTo: "/login" });
}
