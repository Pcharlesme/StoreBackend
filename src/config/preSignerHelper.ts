import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "./s3bucket";

export async function getImageUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  });

  return getSignedUrl(s3, command, {
    expiresIn: 60 * 60, // 1 hour
  });
}


//convert 

// For one listing (get by id)
export const addListingImageUrl = async (listing: any) => {
  return {
    ...listing,
    images: await Promise.all(
      listing.images.map((key: string) => getImageUrl(key))
    ),
  };
};


// For multiple listings (all, search, user listings)
export const addListingsImageUrl = async (listings: any[]) => {
  return Promise.all(
    listings.map((listing) => addListingImageUrl(listing))
  );
};