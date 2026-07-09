import express from "express";
import { createAccount, userlogin } from "../../controllers/auth/accounts";
import { LoginLimiter } from "../../controllers/auth/authRateLimit";
import {
  deleteUser,
  getUserbyId,
  getUserProfile,
  updateUserProfile,
} from "../../controllers/users/usersController";
import {
  createListing,
  deleteListing,
  findListing,
  getListingbyId,
  searchListing,
  updateListing,
  updateListingStatus,
} from "../../controllers/product/listing";

const Authrouter = express.Router();
// user auth
Authrouter.post("/auth/signup", createAccount);
Authrouter.post("/auth/login", LoginLimiter, userlogin);
//user management
Authrouter.get("/users/me/:id", getUserProfile);
Authrouter.get("/users/:id", getUserbyId);
Authrouter.patch("/users/me/:id", updateUserProfile);
Authrouter.delete("/users/:id", deleteUser);
// product listing
Authrouter.post("/listings", createListing);
Authrouter.patch("/listings/:id", updateListing);
Authrouter.get("/listings", findListing);
Authrouter.get("/listings/:id", getListingbyId);
Authrouter.get("/listings/search", searchListing);
Authrouter.delete("/listings/:id", deleteListing);
//product lising status
Authrouter.patch("/listings/status/:id", updateListingStatus);
export default Authrouter;
