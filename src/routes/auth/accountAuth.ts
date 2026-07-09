import express from "express";
import { createAccount, userlogin } from "../../controllers/auth/accounts";
import { LoginLimiter } from "../../controllers/auth/authRateLimit";

const Authrouter = express.Router();

Authrouter.post("/auth/signup", createAccount);
Authrouter.post("/auth/login", LoginLimiter, userlogin);

export default Authrouter;
