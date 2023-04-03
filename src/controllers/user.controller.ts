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

    res.status(200).json({
      status: "success",
      data: {
        token: user.token,
      },
    });
  },
};

export default userController;