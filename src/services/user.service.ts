import { User } from "@prisma/client";
import { prisma } from "../app";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import NamespaceService from "./namespaces.service";
import { generateSlug } from "../utils/utils";

export default class UserService {
  jwt_token: string;
  id: string;
  user: User;

  constructor(id: string) {
    this.jwt_token = this.generateToken(id);
    this.id = id;

    const u = prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!u) {
      throw new Error("User not found");
    }

    this.user = u as unknown as User;
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

  async getNamespaces() {
    const namespaces = NamespaceService.getNamespaces(this.id);
    return namespaces;
  }

  async createNamespace(name: string) {
    const namespace = await NamespaceService.createNamespace({
      name,
      slug: generateSlug(name),
      user: {
        connect: {
          id: this.id,
        },
      },
    });

    return namespace;
  }

  async deleteNamespace(id: string) {
    const ownershipCheck = await NamespaceService.doesUserOwnNamespace(
      this.id,
      id
    );

    if (!ownershipCheck) {
      throw new Error("User does not own this namespace");
    }

    const namespace = await NamespaceService.deleteNamespace(id);
    return namespace;
  }

  async getNamespaceById(id: string) {
    const ownership = await NamespaceService.doesUserOwnNamespace(this.id, id);

    if (!ownership) {
      throw new Error("User does not own this namespace");
    }

    const namespace = await NamespaceService.getNamespaceById(id);
    return namespace;
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
