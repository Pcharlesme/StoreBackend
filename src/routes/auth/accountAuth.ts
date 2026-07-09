import express  from "express";
import { createAccount, userlogin } from "../../controllers/auth/accounts";

const router = express.Router()

router.post("/auth/signup", createAccount)
router.post("/auth/login" , userlogin)