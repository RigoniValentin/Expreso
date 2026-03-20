import { Document } from "mongoose";
import { Query, Repository } from "./RepositoryTypes";
import { Roles } from "./RolesTypes";

export interface User extends Document {
  name: string;
  username: string;
  email: string;
  password: string;
  nationality: string;
  locality: string;
  age: number;
  avatar?: string;
  bio?: string;
  roles?: Roles[];
  permissions?: string[];
  subscription?: {
    transactionId: string;
    paymentDate: Date;
    expirationDate: Date;
  };
  couponUsed?: boolean;
  capSeresArte?: boolean;
  capThr?: boolean;
  capPhr?: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(password: string): Promise<boolean>;
  createdAt: Date;
}

export interface IUserRepository extends Repository<User> {
  findOne(query: Query): Promise<User | null>;
}

export interface IUserService {
  createUser(user: User): Promise<User>;
  findUsers(query?: Query): Promise<User[]>;
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserByResetToken(token: string): Promise<User | null>;
  updateUser(id: string, user: Partial<User>): Promise<User | null>;
  updateUserCapacitationsByEmail(
    email: string,
    capacitations: Pick<User, "capSeresArte" | "capThr" | "capPhr">
  ): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
  // Nuevo método para actualizar las capacitaciones usando el email del usuario
}
