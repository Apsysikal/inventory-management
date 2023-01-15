import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { compare } from "bcryptjs";
import invariant from "tiny-invariant";
import { getUnsafeUserByUsername, getUserById } from "~/models/user.server";

const sessionSecret = process.env.SESSION_SECRET;

invariant(sessionSecret, `Session secret must be defined`);

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await sessionStorage.getSession(); // Create a new session
  session.set("userId", userId); // Set "userId" in the session cookie

  return redirect(redirectTo, {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

export async function getUserSession(request: Request) {
  return await sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");

  if (!userId || typeof userId !== "string") return undefined;
  return userId;
}

/**
 * Tries to get the userId from the cookie in the request header.
 * If there is no cookie or the cookie does not contain an entry
 * for "userId" the function will redirect the user to the login
 * page with the redirectTo search param being set.
 * @param request The incoming request
 * @param redirectTo The redirect url, where the user will be redirected after logging in.
 * Default to the request objects location.
 * @returns The userId
 */
export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
): Promise<string> {
  const userId = await getUserId(request);

  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }

  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return undefined;

  const user = await getUserById(userId);
  if (!user) return undefined;

  return user;
}

/**
 * Tries to get the user via the cookie in the request header.
 * If there is no cookie, the cookie does not contain an entry
 * for "userId" or no user could be found in the database matching
 * that userId the function will redirect the user to the login
 * page with the redirectTo search param being set.
 * @param request The incoming request
 * @param redirectTo The redirect url, where the user will be redirected after loggin in.
 * Defaults to the request objects location.
 * @returns The user
 */
export async function requireUser(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await requireUserId(request, redirectTo);
  const user = await getUserById(userId);

  if (!user) {
    // No user exists for the userId in the cookie
    // Logout and destroy the cookie
    throw await logout(request);
  }

  return user;
}

export async function login(username: string, password: string) {
  const unsafeUser = await getUnsafeUserByUsername(username);

  if (!unsafeUser) return undefined;

  invariant(unsafeUser.password, `User '${username}' has no password`);
  const { hash } = unsafeUser.password;
  const passwordMatches = await compare(password, hash);

  if (!passwordMatches) return undefined;

  const { password: _, ...safeUser } = unsafeUser;
  return safeUser;
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/", {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}
