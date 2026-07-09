import express from "express";
import { getDb } from "../../config/dbconnect";
import { Response, Request } from "express";
import { ObjectId } from "mongodb";


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
    if (!ObjectId.isValid(req.params.id as string)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

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
