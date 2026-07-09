import express from "express";
import { createAccount, userlogin } from "../../controllers/auth/accounts";
import { LoginLimiter } from "../../controllers/auth/authRateLimit";
import {
  deleteUser,
  getUserbyId,
  getUserProfile,
  updateUserProfile,
} from "../../controllers/users/usersController";

const Authrouter = express.Router();

Authrouter.post("/auth/signup", createAccount);
Authrouter.post("/auth/login", LoginLimiter, userlogin);
Authrouter.get("/users/me/:id", getUserProfile);
Authrouter.get("/users/:id", getUserbyId);
Authrouter.patch("/users/me/:id", updateUserProfile);
Authrouter.delete("/users/:id", deleteUser);

export default Authrouter;
