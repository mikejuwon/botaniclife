import mongoose from "mongoose";
const conn = require("../config/database");

const userSchema = new mongoose.Schema(
  {
    name: { 
      firstName: {type: String, trim: true, required: true},
      lastName: {type: String, trim: true, required: true}
     },
    email: { type: String, trim: true, required: true, unique: true },
    password: { type: String },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    cart: [{ }],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    isActivated: {type: Boolean, default: false},
  },
  { timestamps: true }
);

const User = conn.botaniclife.model("User", userSchema);

export default User;