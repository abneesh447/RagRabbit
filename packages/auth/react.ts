"use client";

import { signOut as clientSignOut } from "next-auth/react";

export { SessionProvider, signOut, useSession } from "next-auth/react";

/** Client sign-out with redirect to the login page (use from onClick handlers). */
export function signOutToLogin() {
  return clientSignOut({ redirectTo: "/login" });
}