import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  id?: string;
  email: string;
  password?: string;
  name: string;
  role: "mentor" | "coordinator";
  institutionId?: string; // optional institution reference
  googleId?: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserResponse extends Omit<User, "password" | "_id"> {
  id: string;
}

export interface CreateUserInput {
  email: string;
  password?: string;
  name: string;
  role: "mentor" | "coordinator";
  institutionId?: string;
  googleId?: string;
  image?: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: "mentor" | "coordinator";
  password?: string;
  institutionId?: string | null;
  image?: string;
}
