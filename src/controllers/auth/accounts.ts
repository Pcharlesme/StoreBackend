import express from "express";
import { getDb } from "../../config/dbconnect";
import { Response, Request } from "express";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { success, ZodError } from "zod";
import { authSchemaType } from "../../schemas/auth/auth_schema";

export const userlogin = async (req: Request, res: Response) => {
  try {
    const DB = getDb();
    const { email, password } = req.body;
    const user = await DB.collection("user").findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User doesn't exist ! Register",
      });
    }
    const isPassword = await bcrypt.compare(password, user?.password);
    if (!isPassword) {
      return res.status(404).json({
        success: false,
        message: "Invalid Password",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Login succesffully",
      user: {
        id: user?._id,
        email: user?.email,
      },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: " invalid paras",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server failed",
    });
  }
};

// ========Create Account ============/



export const createAccount = async (req: Request, res: Response) => {
  try {
    const DB = getDb()
    const payload = authSchemaType.parse(req.body);
    const isUser = await DB.collection("user")

  } catch (err) {}
};
