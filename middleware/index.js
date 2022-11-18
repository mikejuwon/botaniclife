// import { expressjwt } from "express-jwt";
import jwt from "jsonwebtoken";
import User from "../models/users";

// export const requireSignIn = expressjwt({
//   secret: `${process.env.JWT_SECRET}`,
//   algorithms: ["HS256"],
// });

export const requireSignIn = async (req, res, next) => {
  // get token from the cookie
  const token = req.cookies.token;
  if (!token) {
    req.flash("error", "You must be signed in to view this page!");
    return res.redirect("/login");
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      req.flash("error", "You must be signed in to view this page!");
      return res.redirect("/login");
    }
    req.user = decoded;
    next();
  });
};

// export const canPayNow = (req, res, next) => {
//   // if user is logged in, they can pay now
//   if (req.session.user) {
//     next();
//   } else {

//     // if the email provided in the body is in the database, they can pay now
//     User.findOne({ email: req.body.email }, (err, user) => {
//       if (err) {
//         req.flash("error", "An error occured, please try again!");
//         return res.redirect("/checkout");
//       }
//       if (user) {
//         next();
//       } else {
//         req.flash("error", "You must be either logged in or you are a user to pay with payment gateway!");
//         return res.redirect("/login");
//       }
//   });
//   }
// };
