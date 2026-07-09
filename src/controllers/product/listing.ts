import express from "express";
import { getDb } from "../../config/dbconnect";
import { Response, Request } from "express";
import { ObjectId } from "mongodb";
import { success, ZodError } from "zod";
import {
  listingSchema,
  listingStatusSchema,
  updateListingSchema,
} from "../../schemas/auth/product_schema";

// add new lisiting
export const createListing = async (req: Request, res: Response) => {
  try {
    const DB = getDb();
    const payload = listingSchema.parse(req.body);
    const product = {
      ...payload,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const data = await DB.collection("products").insertOne(product);
    return res.status(201).json({
      success: true,
      message: "Product created",
      id: data.insertedId,
      status: "ACTIVE",
      title: payload.title,
      type: payload.type,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(404).json({
        success: false,
        message: "invalid character",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server failed",
    });
  }
};

// update lisiting
export const updateListing = async (req: Request, res: Response) => {
  try {
    const DB = getDb();
    const payload = updateListingSchema.parse(req.body);
    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }
    const result = await DB.collection("products").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { ...payload, updatedAt: new Date() },
      },
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: " Product updated successfully",
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(404).json({
        success: false,
        message: "invalid character",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server failed",
    });
  }
};
//getListing by id
export const getListingbyId = async (req: Request, res: Response) => {
  try {
    const DB = getDb();
    const id = req.params.id as string;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }
    const data = await DB.collection("products").findOne({
      _id: new ObjectId(id),
    });
    // no product found
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }
    // success response
    return res.status(200).json({
      success: true,
      message: "Listing retrieved successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server failed",
    });
  }
};

//delete Listing by id
export const deleteListing = async (req: Request, res: Response) => {
  try {
    const DB = getDb();
    const id = req.params.id as string;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }
    const data = await DB.collection("products").deleteOne({
      _id: new ObjectId(id),
    });
    if (data.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }
    // success response
    return res.status(200).json({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server failed",
    });
  }
};

//update listing status
export const updateListingStatus = async (req: Request, res: Response) => {
  try {
    const DB = getDb();
    const id = req.params.id as string;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Listing not found",
      });
    }
    const payload = listingStatusSchema.parse(req.body);
    const result = await DB.collection("products").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: payload,
        updatedAt: new Date(),
      },
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Listing id  not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Listing update successfully",
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(404).json({
        success: false,
        message: "invalid character",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server failed",
    });
  }
};

//find all product 
export const findListing=()=> {
    try{

    }catch(err){

    }
}