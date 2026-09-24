import { ENV } from "../config/env.js";
import { userRepository } from "../repositories/user.repository.js";
import type { User } from "../types/index.js";
import { hashPassword } from "../utils/password.js";

/** Create the first administrator once. Existing database credentials always win. */
export async function ensureBootstrapAdmin(): Promise<User | null> {
  const existing = await userRepository.find({
    where: [{ field: "role", operator: "==", value: "ADMIN" }],
    limit: 1,
  });
  if (existing[0]) return existing[0];

  const email = ENV.ADMIN_BOOTSTRAP_EMAIL;
  const password = ENV.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password) {
    if (ENV.NODE_ENV === "production") {
      throw new Error(
        "ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are required to create the first administrator.",
      );
    }
    console.warn(
      "[Bootstrap] Admin account was not created: set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD in backend/.env.",
    );
    return null;
  }
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 8 ||
    password.length > 128
  ) {
    throw new Error(
      "Invalid admin bootstrap credentials: provide a valid email and an 8–128 character password.",
    );
  }
  if (await userRepository.findByEmail(email)) {
    throw new Error(
      "Admin bootstrap email already belongs to a non-admin account.",
    );
  }
  if (await userRepository.findById("user_admin_1")) {
    throw new Error(
      "Admin bootstrap ID already belongs to a non-admin account.",
    );
  }

  const now = new Date().toISOString();
  return userRepository.create({
    id: "user_admin_1",
    email,
    username: email,
    role: "ADMIN",
    name: "NexTech Systems Administrator",
    addresses: [],
    passwordHash: hashPassword(password),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
}
