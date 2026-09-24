import prisma from "../../lib/prisma.js";
import { AppError } from "../../utils/errors.js";
import { signAccessToken } from "../../utils/jwt.js";

function getUserName(user) {
  const profile = user.student ?? user.faculty;
  return profile ? `${profile.firstName} ${profile.lastName}` : "Administrator";
}

function toUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: getUserName(user)
  };
}

export async function login(role) {
  const user = await prisma.user.findFirst({
    where: { role, isActive: true },
    orderBy: { id: "asc" },
    include: { student: true, faculty: true }
  });

  if (!user) {
    throw new AppError(404, "DEMO_USER_NOT_FOUND", `No active demo user exists for role ${role}.`);
  }

  return {
    token: signAccessToken({ id: user.id, role: user.role }),
    user: toUserResponse(user)
  };
}

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true, faculty: true }
  });

  if (!user || !user.isActive) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "The authenticated user is no longer active.");
  }

  return { user: toUserResponse(user) };
}
