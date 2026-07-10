import express from "express";
import { getDb } from "../../config/dbconnect";
import { Response, Request } from "express";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { success, ZodError } from "zod";
import { authSchemaType } from "../../schemas/auth/auth_schema";
import { generateAccessToken } from "../../utils/jwtHelper";

export const userlogin = async (req: Request, res: Response) => {
  try {
    const DB = getDb();
    const { email, password } = req.body;
    const user = await DB.collection("user").findOne({ email });
    console.log("Email from request:", email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPassword = await bcrypt.compare(password, user.password);
    if (!isPassword) {
      return res.status(404).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    //generate jwttokken 
    const accessToken = generateAccessToken(user._id.toString(), user.role);

    return res.status(200).json({
      success: true,
      message: "Login succesffully",
      accessToken,
      user: {
        id: user._id,
        email: user.email,
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
    const DB = getDb();
    const payload = authSchemaType.parse(req.body);
    const isUser = await DB.collection("user").findOne({
      email: payload.email,
    });
    if (isUser) {
      return res.status(404).json({
        success: false,
        message: "Account exist already",
      });
    }
    const hashedPassword = await bcrypt.hash(payload.password, 13);
    const user = {
      ...payload,
      password: hashedPassword,
      createdAt: new Date(),
    };
    const data = await DB.collection("user").insertOne(user);
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(404).json({
        success: false,
        message: "Invalid Parameer",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server failed",
    });
  }
};
