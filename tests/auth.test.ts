import request from "supertest";
import { describe, expect, it } from "vitest";
import { Collections, getDb } from "../src/config/db";
import { app, bearer, createUser, useTestDatabase, VALID_PASSWORD } from "./helpers";

useTestDatabase();

describe("POST /auth/signup", () => {
  it("creates an account with a hashed password and USER role", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "new@example.com", password: VALID_PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ email: "new@example.com" });
    expect(res.body.data).not.toHaveProperty("password");

    const stored = await getDb().collection(Collections.users).findOne({ email: "new@example.com" });
    expect(stored?.password).not.toBe(VALID_PASSWORD);
    expect(stored?.role).toBe("USER");
  });

  it("ignores a client-supplied role", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ email: "sneaky@example.com", password: VALID_PASSWORD, role: "ADMIN" });

    const stored = await getDb().collection(Collections.users).findOne({ email: "sneaky@example.com" });
    expect(stored?.role).toBe("USER");
  });

  it("returns 409 for a duplicate email", async () => {
    await createUser("dupe@example.com");
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "dupe@example.com", password: VALID_PASSWORD });

    expect(res.status).toBe(409);
  });

  it("returns 400 with field errors for a weak password", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "weak@example.com", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe("password");
  });
});

describe("POST /auth/login", () => {
  it("returns an access token that authenticates protected routes", async () => {
    const { token } = await createUser("login@example.com");

    const me = await request(app).get("/users/me").set(bearer(token));
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe("login@example.com");
    expect(me.body.data).not.toHaveProperty("password");
  });

  it("returns 401 for wrong password and for unknown email, with the same message", async () => {
    await createUser("real@example.com");

    const wrongPassword = await request(app)
      .post("/auth/login")
      .send({ email: "real@example.com", password: "Wrong12345" });
    const unknownEmail = await request(app)
      .post("/auth/login")
      .send({ email: "ghost@example.com", password: "Wrong12345" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it("rejects NoSQL operator injection in the email field", async () => {
    await createUser("victim@example.com");
    const res = await request(app)
      .post("/auth/login")
      .send({ email: { $ne: null }, password: VALID_PASSWORD });

    expect(res.status).toBe(400);
  });
});

describe("authenticate middleware", () => {
  it.each([
    ["missing header", {}],
    ["malformed scheme", { Authorization: "Token abc" }],
    ["invalid token", { Authorization: "Bearer not-a-jwt" }],
  ])("returns 401 for %s", async (_label, headers) => {
    const res = await request(app).get("/users/me").set(headers);
    expect(res.status).toBe(401);
  });
});
