const express = require("express");

const router = express.Router();
// import { Router as router } from 'express';
// controllers
const {
  homePage,
  aboutPage,
  productsPage,
  contactPage,
  singleProduct,
  blogPage,
  blogSingle,
  nextPost,
  previousPost,
  cartPage,
  shareOnFacebook,
  shareOnSkype,
  shareOnLinkedIn,
  shareOnTwitter,
  shareOnWhatsApp,
  addComment,
  addReply,
  returnPolicy,
  redistributionRequest,
  errorPage,
  termsAndConditions,
  productReturns,
  wholesalePolicy,  
} = require ("../controllers/pageController");


router.get("/", homePage);

router.get("/view-cart", cartPage);

router.get("/about", aboutPage);
router.get("/products", productsPage);
router.get("/contact", contactPage);
router.get("/product/:id", singleProduct);

router.get("/blogs/:page", blogPage);
router.get("/blog/:id", blogSingle);

router.post("/add-comment", addComment);
router.post("/add-reply/:commentId/:blogId", addReply);

router.get("/next-post/:id", nextPost);
router.get("/previous-post/:id", previousPost);

router.get("/share-facebook/:id", shareOnFacebook);
router.get("/share-twitter/:id", shareOnTwitter);
router.get("/share-linkedin/:id", shareOnLinkedIn);
router.get("/share-skype/:id", shareOnSkype);
router.get("/share-whatsapp/:id", shareOnWhatsApp);

router.get("/return-policy", returnPolicy);
router.get("/terms-and-conditions", termsAndConditions);
router.get("/product-returns", productReturns);
router.get("/wholesale-policy", wholesalePolicy);
router.get("/error", errorPage);

router.post("/redistribution-request", redistributionRequest);

module.exports = router;