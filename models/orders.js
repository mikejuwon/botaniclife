const mongoose = require('mongoose');
const conn = require("../config/database");

const ordersSchema = new mongoose.Schema({
    products: {type: Array, required: true},
    amount: { type: Number, required: true },
    name: {
        firstName: { type: String, trim: true, required: true },
        lastName: { type: String, trim: true, required: true },
    },
    email: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    note: { type: String },
    orderNumber: { type: String, required: true },
    status: { type: String, default: "pending", lowercase: true },
    paymentId: { type: String },
    paymentStatus: { type: String, default: "unpaid", lowercase: true },
    paymentMethod: { type: String, default: "Pay on Delivery", lowercase: true },
    paymentDetails: { type: Object },
    shippingInfo: { 
        name: {
            firstName: { type: String, trim: true, },
            lastName: { type: String, trim: true, },
        },
        email: { type: String, },
        address: { type: String, },
        phone: { type: String, },
        city: { type: String, }
     },
}, { timestamps: true });

const Order = conn.botaniclife.model("Order", ordersSchema);

module.exports = Order;