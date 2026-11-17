import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { getUserById, updateUser } from "@/lib/models/User";
import type { User, UpdateUserInput } from "@/lib/types/user";

/** The user as the client sees it: no password hash, plus flags the settings page needs. */
function toClientUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    institutionId: user.institutionId,
    image: user.image ?? "",
    bio: user.bio ?? "",
    phone: user.phone ?? "",
    location: user.location ?? "",
    organization: user.organization ?? "",
    preferences: {
      defaultSubject: user.preferences?.defaultSubject ?? "",
      defaultLanguage: user.preferences?.defaultLanguage ?? "",
    },
    hasPassword: !!user.password,
    hasGoogle: !!user.googleId,
    createdAt: user.createdAt,
  };
}

// GET /api/auth/me - returns the authenticated user's latest data
export async function GET(request: NextRequest) {
  const authUser = authMiddleware(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserById(authUser.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(toClientUser(user), { status: 200 });
}

// Editable text fields and their maximum lengths.
const TEXT_LIMITS = {
  name: 80,
  bio: 300,
  phone: 20,
  location: 80,
  organization: 120,
} as const;

/**
 * PATCH /api/auth/me - update the authenticated user's own profile and preferences.
 * Email, role and institution are not editable here.
 */
export async function PATCH(request: NextRequest) {
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

  const updates: UpdateUserInput = {};

  for (const [field, max] of Object.entries(TEXT_LIMITS) as [keyof typeof TEXT_LIMITS, number][]) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== "string") {
      return NextResponse.json({ error: `${field} must be text` }, { status: 400 });
    }
    const value = body[field].trim();
    if (value.length > max) {
      return NextResponse.json({ error: `${field} must be at most ${max} characters` }, { status: 400 });
    }
    updates[field] = value;
  }

  if (updates.name !== undefined && updates.name.length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  }
  if (updates.phone && !/^\+?[0-9\s\-()]{7,20}$/.test(updates.phone)) {
    return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
  }

  if (body.image !== undefined) {
    if (typeof body.image !== "string") {
      return NextResponse.json({ error: "image must be a URL" }, { status: 400 });
    }
    const image = body.image.trim();
    if (image) {
      let url: URL;
      try {
        url = new URL(image);
      } catch {
        return NextResponse.json({ error: "Profile picture must be a valid URL" }, { status: 400 });
      }
      if (url.protocol !== "https:") {
        return NextResponse.json({ error: "Profile picture URL must start with https://" }, { status: 400 });
      }
      if (image.length > 1000) {
        return NextResponse.json({ error: "Profile picture URL is too long" }, { status: 400 });
      }
    }
    updates.image = image;
  }

  if (body.preferences !== undefined) {
    const prefs = body.preferences;
    if (typeof prefs !== "object" || prefs === null) {
      return NextResponse.json({ error: "preferences must be an object" }, { status: 400 });
    }
    const clean = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 80) : "");
    updates.preferences = {
      defaultSubject: clean(prefs.defaultSubject),
      defaultLanguage: clean(prefs.defaultLanguage),
    };
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await updateUser(authUser.id, updates);
  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(toClientUser(updated), { status: 200 });
}
