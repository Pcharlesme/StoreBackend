import { Router } from "express";
import { getAdminDashboard } from "../controllers/admin/dashboardController";
import { login, signup } from "../controllers/auth/authController";
import {
  createListing,
  deleteListing,
  getActiveListings,
  getListingById,
  getMyListings,
  updateListing,
  updateListingStatus,
} from "../controllers/listings/listingsController";
import {
  deleteMyAccount,
  getMyProfile,
  getPublicProfile,
  updateMyProfile,
} from "../controllers/users/usersController";
import { authenticate, requireRole } from "../middleware/authenticate";
import { loginLimiter, signupLimiter } from "../middleware/rateLimit";
import { requireImages, uploadImages } from "../middleware/uploadImage";

const router = Router();

// ===== Auth =====
router.post("/auth/signup", signupLimiter, signup);
router.post("/auth/login", loginLimiter, login);

// ===== Listings =====
// Static paths are registered before "/listings/:id" so they aren't captured as an id.
router.get("/listings", getActiveListings);
router.get("/listings/search", getActiveListings);
router.get("/listings/:id", getListingById);

router.post("/listings", authenticate, uploadImages, requireImages, createListing);
router.patch("/listings/status/:id", authenticate, updateListingStatus);
router.patch("/listings/:id", authenticate, updateListing);
router.delete("/listings/:id", authenticate, deleteListing);

// ===== Users =====
router.get("/users/me", authenticate, getMyProfile);
router.patch("/users/me", authenticate, updateMyProfile);
router.delete("/users/me", authenticate, deleteMyAccount);
router.get("/users/me/listings", authenticate, getMyListings);
router.get("/users/:id", getPublicProfile);

// ===== Admin =====
router.get("/admin/dashboard", authenticate, requireRole("ADMIN"), getAdminDashboard);

export default router;
