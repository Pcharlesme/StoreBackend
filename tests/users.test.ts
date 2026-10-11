import request from "supertest";
import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { app, bearer, createUser, useTestDatabase } from "./helpers";

useTestDatabase();

describe("GET /users/:id", () => {
  it("exposes only the public profile, never contact details or credentials", async () => {
    const user = await createUser();

    const res = await request(app).get(`/users/${user.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ fullname: "Test User", location: { city: "London", country: "UK" } });
    for (const field of ["email", "password", "contactno", "address", "role"]) {
      expect(res.body.data).not.toHaveProperty(field);
    }
    expect(res.body.data.location).not.toHaveProperty("postcode");
  });

  it("returns 400 for a malformed id and 404 for an unknown user", async () => {
    expect((await request(app).get("/users/123")).status).toBe(400);
    expect((await request(app).get(`/users/${new ObjectId()}`)).status).toBe(404);
  });
});

describe("PATCH /users/me", () => {
  it("updates allowed fields and returns the updated profile", async () => {
    const user = await createUser();

    const res = await request(app)
      .patch("/users/me")
      .set(bearer(user.token))
      .send({ fullname: "Jane Doe", role: "ADMIN", password: "hacked" });

    expect(res.status).toBe(200);
    expect(res.body.data.fullname).toBe("Jane Doe");
    expect(res.body.data.role).toBe("USER");
    expect(res.body.data).not.toHaveProperty("password");
  });

  it("returns 400 for an empty update", async () => {
    const user = await createUser();
    const res = await request(app).patch("/users/me").set(bearer(user.token)).send({});
    expect(res.status).toBe(400);
  });
});
