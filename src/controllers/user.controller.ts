import { Request, Response } from "express";
import UserService from "../services/user.service";

const userController = {
  login: async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await UserService.verifyCredentials(email, password);

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid credentials",
      });
    }

    const bearerToken = `Bearer ${user.token}`;

    // Set Cookie
    res.cookie("token", bearerToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      status: "success",
      data: {
        token: user.token,
      },
    });
  },

  register: async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await UserService.registerUser(email, password);

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "User already exists",
      });
    }

    const bearerToken = `Bearer ${user.token}`;

    // Set Cookie
    res.cookie("token", bearerToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      status: "success",
      data: {
        token: user.token,
      },
    });
  },

  logout: async (req: Request, res: Response) => {
    res.clearCookie("token");
    res.status(200).json({
      status: "success",
    });
  },

  isLoggedIn: async (req: Request, res: Response) => {
    res.status(200).json({
      status: "success",
      data: {
        user: req.user,
      },
    });
  },
};

export default userController;
