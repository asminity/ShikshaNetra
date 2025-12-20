import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  id?: string;
  email: string;
  password?: string;
  name: string;
<<<<<<< HEAD
  role: "mentor" | "coordinator";
  institutionId?: string; // optional institution reference
  googleId?: string;
  image?: string;
=======
  role: "Mentor" | "Coordinator" | "Institution Admin";
  institutionId?: string; // For mentors/coordinators: their institution. For Institution Admins: their own ID
>>>>>>> ac6133de4ade2dd45bad8a9bcaf4a9e19f4f3b81
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
  role: "Mentor" | "Coordinator" | "Institution Admin";
  institutionId?: string;
  googleId?: string;
  image?: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: "Mentor" | "Coordinator" | "Institution Admin";
  password?: string;
  institutionId?: string | null;
  image?: string;
}
