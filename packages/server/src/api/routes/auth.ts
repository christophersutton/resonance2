import { Hono } from "hono";
import { UserRepository } from "../../db/repositories/user";
import { randomBytes } from "crypto";
import FormData from "form-data";
import Mailgun from "mailgun.js";
import { config } from "../../config";
import { generateAuthToken } from "../../middleware/auth";
import type { AuthUser } from "../../middleware/auth";

export function authRoutes(userRepo: UserRepository) {
  const app = new Hono();

  // POST /login - Send magic link
  app.post("/login", async (c) => {
    const body = await c.req.json();
    console.log('Login request body:', body);
    const { email } = body;
    console.log('Extracted email:', email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: "Invalid email address" }, 400);
    }

    // Find or create user
    let user = await userRepo.findByEmail(email);
    if (!user) {
      user = await userRepo.createUser(email);
    }

    // Generate magic link token
    const token = randomBytes(32).toString("hex");
    await userRepo.setMagicLinkToken(email, token);

    // Send magic link email via Mailgun
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: 'api',
      key: config.auth.mailgun.apiKey
    });

    try {
      await mg.messages.create(config.auth.mailgun.domain, {
        from: `Resonance <noreply@${config.auth.mailgun.domain}>`,
        to: [email],
        subject: "Your Magic Link",
        text: `Click this link to log in: ${config.auth.appUrl}/auth/verify?token=${token}\n\nThis link will expire in 30 minutes.`
      });

      return c.json({ message: "Magic link sent" });
    } catch (error) {
      console.error('Failed to send magic link:', error);
      return c.json({ error: "Failed to send magic link" }, 500);
    }
  });

  // GET /verify - Verify magic link token
  app.get("/verify", async (c) => {
    const token = c.req.query("token");
    if (!token) {
      return c.json({ error: "Token is required" }, 400);
    }

    const user = await userRepo.findByMagicLinkToken(token);
    if (!user) {
      return c.json({ error: "Invalid or expired token" }, 400);
    }

    // Clear the magic link token and update last login
    await userRepo.clearMagicLinkToken(user.id);
    await userRepo.updateLastLogin(user.id);

    // Generate JWT token
    const authToken = await generateAuthToken(user as AuthUser);

    // Return the token
    return c.json({ 
      token: authToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  });

  // POST /logout - Log out
  app.post("/logout", (c) => {
    // Client should handle clearing the token
    return c.json({ success: true });
  });

  // GET /me - Get current user
  app.get("/me", (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    return c.json({ user });
  });

  return app;
}
