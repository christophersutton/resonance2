import type { Context, Next } from "hono";
import { sign, verify } from "hono/jwt";
import { config } from "../config";
import { type User } from "../../../shared/src/types/entities";

// Extend the shared User type to include string indexing
export type AuthUser = User & {
    [key: string]: string | number | undefined;
}

declare module 'hono' {
    interface ContextVariableMap {
        user: AuthUser | null;
    }
}

export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        try {
            const payload = await verify(token, config.auth.jwtSecret);
            c.set('user', payload as AuthUser);
        } catch {
            c.set('user', null);
        }
    } else {
        c.set('user', null);
    }
    
    await next();
}

export async function requireAuth(c: Context, next: Next) {
    const user = c.get('user');
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    await next();
}

export async function generateAuthToken(user: AuthUser): Promise<string> {
    return await sign(user, config.auth.jwtSecret);
}
