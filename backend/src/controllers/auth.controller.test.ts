import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request, Response } from "express";
import { authController } from "./auth.controller.js";
import { ENV } from "../config/env.js";
import { userRepository } from "../repositories/user.repository.js";
import { ensureBootstrapAdmin } from "../services/admin-bootstrap.service.js";
import { verifyPassword } from "../utils/password.js";
import type { User } from "../types/index.js";

function response() {
  const result: { status: number; body?: any } = { status: 200 };
  const res = {
    status(code: number) {
      result.status = code;
      return this;
    },
    json(body: any) {
      result.body = body;
      return this;
    },
  } as Response;
  return { result, res };
}

test("environment provisions the first admin; database credentials remain authoritative", async () => {
  let user: User | null = null;
  const original = {
    find: userRepository.find,
    findByEmail: userRepository.findByEmail,
    findById: userRepository.findById,
    create: userRepository.create,
    update: userRepository.update,
    email: ENV.ADMIN_BOOTSTRAP_EMAIL,
    password: ENV.ADMIN_BOOTSTRAP_PASSWORD,
  };
  ENV.ADMIN_BOOTSTRAP_EMAIL = "first-admin@example.test";
  ENV.ADMIN_BOOTSTRAP_PASSWORD = "initial-env-password";
  userRepository.find = async () => (user ? [user] : []);
  userRepository.findByEmail = async (email) =>
    user?.email === email ? user : null;
  userRepository.findById = async () => user;
  userRepository.create = async (created) => {
    user = created;
    return created;
  };
  userRepository.update = async (_id, changes) => {
    assert.ok(user);
    user = { ...user, ...changes };
    return user;
  };

  async function login(password: string) {
    const { result, res } = response();
    await authController.login(
      { body: { email: "first-admin@example.test", password } } as Request,
      res,
    );
    return result.status;
  }

  try {
    const admin = await ensureBootstrapAdmin();
    assert.equal(admin?.email, "first-admin@example.test");
    assert.ok(
      admin?.passwordHash &&
        verifyPassword("initial-env-password", admin.passwordHash),
    );
    assert.equal(await login("initial-env-password"), 200);

    ENV.ADMIN_BOOTSTRAP_PASSWORD = "changed-env-password";
    assert.equal(
      (await ensureBootstrapAdmin())?.passwordHash,
      admin?.passwordHash,
    );
    assert.equal(await login("changed-env-password"), 401);

    const { result, res } = response();
    await authController.changePassword(
      {
        user: { id: admin!.id, role: "ADMIN" },
        body: {
          currentPassword: "initial-env-password",
          newPassword: "chosen-dashboard-password",
        },
      } as any,
      res,
    );
    assert.equal(result.status, 200);
    assert.equal(await login("initial-env-password"), 401);
    assert.equal(await login("chosen-dashboard-password"), 200);
  } finally {
    userRepository.find = original.find;
    userRepository.findByEmail = original.findByEmail;
    userRepository.findById = original.findById;
    userRepository.create = original.create;
    userRepository.update = original.update;
    ENV.ADMIN_BOOTSTRAP_EMAIL = original.email;
    ENV.ADMIN_BOOTSTRAP_PASSWORD = original.password;
  }
});
