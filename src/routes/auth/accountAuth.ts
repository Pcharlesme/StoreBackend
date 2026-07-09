import express  from "express";
import { createAccount, userlogin } from "../../controllers/auth/accounts";

 const Authrouter = express.Router()

Authrouter.post("/auth/signup", createAccount)
Authrouter.post("/auth/login" , userlogin)


export default Authrouter