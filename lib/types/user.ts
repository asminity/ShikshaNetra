import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  id?: string;
  email: string;
  password: string;
  name: string;
  role: "Mentor" | "Coordinator" | "Institution Admin";
  institutionId?: string; // For mentors/coordinators: their institution. For Institution Admins: their own ID
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserResponse extends Omit<User, "password" | "_id"> {
  id: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: "Mentor" | "Coordinator" | "Institution Admin";
  institutionId?: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: "Mentor" | "Coordinator" | "Institution Admin";
  password?: string;
  institutionId?: string | null;
}
