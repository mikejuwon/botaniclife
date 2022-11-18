import express from "express";

const router = express.Router();

import {
  addToCart,
  removeFromCart,
  checkOutPage,
  payOnDelivery,
  activateAccountPage,
  activateAccount,
  payWithPaystack,
  verifyPayment,
  printInvoice,
  trackOrderPage,
} from "../controllers/productController";
import { requireSignIn } from "../middleware";

router.post("/add-to-cart/:id", addToCart);
router.post("/remove-from-cart/:id", removeFromCart);
router.get("/checkout", checkOutPage);
router.post("/check-out/pay-on-delivery", payOnDelivery);
router.get("/user/activate/:id/:token", activateAccountPage);
router.post("/activate-account/:id/:token", activateAccount);

router.post("/check-out/paystack/pay", payWithPaystack);
router.get("/paystack/callback", verifyPayment);
router.get("/print-invoice/:id", printInvoice);

router.get("/track-order/:id", trackOrderPage);

module.exports = router;