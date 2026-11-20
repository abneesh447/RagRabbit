"use client";

import { CircleUser, Menu, Package2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

import { Button } from "@repo/design/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design/shadcn/dropdown-menu";
import { Input } from "@repo/design/shadcn/input";
import { Sheet, SheetContent, SheetTrigger } from "@repo/design/shadcn/sheet";
import { useEffect } from "react";
import Script from "next/script";
import Image from "next/image";
import { RagRabbitSearch } from "./ragrabbit-search";

export function DashboardHeader({ signOut }: { signOut?: () => void | Promise<void> }) {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  function handleSignOut() {
    const signOutAction = signOut ?? (() => nextAuthSignOut({ redirectTo: "/login" }));
    void signOutAction();
  }

  return (
    <header className="sticky z-50 top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <span className="flex items-center gap-1">
        <Image
          src="/logo.svg"
          alt="RagRabbit"
          width={0}
          height={0}
          className="inline-block w-8 h-8 align-text-bottom"
        />
        <h1 className="text-2xl font-bold text-accent-foreground">RagRabbit</h1>
      </span>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <RagRabbitSearch />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{isAuthenticated ? "My Account" : "Account"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isAuthenticated ? (
              <>
                <DropdownMenuItem onClick={() => router.push("/user/profile")}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Logout</DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem asChild>
                <Link href="/login">Sign in</Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
