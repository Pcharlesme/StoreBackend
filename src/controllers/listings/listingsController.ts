import { Request, Response } from "express";
import { Filter, ObjectId, WithId } from "mongodb";
import { Collections, getDb } from "../../config/db";
import { deleteImagesSafely, uploadImage, withSignedImageUrls } from "../../config/s3";
import {
  createListingSchema,
  listingQuerySchema,
  listingStatusSchema,
  updateListingSchema,
} from "../../schemas/listing";
import { HttpError } from "../../utils/httpError";
import { AuthUser } from "../../utils/jwt";
import { parseObjectId } from "../../utils/objectId";

interface Listing {
  ownerId: ObjectId;
  images: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  [field: string]: unknown;
}

const listings = () => getDb().collection<Listing>(Collections.listings);

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ===== Authorization =====

/** Loads a listing and verifies the caller may modify it (owner or ADMIN). */
const findModifiableListing = async (rawId: unknown, user: AuthUser) => {
  const listing = await listings().findOne({ _id: parseObjectId(rawId, "listing id") });

  if (!listing) throw HttpError.notFound("Listing not found");

  if (user.role !== "ADMIN" && !listing.ownerId.equals(user.id)) {
    throw HttpError.forbidden("You can only modify your own listings");
  }

  return listing;
};

// ===== Public =====

/** GET /listings and GET /listings/search. Both return paginated ACTIVE listings. */
export const getActiveListings = async (req: Request, res: Response) => {
  const { page, limit, search } = listingQuerySchema.parse(req.query);

  const filter: Filter<Listing> = { status: "ACTIVE" };
  if (search) {
    // User input is escaped so it matches literally instead of being run as a regex (ReDoS)
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ title: pattern }, { description: pattern }, { category: pattern }];
  }

  const [docs, total] = await Promise.all([
    listings()
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    listings().countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: await Promise.all(docs.map(withSignedImageUrls)),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
};

export const getListingById = async (req: Request, res: Response) => {
  const listing = await listings().findOne({ _id: parseObjectId(req.params.id, "listing id") });

  if (!listing) throw HttpError.notFound("Listing not found");

  res.status(200).json({ success: true, data: await withSignedImageUrls(listing) });
};

// ===== Authenticated =====

export const getMyListings = async (req: Request, res: Response) => {
  const docs = await listings()
    .find({ ownerId: parseObjectId(req.user!.id) })
    .sort({ createdAt: -1 })
    .toArray();

  res.status(200).json({
    success: true,
    count: docs.length,
    data: await Promise.all(docs.map(withSignedImageUrls)),
  });
};

export const createListing = async (req: Request, res: Response) => {
  // Validate before uploading so bad requests never leave objects behind in S3
  const payload = createListingSchema.parse(req.body);
  const files = req.files as Express.Multer.File[];

  const images = await Promise.all(files.map(uploadImage));

  const now = new Date();
  const listing: Listing = {
    ...payload,
    images,
    status: "ACTIVE",
    ownerId: parseObjectId(req.user!.id),
    createdAt: now,
    updatedAt: now,
  };

  try {
    const { insertedId } = await listings().insertOne(listing);
    res.status(201).json({
      success: true,
      message: "Listing created",
      data: await withSignedImageUrls({ _id: insertedId, ...listing }),
    });
  } catch (error) {
    await deleteImagesSafely(images);
    throw error;
  }
};

export const updateListing = async (req: Request, res: Response) => {
  const payload = updateListingSchema.parse(req.body);
  const listing = await findModifiableListing(req.params.id, req.user!);

  const updated = await listings().findOneAndUpdate(
    { _id: listing._id },
    { $set: { ...payload, updatedAt: new Date() } },
    { returnDocument: "after" },
  );

  res.status(200).json({
    success: true,
    message: "Listing updated successfully",
    data: await withSignedImageUrls(updated as WithId<Listing>),
  });
};

export const updateListingStatus = async (req: Request, res: Response) => {
  const { status } = listingStatusSchema.parse(req.body);
  const listing = await findModifiableListing(req.params.id, req.user!);

  await listings().updateOne({ _id: listing._id }, { $set: { status, updatedAt: new Date() } });

  res.status(200).json({
    success: true,
    message: "Listing status updated successfully",
    data: { id: listing._id, status },
  });
};

export const deleteListing = async (req: Request, res: Response) => {
  const listing = await findModifiableListing(req.params.id, req.user!);

  await listings().deleteOne({ _id: listing._id });
  await deleteImagesSafely(listing.images ?? []);

  res.status(200).json({ success: true, message: "Listing deleted successfully" });
};
