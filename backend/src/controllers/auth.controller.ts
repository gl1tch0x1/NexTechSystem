import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { userRepository } from "../repositories/user.repository.js";
import { resellerRepository } from "../repositories/reseller.repository.js";
import { walletService } from "../services/wallet.service.js";
import { resellerService } from "../services/reseller.service.js";
import { ENV } from "../config/env.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { User } from "../types/index.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

function sanitizeUser(user: User): User {
  const { passwordHash, adminPinHash, ...safeUser } = user;
  return safeUser as User;
}

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const { name, email, username, phone, address, password } = req.body;

    if (!email || !name || !password) {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Name, Email, and Password are required.",
          },
        });
      return;
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanName = String(name).trim();

    // Email format validation (RFC 5322 simplified)
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 254) {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "INVALID_EMAIL",
            message: "A valid email address is required.",
          },
        });
      return;
    }

    if (cleanName.length < 2 || cleanName.length > 100) {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "INVALID_NAME",
            message: "Name must be between 2 and 100 characters.",
          },
        });
      return;
    }

    if (password.length < 8) {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "WEAK_PASSWORD",
            message: "Password must be at least 8 characters long.",
          },
        });
      return;
    }

    if (password.length > 128) {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "INVALID_PASSWORD",
            message: "Password must not exceed 128 characters.",
          },
        });
      return;
    }

    const existing = await userRepository.findByEmail(cleanEmail);
    if (existing) {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "EMAIL_IN_USE",
            message: "An account with this email already exists.",
          },
        });
      return;
    }

    const userId = `user_${uuidv4()}`;
    const cleanUsername = username
      ? String(username)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "")
          .slice(0, 30)
      : cleanEmail
          .split("@")[0]
          .replace(/[^a-z0-9_]/g, "")
          .slice(0, 30);
    const passwordHash = hashPassword(password);

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      role: "CUSTOMER",
      name: cleanName,
      username: cleanUsername,
      phone: phone ? String(phone).trim().slice(0, 20) : "",
      addresses: address
        ? [
            {
              ...address,
              id: `addr_${uuidv4()}`,
              isDefaultShipping: true,
              isDefaultBilling: true,
            },
          ]
        : [],
      passwordHash,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await userRepository.create(newUser);
    await walletService.getOrCreateWallet(userId);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, tokenVersion: newUser.tokenVersion ?? 0 },
      ENV.JWT_SECRET,
      { expiresIn: "30d" },
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: sanitizeUser(newUser),
      },
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password, roleHint, resellerCode } = req.body;

    if (!email || !password) {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Email / Username and Password are required.",
          },
        });
      return;
    }

    const cleanIdentifier = String(email).trim().toLowerCase();
    let user = await userRepository.findByEmail(cleanIdentifier);
    if (!user) {
      user = await userRepository.findByUsername(cleanIdentifier);
    }

    if (!user) {
      res
        .status(401)
        .json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        });
      return;
    }

    const rawPassword = String(password);
    const trimmedPassword = rawPassword.trim();
    // Verify password against stored hash in the database
    const candidatePasswords = [rawPassword];
    if (trimmedPassword !== rawPassword) {
      candidatePasswords.push(trimmedPassword);
    }

    let isValid = false;
    let needsRehash = false;
    let verifiedPassword = rawPassword;

    if (user.passwordHash) {
      for (const pwd of candidatePasswords) {
        if (verifyPassword(pwd, user.passwordHash)) {
          isValid = true;
          verifiedPassword = pwd;
          // If user is on legacy global-salt format, schedule rehash to new per-user-salt format
          if (!user.passwordHash.includes(":")) {
            needsRehash = true;
          }
          break;
        }
      }
    }

    if (!isValid) {
      res
        .status(401)
        .json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        });
      return;
    }

    // Give applicants a useful status only after verifying credentials.
    if (user.role === "RESELLER" && user.resellerId) {
      const application = await resellerRepository.findById(user.resellerId);
      if (application?.status === "PENDING_APPROVAL") {
        res.status(403).json({
          success: false,
          error: {
            code: "RESELLER_PENDING_APPROVAL",
            message:
              "Your reseller application is awaiting admin approval. You can sign in after your unique reseller ID is assigned.",
          },
        });
        return;
      }
      if (application?.status === "INACTIVE" && application.rejectionReason) {
        res.status(403).json({
          success: false,
          error: {
            code: "RESELLER_APPLICATION_DENIED",
            message: `Your reseller application was not approved: ${application.rejectionReason}`,
          },
        });
        return;
      }
    }
    if (!user.isActive) {
      res
        .status(403)
        .json({
          success: false,
          error: {
            code: "ACCOUNT_DEACTIVATED",
            message:
              "This account has been deactivated. Please contact support.",
          },
        });
      return;
    }

    // Reseller accounts must be ACTIVE; pending applications cannot sign in
    if (user.role === "RESELLER") {
      const reseller = await resellerRepository.findById(user.resellerId || "");
      if (!reseller) {
        res.status(403).json({
          success: false,
          error: {
            code: "RESELLER_PROFILE_MISSING",
            message:
              "Reseller profile not found. Contact NexTech Administration.",
          },
        });
        return;
      }
      if (
        resellerCode &&
        reseller.resellerCode.toLowerCase() !== resellerCode.toLowerCase()
      ) {
        res.status(403).json({
          success: false,
          error: {
            code: "SUBDOMAIN_MISMATCH",
            message: "This reseller account does not belong to this portal.",
          },
        });
        return;
      }
      if (reseller.status === "PENDING_APPROVAL") {
        res.status(403).json({
          success: false,
          error: {
            code: "RESELLER_PENDING_APPROVAL",
            message:
              "Your reseller partner application is awaiting NexTech Administration approval. You will gain portal access once a unique reseller ID is assigned.",
          },
        });
        return;
      }
      if (reseller.status !== "ACTIVE") {
        res.status(403).json({
          success: false,
          error: {
            code: "RESELLER_NOT_ACTIVE",
            message: reseller.rejectionReason
              ? `Reseller application was not approved: ${reseller.rejectionReason}`
              : `Reseller status is currently: ${reseller.status}`,
          },
        });
        return;
      }
    }

    const loginUpdate: any = { lastLoginAt: new Date().toISOString() };
    // Transparently migrate legacy global-salt hashes to per-user-salt format on next login
    if (needsRehash) {
      loginUpdate.passwordHash = hashPassword(verifiedPassword);
    }
    await userRepository.update(user.id, loginUpdate);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        resellerId: user.resellerId,
        tokenVersion: user.tokenVersion ?? 0,
      },
      ENV.JWT_SECRET,
      { expiresIn: "30d" },
    );

    res.json({
      success: true,
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  }

  async getCurrentUser(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    if (!req.user) {
      res
        .status(401)
        .json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Not authenticated." },
        });
      return;
    }

    const user = await userRepository.findById(req.user.id);
    if (!user) {
      res
        .status(404)
        .json({
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User record not found." },
        });
      return;
    }

    let resellerData = null;
    if (user.role === "RESELLER" && user.resellerId) {
      resellerData = await resellerRepository.findById(user.resellerId);
    }

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        reseller: resellerData,
      },
    });
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res
        .status(401)
        .json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Not authenticated." },
        });
      return;
    }

    const { name, phone, addresses } = req.body;
    const updated = await userRepository.update(req.user.id, {
      name: name ? String(name).trim().slice(0, 100) : undefined,
      phone: phone ? String(phone).trim().slice(0, 20) : undefined,
      addresses: Array.isArray(addresses) ? addresses : undefined,
    });

    // Never return the passwordHash in profile responses
    res.json({
      success: true,
      data: updated ? sanitizeUser(updated as User) : null,
    });
  }

  async changePassword(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    if (!req.user || req.user.role !== "ADMIN") {
      res
        .status(403)
        .json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Administrator access is required.",
          },
        });
      return;
    }

    const { currentPassword, newPassword } = req.body || {};
    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      newPassword.length < 8 ||
      newPassword.length > 128
    ) {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "INVALID_PASSWORD",
            message:
              "Enter your current password and a new password of 8 to 128 characters.",
          },
        });
      return;
    }

    const user = await userRepository.findById(req.user.id);
    if (
      !user?.passwordHash ||
      !verifyPassword(currentPassword, user.passwordHash)
    ) {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "INCORRECT_PASSWORD",
            message: "Current password is incorrect.",
          },
        });
      return;
    }
    if (currentPassword === newPassword) {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "PASSWORD_UNCHANGED",
            message: "Choose a password different from your current one.",
          },
        });
      return;
    }

    await userRepository.update(user.id, {
      passwordHash: hashPassword(newPassword),
      passwordChangedAt: new Date().toISOString(),
      tokenVersion: (user.tokenVersion ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    });
    res.json({
      success: true,
      data: { message: "Password updated. Sign in with your new password." },
    });
  }

  /**
   * Public reseller partner application — creates PENDING_APPROVAL record for admin review.
   * Does not issue a session token until the application is approved.
   */
  async registerReseller(req: Request, res: Response): Promise<void> {
    try {
      const {
        username,
        email,
        password,
        phone,
        businessName,
        displayName,
        address,
        businessInformation,
      } = req.body;

      const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
      const cleanEmail = String(email || "")
        .toLowerCase()
        .trim();
      if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 254) {
        res
          .status(400)
          .json({
            success: false,
            error: {
              code: "INVALID_EMAIL",
              message: "A valid business email address is required.",
            },
          });
        return;
      }

      const result = await resellerService.applyAsReseller({
        username: String(username || ""),
        email: cleanEmail,
        password: String(password || ""),
        phone: String(phone || ""),
        businessName: String(businessName || ""),
        displayName: String(displayName || businessName || ""),
        address: address || {},
        businessInformation: businessInformation || {},
      });

      res.status(201).json({
        success: true,
        data: {
          message:
            "Reseller partner application submitted successfully. NexTech Administration has been notified and will review your KYC package. Portal access is granted after approval with your unique reseller ID.",
          status: "PENDING_APPROVAL",
          applicationId: result.reseller.id,
          businessName: result.reseller.businessName,
          email: result.reseller.email,
        },
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "RESELLER_APPLICATION_FAILED",
          message: err.message || "Unable to submit reseller application.",
        },
      });
    }
  }

  async googleAuth(req: Request, res: Response): Promise<void> {
    const { idToken } = req.body || {};
    if (!idToken || typeof idToken !== "string") {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Firebase ID token is required.",
          },
        });
      return;
    }

    let verified;
    try {
      const { getFirebaseAuth } = await import("../config/firebase.js");
      verified = await getFirebaseAuth().verifyIdToken(idToken);
    } catch {
      res
        .status(401)
        .json({
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Google authentication could not be verified.",
          },
        });
      return;
    }
    if (
      !verified.email ||
      !verified.email_verified ||
      verified.firebase.sign_in_provider !== "google.com"
    ) {
      res
        .status(403)
        .json({
          success: false,
          error: {
            code: "INVALID_GOOGLE_ACCOUNT",
            message: "A verified Google account is required.",
          },
        });
      return;
    }
    const cleanEmail = verified.email.toLowerCase().trim();
    const name = verified.name;
    const photoURL = verified.picture;
    let user = await userRepository.findByEmail(cleanEmail);

    if (!user) {
      // Any new account created via Google is strictly a CUSTOMER
      const userId = `user_${uuidv4()}`;
      const cleanUsername = cleanEmail.split("@")[0].replace(/[^a-z0-9_]/g, "");

      user = {
        id: userId,
        email: cleanEmail,
        role: "CUSTOMER",
        name: name ? name.trim() : cleanEmail.split("@")[0],
        username: cleanUsername,
        phone: "",
        addresses: [],
        avatar: photoURL || undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await userRepository.create(user);
      await walletService.getOrCreateWallet(userId);
    } else {
      if (user.role === "ADMIN") {
        res.status(403).json({ success: false, error: {
          code: "ADMIN_PASSWORD_REQUIRED", message: "Administrators must sign in with their account password.",
        } });
        return;
      }
      if (!user.isActive) {
        res
          .status(403)
          .json({
            success: false,
            error: {
              code: "ACCOUNT_DEACTIVATED",
              message:
                "This account has been deactivated. Please contact support.",
            },
          });
        return;
      }
      if (user.role === "RESELLER") {
        const reseller = await resellerRepository.findById(
          user.resellerId || "",
        );
        if (!reseller || reseller.status !== "ACTIVE") {
          res
            .status(403)
            .json({
              success: false,
              error: {
                code: "RESELLER_NOT_ACTIVE",
                message:
                  "Reseller account is awaiting approval or is inactive.",
              },
            });
          return;
        }
      }
      await userRepository.update(user.id, {
        lastLoginAt: new Date().toISOString(),
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        resellerId: user.resellerId,
        tokenVersion: user.tokenVersion ?? 0,
      },
      ENV.JWT_SECRET,
      { expiresIn: "30d" },
    );

    res.json({
      success: true,
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  }
}

export const authController = new AuthController();
