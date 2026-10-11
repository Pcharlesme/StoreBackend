import request from "supertest";
import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { Collections, getDb } from "../src/config/db";
import { expireListings } from "../src/jobs/listingExpiry";
import { app, bearer, createUser, useTestDatabase } from "./helpers";

useTestDatabase();

describe("GET /admin/dashboard", () => {
  it("returns 403 for regular users", async () => {
    const user = await createUser();
    const res = await request(app).get("/admin/dashboard").set(bearer(user.token));
    expect(res.status).toBe(403);
  });

  it("returns aggregated counts for admins", async () => {
    const admin = await createUser("admin@example.com", "ADMIN");
    const ownerId = new ObjectId(admin.id);
    await getDb()
      .collection(Collections.listings)
      .insertMany([
        { status: "ACTIVE", type: "SELL", ownerId },
        { status: "ACTIVE", type: "FREE", ownerId },
        { status: "SOLD", type: "SELL", ownerId },
      ]);

    const res = await request(app).get("/admin/dashboard").set(bearer(admin.token));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      users: 1,
      listings: { total: 3, active: 2, sold: 1, expired: 0, deleted: 0 },
      listingTypes: { free: 1, sell: 2, swap: 0 },
    });
  });
});

describe("listing expiry job", () => {
  it("expires only ACTIVE listings whose expiry date has passed", async () => {
    const listings = getDb().collection(Collections.listings);
    const past = new Date(Date.now() - 1000);
    const future = new Date(Date.now() + 86_400_000);
    await listings.insertMany([
      { status: "ACTIVE", expiryDate: past },
      { status: "ACTIVE", expiryDate: future },
      { status: "SOLD", expiryDate: past },
    ]);

    expect(await expireListings()).toBe(1);
    expect(await listings.countDocuments({ status: "EXPIRED" })).toBe(1);
    expect(await listings.countDocuments({ status: "SOLD" })).toBe(1);
  });
});

describe("app-level handlers", () => {
  it("returns JSON 404 for unknown routes", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for malformed JSON bodies", async () => {
    const res = await request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send("{bad json");
    expect(res.status).toBe(400);
  });
});
