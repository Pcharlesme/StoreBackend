import express from "express";
import { getDb } from "../../config/dbconnect";
import { Response, Request } from "express";
import { ObjectId } from "mongodb";
import { profileSchemaType } from "../../schemas/auth/auth_schema";
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
    const id = req.params.id as string;
    const payload = profileSchemaType.parse(req.body);

    if (!ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Invalid userID",
      });
    }

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
    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const DB = getDb();

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
    return res.status(500).json({
      success: false,
      message: "Server failed",
    });
  }
};

//delete user

export const deleteUser = async (request: Request, response: Response) => {
  try {
    const DB = getDb();
    const userid = request.params.id as string;

    if (!ObjectId.isValid(userid)) {
      return response.status(400).json({
        success: false,
        message: "Id not valid",
      });
    }
    const data = await DB.collection("users").deleteOne({
      _id: new ObjectId(userid),
    });

    if (data.deletedCount === 0) {
      return response.status(404).json({
        success: false,
        message: "Account not valid",
      });
    }
    return response.status(202).json({
      success: true,
      message: "Account Deleted",
    });
  } catch (err) {
    return response.status(500).json({
      success: false,
      message: " server failed",
    });
  }
};
