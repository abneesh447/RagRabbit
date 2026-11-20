import { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@repo/auth";
import { Button } from "@repo/design/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/design/shadcn/card";
import { Input } from "@repo/design/shadcn/input";
import { Label } from "@repo/design/shadcn/label";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

async function loginWithCredentials(formData: FormData) {
  "use server";

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return redirect("/login?error=CredentialsSignin");
    }
    throw error;
  }
}

async function loginWithGitHub() {
  "use server";
  await signIn("github", { redirectTo: "/" });
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const { error } = await searchParams;
  const hasCredentials = Boolean(process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD);
  const hasGitHub = Boolean(process.env.GITHUB_ID);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to RagRabbit</CardTitle>
          <CardDescription>Use your admin credentials to access the dashboard and AI features.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error === "CredentialsSignin" && (
            <p className="text-sm text-destructive">Invalid username or password.</p>
          )}

          {hasCredentials && (
            <form action={loginWithCredentials} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" required autoComplete="username" placeholder="admin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
          )}

          {hasGitHub && (
            <form action={loginWithGitHub}>
              <Button type="submit" variant="outline" className="w-full">
                Sign in with GitHub
              </Button>
            </form>
          )}

          {!hasCredentials && !hasGitHub && (
            <p className="text-sm text-muted-foreground">
              No sign-in providers are configured. Set AUTH_USERNAME and AUTH_PASSWORD in your environment.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}