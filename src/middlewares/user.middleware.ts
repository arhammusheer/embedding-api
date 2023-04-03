import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import UserService from "../services/user.service";

declare global {
  namespace Express {
    interface Request {
      user: UserService;
    }
  }
}

export const userMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Get the token from the Authorization header

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // Verify the token using the secret key
    const id = (decoded as jwt.JwtPayload).id; // Get the user id from the decoded token
    req.user = new UserService(id); // Add the decoded token to the request object
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
