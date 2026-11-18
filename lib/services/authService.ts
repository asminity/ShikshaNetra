import { createUser, getUserByEmail } from "@/lib/models/User";
import { createInstitution } from "@/lib/models/Institution";
import { hashPassword, verifyPassword } from "@/lib/utils/password";
import { UserResponse } from "@/lib/types/user";

/** Optional details a user may provide at signup. Empty strings are dropped. */
export interface SignupProfile {
  phone?: string;
  location?: string;
  organization?: string;
  image?: string;
  institutionName?: string;
}

function clean(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: "Mentor" | "Coordinator" | "Institution Admin" = "Mentor",
  profile: SignupProfile = {}
): Promise<UserResponse> {
  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // If role is Institution Admin, create institution first
  let institutionId: string | undefined;
  if (role === "Institution Admin") {
    console.log("Creating institution for admin", { adminEmail: email, adminName: name });
    const institution = await createInstitution({
      // Prefer the explicit institution name; fall back to organization, then the admin's name
      name: clean(profile.institutionName) || clean(profile.organization) || name,
      userIds: [],
    });
    institutionId = institution.id;
    console.log("Institution created successfully", { institutionId, institutionName: institution.name });
  }

  // Create user
  const user = await createUser({
    email,
    password: hashedPassword,
    name,
    role,
    institutionId,
    phone: clean(profile.phone),
    location: clean(profile.location),
    organization:
      clean(profile.organization) ||
      (role === "Institution Admin" ? clean(profile.institutionName) : undefined),
    image: clean(profile.image),
  });

  console.log("User created", { 
    userId: user.id, 
    email: user.email, 
    role: user.role,
    institutionId: user.institutionId 
  });

  return user;
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<UserResponse> {
  // Find user
  const user = await getUserByEmail(email);
  if (!user || !user.id) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  if (!user.password) {
      // User likely signed up with Google/OAuth and has no password set
      throw new Error("Please log in with Google");
  }
  
  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Return user without password
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    institutionId: user.institutionId,
    image: user.image,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
