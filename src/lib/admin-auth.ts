// Simple admin authentication for development
// Replace with proper auth (NextAuth, Clerk, etc.) for production

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Environment-based admin credentials
// In production, use proper auth system
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'taskforce2024';
const AUTH_COOKIE_NAME = 'tft_admin_auth';
const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret-change-in-production';

// Simple token generation (use JWT in production)
function generateToken(username: string): string {
  const payload = {
    username,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  // In production, use proper JWT signing
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyToken(token: string): { valid: boolean; username?: string } {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (payload.exp < Date.now()) {
      return { valid: false };
    }
    return { valid: true, username: payload.username };
  } catch {
    return { valid: false };
  }
}

// Login function
export async function adminLogin(username: string, password: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken(username);
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });
    return { success: true };
  }
  return { success: false, error: 'Invalid credentials' };
}

// Logout function
export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

// Check if authenticated (for server components)
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyToken(token).valid;
}

// Get current admin user
export async function getAdminUser(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const result = verifyToken(token);
  return result.valid ? result.username || null : null;
}

// Middleware helper for API routes
export function withAdminAuth(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token || !verifyToken(token).valid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(req);
  };
}

// Middleware for protecting admin routes
export function adminAuthMiddleware(request: NextRequest): NextResponse | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  if (!token || !verifyToken(token).valid) {
    if (!isLoginPage) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  } else if (isLoginPage) {
    // Already logged in, redirect to dashboard
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return null;
}
