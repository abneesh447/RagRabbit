"use client";

import { DashboardLayout } from "@repo/design/components/dashboard/layout";
import { useSelectedLayoutSegments } from "next/navigation";
import { signOutToLogin } from "@repo/auth/react";

export default function Layout({ children }) {
  const segment = useSelectedLayoutSegments();

  return <DashboardLayout signOut={signOutToLogin}>{children}</DashboardLayout>;
}
