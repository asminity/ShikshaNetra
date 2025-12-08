import { createUser, getUserByEmail } from "@/lib/models/User";
import { hashPassword, verifyPassword } from "@/lib/utils/password";
import { UserResponse } from "@/lib/types/user";

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: "mentor" | "coordinator" = "mentor"
): Promise<UserResponse> {
  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await createUser({
    email,
    password: hashedPassword,
    name,
    role,
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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
