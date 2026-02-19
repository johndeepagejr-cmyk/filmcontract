import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { getUserByEmail, getUserByOpenId, upsertUser } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

function buildUserResponse(user: any) {
  return {
    id: user?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
    userRole: user?.userRole ?? null,
  };
}

export function registerEmailAuthRoutes(app: Express) {
  // Register with email/password
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters" });
        return;
      }

      // Check if user already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        // If the existing user was created via OAuth and has no password, link the account
        if (!existingUser.passwordHash) {
          const passwordHash = await bcrypt.hash(password, 12);
          const db = await getDb();
          if (db) {
            await db.update(users).set({
              passwordHash,
              loginMethod: "email",
              name: name || existingUser.name,
              lastSignedIn: new Date(),
            }).where(eq(users.id, existingUser.id));
          }
          // Create session for the linked account
          const sessionToken = await sdk.createSessionToken(existingUser.openId, {
            name: name || existingUser.name || "",
            expiresInMs: ONE_YEAR_MS,
          });
          const cookieOptions = getSessionCookieOptions(req);
          res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          res.json({
            app_session_id: sessionToken,
            user: buildUserResponse(existingUser),
          });
          return;
        }
        res.status(409).json({ error: "An account with this email already exists" });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Generate a unique openId for this user (for compatibility with existing system)
      const openId = `email_${crypto.randomUUID()}`;

      // Create user in database
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      await db.insert(users).values({
        openId,
        name: name || null,
        email,
        passwordHash,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      // Get the created user
      const user = await getUserByOpenId(openId);
      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie for web
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Return session token and user info
      res.json({
        app_session_id: sessionToken,
        user: buildUserResponse(user),
      });
    } catch (error) {
      console.error("[Auth] Register failed:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Refresh session token
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

      if (!token) {
        res.status(401).json({ error: "No token provided" });
        return;
      }

      // Verify current token
      let session;
      try {
        session = await sdk.verifySession(token);
      } catch {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
      }

      const openId = session?.openId;
      if (!openId) {
        res.status(401).json({ error: "Invalid session" });
        return;
      }

      // Get user
      const user = await getUserByOpenId(openId);
      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      // Issue new token
      const newToken = await sdk.createSessionToken(openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie for web
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, newToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        app_session_id: newToken,
        user: buildUserResponse(user),
      });
    } catch (error) {
      console.error("[Auth] Token refresh failed:", error);
      res.status(500).json({ error: "Token refresh failed" });
    }
  });

  // Login with email/password
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      // Find user by email
      const user = await getUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Check password
      if (!user.passwordHash) {
        // OAuth user trying to login with email/password — set their password
        const passwordHash = await bcrypt.hash(password, 12);
        const db = await getDb();
        if (db) {
          await db.update(users).set({ passwordHash, loginMethod: "email" }).where(eq(users.id, user.id));
        }
        // Password is now set, proceed with login
      } else {
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          res.status(401).json({ error: "Invalid email or password" });
          return;
        }
      }

      // Update last signed in
      const db = await getDb();
      if (db) {
        await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie for web
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Return session token and user info
      res.json({
        app_session_id: sessionToken,
        user: buildUserResponse(user),
      });
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
}
