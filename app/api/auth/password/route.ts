import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { getUserById, updateUser } from "@/lib/models/User";
import { hashPassword, verifyPassword } from "@/lib/utils/password";
import { validatePassword } from "@/lib/validators/auth";

/**
 * POST /api/auth/password - change (or, for Google-only accounts, set) the user's password.
 * Body: { currentPassword?: string; newPassword: string }
 */
export async function POST(request: NextRequest) {
  const authUser = authMiddleware(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { currentPassword, newPassword } = body || {};

  if (typeof newPassword !== "string" || !validatePassword(newPassword)) {
    return NextResponse.json(
      { error: "New password needs at least 8 characters, with an uppercase letter, a lowercase letter and a number" },
      { status: 400 }
    );
  }

  const user = await getUserById(authUser.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Accounts that already have a password must prove they know it.
  // Google-only accounts have none yet, so they can set one directly.
  if (user.password) {
    if (typeof currentPassword !== "string" || !currentPassword) {
      return NextResponse.json({ error: "Enter your current password" }, { status: 400 });
    }
    if (!(await verifyPassword(currentPassword, user.password))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    if (await verifyPassword(newPassword, user.password)) {
      return NextResponse.json({ error: "New password must be different from the current one" }, { status: 400 });
    }
  }

  await updateUser(authUser.id, { password: await hashPassword(newPassword) });

  return NextResponse.json({ success: true, message: user.password ? "Password changed" : "Password set" });
}
