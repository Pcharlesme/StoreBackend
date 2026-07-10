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
  getMyListings,
  searchListing,
  updateListing,
  updateListingStatus,
} from "../../controllers/product/listing";
import { authenticate } from "../../middleware/authenticate";
import { getAdminDashboard } from "../../controllers/dashboard/adminAnalystic";

const Authrouter = express.Router();

/* ===========================
   Public Authentication
=========================== */

Authrouter.post("/auth/signup", createAccount);
Authrouter.post("/auth/login", LoginLimiter, userlogin);

/* ===========================
   Public Listings
=========================== */

Authrouter.get("/listings", findListing);
Authrouter.get("/listings/search", searchListing);
Authrouter.get("/listings/:id", getListingbyId);

/* ===========================
   Public User Profiles
=========================== */

Authrouter.get("/users/:id", getUserbyId);

/* ===========================
   Protected User
=========================== */

Authrouter.get("/users/me", authenticate, getUserProfile);
Authrouter.patch("/users/me", authenticate, updateUserProfile);
Authrouter.delete("/users/me", authenticate, deleteUser);
Authrouter.get("/users/me/listings", authenticate, getMyListings);

/* ===========================
   Protected Listings
=========================== */
Authrouter.get("/admin/dashboard", authenticate, getAdminDashboard);
Authrouter.post("/listings", authenticate, createListing);
Authrouter.patch("/listings/:id", authenticate, updateListing);
Authrouter.patch("/listings/status/:id", authenticate, updateListingStatus);
Authrouter.delete("/listings/:id", authenticate, deleteListing);

export default Authrouter;
