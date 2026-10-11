import request from "supertest";
import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Collections, getDb } from "../src/config/db";
import { app, bearer, createUser, useTestDatabase } from "./helpers";

// S3 is replaced with an in-process fake so no AWS credentials or network calls are needed.
const s3 = vi.hoisted(() => ({
  uploadImage: vi.fn(async () => `listings/${Math.random().toString(36).slice(2)}.jpg`),
  deleteImagesSafely: vi.fn(async () => {}),
}));
vi.mock("../src/config/s3", () => ({
  uploadImage: s3.uploadImage,
  deleteImagesSafely: s3.deleteImagesSafely,
  withSignedImageUrls: async (listing: { images?: string[] }) => ({
    ...listing,
    images: (listing.images ?? []).map((key) => `https://signed.example/${key}`),
  }),
}));

useTestDatabase();

beforeEach(() => vi.clearAllMocks());

const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString();
const PNG = Buffer.from("89504e470d0a1a0a", "hex");

const postListing = (token: string, overrides: Record<string, string> = {}) => {
  const fields = {
    title: "Wooden chair",
    description: "Solid oak chair, barely used",
    type: "SELL",
    price: "25",
    category: "furniture",
    expiryDate: tomorrow(),
    location: JSON.stringify({ city: "London" }),
    ...overrides,
  };
  const req = request(app).post("/listings").set(bearer(token));
  for (const [key, value] of Object.entries(fields)) req.field(key, value);
  return req.attach("images", PNG, { filename: "chair.png", contentType: "image/png" });
};

const insertListing = async (ownerId: string, overrides: Record<string, unknown> = {}) => {
  const { insertedId } = await getDb()
    .collection(Collections.listings)
    .insertOne({
      title: "Lamp",
      description: "A nice desk lamp",
      type: "FREE",
      price: 0,
      category: "lighting",
      status: "ACTIVE",
      images: ["listings/lamp.jpg"],
      ownerId: new ObjectId(ownerId),
      expiryDate: new Date(Date.now() + 86_400_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
  return insertedId.toString();
};

describe("POST /listings", () => {
  it("creates a listing from multipart form data", async () => {
    const owner = await createUser();
    const res = await postListing(owner.token);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ title: "Wooden chair", price: 25, status: "ACTIVE" });
    expect(res.body.data.location).toEqual({ city: "London" });
    expect(res.body.data.images[0]).toMatch(/^https:\/\/signed\.example\//);
    expect(s3.uploadImage).toHaveBeenCalledTimes(1);
  });

  it("validates fields before uploading anything to S3", async () => {
    const owner = await createUser();
    const res = await postListing(owner.token, { location: "not json", price: "-5" });

    expect(res.status).toBe(400);
    expect(s3.uploadImage).not.toHaveBeenCalled();
  });

  it("rejects non-image uploads", async () => {
    const owner = await createUser();
    const res = await request(app)
      .post("/listings")
      .set(bearer(owner.token))
      .attach("images", Buffer.from("hello"), { filename: "x.txt", contentType: "text/plain" });

    expect(res.status).toBe(400);
  });

  it("requires authentication", async () => {
    const res = await request(app).post("/listings");
    expect(res.status).toBe(401);
  });
});

describe("GET /listings and /listings/search", () => {
  it("returns only ACTIVE listings with pagination", async () => {
    const owner = await createUser();
    await insertListing(owner.id);
    await insertListing(owner.id, { status: "SOLD" });

    const res = await request(app).get("/listings?page=1&limit=10");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
  });

  it("clamps an oversized limit instead of returning everything", async () => {
    const res = await request(app).get("/listings?limit=100000");
    expect(res.body.pagination.limit).toBe(50);
  });

  it("matches search terms case-insensitively across title, description and category", async () => {
    const owner = await createUser();
    await insertListing(owner.id, { title: "Vintage Bicycle" });
    await insertListing(owner.id, { title: "Sofa" });

    const res = await request(app).get("/listings/search?search=bicycle");

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe("Vintage Bicycle");
  });

  it("treats regex metacharacters in search as literal text", async () => {
    const owner = await createUser();
    await insertListing(owner.id, { title: "Sofa" });

    const res = await request(app).get(`/listings/search?search=${encodeURIComponent(".*")}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe("GET /listings/:id", () => {
  it("returns 400 for a malformed id and 404 for a missing listing", async () => {
    expect((await request(app).get("/listings/not-an-id")).status).toBe(400);
    expect((await request(app).get(`/listings/${new ObjectId()}`)).status).toBe(404);
  });
});

describe("listing ownership", () => {
  it("lets the owner update their listing", async () => {
    const owner = await createUser();
    const id = await insertListing(owner.id);

    const res = await request(app)
      .patch(`/listings/${id}`)
      .set(bearer(owner.token))
      .send({ title: "Updated lamp" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Updated lamp");
  });

  it("forbids other users from updating, changing status or deleting", async () => {
    const owner = await createUser();
    const intruder = await createUser();
    const id = await insertListing(owner.id);

    const update = await request(app)
      .patch(`/listings/${id}`)
      .set(bearer(intruder.token))
      .send({ title: "Hijacked" });
    const status = await request(app)
      .patch(`/listings/status/${id}`)
      .set(bearer(intruder.token))
      .send({ status: "SOLD" });
    const remove = await request(app).delete(`/listings/${id}`).set(bearer(intruder.token));

    expect([update.status, status.status, remove.status]).toEqual([403, 403, 403]);
    const stored = await getDb().collection(Collections.listings).findOne({ _id: new ObjectId(id) });
    expect(stored).toMatchObject({ title: "Lamp", status: "ACTIVE" });
  });

  it("lets an ADMIN change any listing's status", async () => {
    const owner = await createUser();
    const admin = await createUser("admin@example.com", "ADMIN");
    const id = await insertListing(owner.id);

    const res = await request(app)
      .patch(`/listings/status/${id}`)
      .set(bearer(admin.token))
      .send({ status: "SOLD" });

    expect(res.status).toBe(200);
  });

  it("deletes the listing and cleans up its S3 images", async () => {
    const owner = await createUser();
    const id = await insertListing(owner.id);

    const res = await request(app).delete(`/listings/${id}`).set(bearer(owner.token));

    expect(res.status).toBe(200);
    expect(s3.deleteImagesSafely).toHaveBeenCalledWith(["listings/lamp.jpg"]);
    expect(await getDb().collection(Collections.listings).countDocuments()).toBe(0);
  });
});

describe("GET /users/me/listings", () => {
  it("returns only the caller's listings with signed image URLs", async () => {
    const me = await createUser();
    const other = await createUser();
    await insertListing(me.id);
    await insertListing(other.id);

    const res = await request(app).get("/users/me/listings").set(bearer(me.token));

    expect(res.body.count).toBe(1);
    expect(res.body.data[0].images[0]).toMatch(/^https:\/\/signed\.example\//);
  });
});

describe("DELETE /users/me", () => {
  it("deletes the account together with its listings and images", async () => {
    const me = await createUser();
    await insertListing(me.id);

    const res = await request(app).delete("/users/me").set(bearer(me.token));

    expect(res.status).toBe(200);
    expect(await getDb().collection(Collections.listings).countDocuments()).toBe(0);
    expect(s3.deleteImagesSafely).toHaveBeenCalledWith(["listings/lamp.jpg"]);
  });
});
