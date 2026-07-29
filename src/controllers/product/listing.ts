import express from "express";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getDb } from "../../config/dbconnect";
import { Response, Request } from "express";
import { ObjectId } from "mongodb";
import { regex, success, ZodError } from "zod";
import {
  listingSchema,
  listingStatusSchema,
  updateListingSchema,
} from "../../schemas/auth/product_schema";
import { uploadToS3 } from "../../config/s3bucket";
import { getImageUrl } from "../../config/preSignerHelper";

// add new lisiting
export const createListing = async (req: Request, res: Response) => {
  try {
    const DB = getDb();

    // console.log(req.body);
    // console.log(req.files);

    req.body.price = Number(req.body.price);
    req.body.location = JSON.parse(req.body.location);
    const payload = listingSchema.parse(req.body);
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Images required",
      });
    }
    const imageUrls = await Promise.all(files.map(uploadToS3));
    const product = {
      ...payload,
      images: imageUrls,
      status: "ACTIVE",
      ownerId: new ObjectId(req.user!.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await DB.collection("products").insertOne(product);

    return res.status(201).json({
      success: true,
      message: "Product created",
    });
  } catch (error) {
    console.log(error);

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
    const id = req.user!.id;
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

//getMyLisiting
export const getMyListings = async (req: Request, res: Response) => {
  try {
    const DB = getDb();
    const listings = await DB.collection("products")
      .find({
        ownerId: new ObjectId(req.user!.id),
      })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      count: listings.length,
      data: listings,
    });
  } catch {
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
        $set: {
          ...payload,
          updatedAt: new Date(),
        },
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
      return res.status(400).json({
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
export const findListing = async (req: Request, res: Response) => {
  try {
    const DB = getDb();

    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Fetch listings from MongoDB
    const listings = await DB.collection("products")
      .find({ status: "ACTIVE" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Convert every stored S3 key into a temporary presigned URL
    const data = await Promise.all(
      listings.map(async (listing) => ({
        ...listing,
        images: await Promise.all(
          listing.images.map((key: string) => getImageUrl(key)),
        ),
      })),
    );

    const total = await DB.collection("products").countDocuments({
      status: "ACTIVE",
    });

    return res.status(200).json({
      success: true,
      message: "Listing retrieve successfully",
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server failed",
    });
  }
};

//search listing
export const searchListing = async (req: Request, res: Response) => {
  try {
    const DB = getDb();

    const search = (req.query.search as string) || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query: any = {
      status: "ACTIVE",
    };

    if (search) {
      query.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
        {
          category: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }
    // Get listings from MongoDB
    const listings = await DB.collection("products")
      .find(query)
      .skip(skip)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    if (listings.length === 0) {
      return res.json({
        success: true,
        message: "No search found and another product",
      });
    }

    // Convert S3 keys into temporary presigned URLs
    const data = await Promise.all(
      listings.map(async (listing) => ({
        ...listing,
        images: await Promise.all(
          listing.images.map((key: string) => getImageUrl(key)),
        ),
      })),
    );

    return res.status(200).json({
      success: true,
      message: "Item found",
      limit,
      skip,
      count: data.length,
      data,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server failed",
    });
  }
};