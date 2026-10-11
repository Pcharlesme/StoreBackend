import { Request, Response } from "express";
import { Collections, getDb } from "../../config/db";
import { deleteImagesSafely } from "../../config/s3";
import { updateProfileSchema } from "../../schemas/auth";
import { HttpError } from "../../utils/httpError";
import { parseObjectId } from "../../utils/objectId";

// Contact details (email, phone, address) are only visible to the account owner
const PUBLIC_PROFILE_PROJECTION = {
  fullname: 1,
  "location.city": 1,
  "location.country": 1,
  createdAt: 1,
} as const;

export const getPublicProfile = async (req: Request, res: Response) => {
  const id = parseObjectId(req.params.id, "user id");

  const user = await getDb()
    .collection(Collections.users)
    .findOne({ _id: id }, { projection: PUBLIC_PROFILE_PROJECTION });

  if (!user) throw HttpError.notFound("User not found");

  res.status(200).json({ success: true, data: user });
};

export const getMyProfile = async (req: Request, res: Response) => {
  const user = await getDb()
    .collection(Collections.users)
    .findOne({ _id: parseObjectId(req.user!.id) }, { projection: { password: 0 } });

  if (!user) throw HttpError.notFound("User not found");

  res.status(200).json({ success: true, data: user });
};

export const updateMyProfile = async (req: Request, res: Response) => {
  const payload = updateProfileSchema.parse(req.body);

  const user = await getDb()
    .collection(Collections.users)
    .findOneAndUpdate(
      { _id: parseObjectId(req.user!.id) },
      { $set: { ...payload, updatedAt: new Date() } },
      { returnDocument: "after", projection: { password: 0 } },
    );

  if (!user) throw HttpError.notFound("User not found");

  res.status(200).json({ success: true, message: "Profile updated successfully", data: user });
};

export const deleteMyAccount = async (req: Request, res: Response) => {
  const db = getDb();
  const userId = parseObjectId(req.user!.id);

  const { deletedCount } = await db.collection(Collections.users).deleteOne({ _id: userId });
  if (deletedCount === 0) throw HttpError.notFound("User not found");

  // ===== Cascade: remove the user's listings and their images =====
  const listings = db.collection(Collections.listings);
  const owned = await listings
    .find({ ownerId: userId }, { projection: { images: 1 } })
    .toArray();
  await listings.deleteMany({ ownerId: userId });
  await deleteImagesSafely(owned.flatMap((listing) => listing.images ?? []));

  res.status(200).json({ success: true, message: "Account deleted" });
};
