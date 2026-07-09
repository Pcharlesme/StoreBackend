import express from "express";
import { getDb } from "../../config/dbconnect";
import { Response, Request } from "express";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { success } from "zod";

/// find specific user wih id
export const getUserbyId = async (req: Request, res: Response) => {
  try {
    const DB = getDb();
    const user = await DB.collection("user").findOne(
      { _id: new ObjectId(req.params.id as string) },
      {
        projection: {
          password: 0,
        },
      },
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "request received",
      user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server failed",
    });
  }
};
