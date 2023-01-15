import type { User } from "@prisma/client";
import { prisma } from "~/utilities/prisma.server";

export async function getUnsafeUserByUsername(username: User["username"]) {
  const unsafeUser = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      password: true,
    },
  });

  if (!unsafeUser) return undefined;
  return unsafeUser;
}

export async function getUserById(id: User["id"]) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
    },
  });

  if (!user) return undefined;
  return user;
}
