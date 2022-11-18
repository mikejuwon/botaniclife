import mongoose from "mongoose";
const conn = require("../config/database");

const redistSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const Redistribution = conn.botaniclife.model("Redistribution", redistSchema);

export default Redistribution;