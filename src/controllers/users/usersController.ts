import express from "express";
import { getDb } from "../../config/dbconnect";
import { Response, Request } from "express";
import { ObjectId } from "mongodb";
import {
  profileSchemaType,
  updateProfileSchema,
} from "../../schemas/auth/auth_schema";
import { success, ZodError } from "zod";

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

// update user Profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const DB = getDb();
    const id = req.user!.id;
    const payload = updateProfileSchema.parse(req.body);
    const data = await DB.collection("user").updateOne(
      { _id: new ObjectId(id) },
      { $set: payload },
    );
    if (data.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(201).json({
      success: true,
      message: "User Profile Updated successfully",
      data,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid character",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

//get user
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const id = req.user!.id;
    const DB = getDb();
    console.log("User:", req.user);
    console.log("ID:", id);

    const data = await DB.collection("user").findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          password: 0,
        },
      },
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server failed",
      error: err,
    });
  }
};

//delete user

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const DB = getDb();
    const id = req.user!.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Id not valid",
      });
    }
    const data = await DB.collection("user").deleteOne({
      _id: new ObjectId(id),
    });

    if (data.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Account not valid",
      });
    }
    return res.status(202).json({
      success: true,
      message: "Account Deleted",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: " server failed",
    });
  }
};
