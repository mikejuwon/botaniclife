import express from "express";

const router = express.Router();

import {
  forgotPasswordPage,
  forgotPassword,
  loginPage,
  registerPage,
  userLogin,
  userLogout,
  userRegister,
  resetPasswordPage,
  resetPassword,
  userDashboard,
  cancelOrder,
  updateAccount,
  userVerify,
  deleteAccount,
  deliveredOrder,
  userLoginCheckout,
} from "../controllers/authController";
import { requireSignIn } from "../middleware";

router.get("/login", loginPage);
router.get("/register", registerPage);
router.get("/logout", userLogout);

router.post("/login", userLogin);
router.post("/checkout-login", userLoginCheckout);
router.post("/register", userRegister);
router.get("/user/verify/:id/:token", userVerify)

router.get("/forgot-password", forgotPasswordPage);
router.post("/forgot-password", forgotPassword);
router.get("/user/reset-password/:token", resetPasswordPage);
router.post("/reset-password/:token", resetPassword);

router.get("/dashboard", requireSignIn, userDashboard);
router.post("/cancel-order/:id", requireSignIn, cancelOrder);
router.post("/update-account/:id", requireSignIn, updateAccount);

router.get("/confirm-order/:id", requireSignIn, deliveredOrder);

router.post("/delete-account/:id", requireSignIn, deleteAccount);

module.exports = router;
