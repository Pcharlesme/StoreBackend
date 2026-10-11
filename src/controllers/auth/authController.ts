import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Collections, getDb } from "../../config/db";
import { loginSchema, signupSchema } from "../../schemas/auth";
import { HttpError } from "../../utils/httpError";
import { generateAccessToken, Role } from "../../utils/jwt";

const BCRYPT_ROUNDS = 12;

// Compared against when the email doesn't exist so both failure paths take the same time,
// which prevents account enumeration through response timing.
const DUMMY_HASH = bcrypt.hashSync("timing-attack-placeholder", BCRYPT_ROUNDS);

export const signup = async (req: Request, res: Response) => {
  const { email, password } = signupSchema.parse(req.body);
  const users = getDb().collection(Collections.users);

  if (await users.findOne({ email }, { projection: { _id: 1 } })) {
    throw HttpError.conflict("An account with this email already exists");
  }

  const { insertedId } = await users.insertOne({
    email,
    password: await bcrypt.hash(password, BCRYPT_ROUNDS),
    role: "USER" satisfies Role,
    createdAt: new Date(),
  });

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: { id: insertedId, email },
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await getDb().collection(Collections.users).findOne({ email });

  const passwordMatches = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !passwordMatches) {
    throw HttpError.unauthorized("Invalid email or password");
  }

  // Accounts created before roles existed have no `role` field
  const role: Role = user.role === "ADMIN" ? "ADMIN" : "USER";
  const accessToken = generateAccessToken({ id: user._id.toString(), role });

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      accessToken,
      user: { id: user._id, email: user.email, role },
    },
  });
};
