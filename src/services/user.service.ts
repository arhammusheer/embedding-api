import { User } from "@prisma/client";
import { prisma } from "../app";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export default class UserService {
  jwt_token: string;

  constructor(id: string) {
    this.jwt_token = this.generateToken(id);
  }

  get token(): string {
    if (!this.jwt_token) {
      this.jwt_token = this.generateToken(this.jwt_token);
    }

    return this.jwt_token;
  }

  generateToken(id: string): string {
    const token = jwt.sign({ id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    return token;
  }

  public static async verifyCredentials(
    email: string,
    password: string
  ): Promise<UserService | null> {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const u = new UserService(user.id);

    return u;
  }

  public static async registerUser(
    email: string,
    password: string
  ): Promise<UserService | null> {
    const userExists = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (userExists) {
      return null;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const u = new UserService(user.id);

    return u;
  }
}
