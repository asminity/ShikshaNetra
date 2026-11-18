import { ObjectId } from "mongodb";

/** Optional profile details and preferences the user edits on /settings. */
export interface UserProfileFields {
  bio?: string;
  phone?: string;
  location?: string;
  organization?: string;
  preferences?: {
    defaultSubject?: string;
    defaultLanguage?: string;
  };
}

export interface User extends UserProfileFields {
  _id?: ObjectId;
  id?: string;
  email: string;
  password?: string;
  name: string;
  role: "Mentor" | "Coordinator" | "Institution Admin";
  institutionId?: string; // optional institution reference
  googleId?: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserResponse extends Omit<User, "password" | "_id"> {
  id: string;
}

export interface CreateUserInput extends Omit<UserProfileFields, "preferences"> {
  email: string;
  password?: string;
  name: string;
  role: "Mentor" | "Coordinator" | "Institution Admin";
  institutionId?: string;
  googleId?: string;
  image?: string;
}

export interface UpdateUserInput extends UserProfileFields {
  email?: string;
  name?: string;
  role?: "Mentor" | "Coordinator" | "Institution Admin";
  password?: string;
  institutionId?: string | null;
  image?: string;
}
