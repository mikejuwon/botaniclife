const conn = require('../config/database.js');
const _ = require("lodash");
const Cart = require("../models/Cart");
const Order = require("../models/orders");
const User = require("../models/users");
const jwt = require('jsonwebtoken');
const sgMail = require("@sendgrid/mail");
const {hashPassword, comparePassword} = require('../helpers/auth');
const moment = require("moment");


sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// const accountSid = 'AC4aa827e21a65200baf1e546878866b74'; // Your Account SID from www.twilio.com/console
// const authToken = 'adfcf3f068af08381d4b6c5cfefd4e2d';

// const client = new twilio(accountSid, authToken);


 const loginPage = (req, res) => {
    res.render("auth/login", {
        flash: req.flash("error"),
        errors: [],
        _
    });
};

 const registerPage = (req, res) => {
    res.render("auth/register", {
        flash: req.flash("error"),
        errors: [],
        _
    });
};

 const userRegister = async (req, res) => {
    const {firstName, lastName, email, password, phone, address, city} = req.body;
    
    const errors = [];

    // apply validation
    if (!firstName || !lastName) {
        errors.push({message: "An error occurred! First Name and Last Name are required!"});
    }
    if (!password || password.length < 6) {
        errors.push({message: "An error occurred! Password is required and should be at least 6 characters long!"});
    }
    if (!email) {
        errors.push({message: "An error occurred! Email is required!"});
    }
    if (!phone) {
        errors.push({message: "An error occurred! Phone number is required!"});
    }
    if (!address) {
        errors.push({message: "An error occurred! Address is required!"});
    }
    if (!city) {
        errors.push({message: "An error occurred! City is required!"});
    }

    let userExist = await User.findOne({email});
    if (userExist) {
        errors.push({message: "Email is already taken!"});
    }

    if (errors.length > 0) {
        // redirect to the register page with the errors
        return res.render("auth/register", {
            flash: req.flash("error"),
            errors,
            _
        });
    } else {

    // register
    const hashedPassword = await hashPassword(password);
    const user = new User({
        name: {
            firstName,
            lastName
        },
        email,
        password: hashedPassword,
        phone,
        address,
        city,
    });

    try {
        const savedUser = await user.save();
            const token = jwt.sign({ _id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

            // // find user to update and set activation token
            // User.findOneAndUpdate(
            //     { email: savedUser.email },
            //     {
            //         $set: {
            //             activationToken: token,
            //             activationExpires: Date.now() + 3600000,
            //         }
            //     }
            // );

            const msg = {
            to: savedUser.email,
            from: process.env.SENDGRID_SENDER,
            subject: "Verify Your BotanicLife Account",
            html: `
            <p>Hi ${savedUser.name.firstName},</p>

            <img src="https://res.cloudinary.com/mikejuwon/image/upload/v1666708917/botaniclife-logo_zoyusw.png" alt="Botanic Life" width="100" height="70"></img>
            <br/>
            <br/>
            Dear ${savedUser.name.firstName} ${savedUser.name.lastName},
            <br/>
            <br/>
            Please click on the link below to activate your account:
            <br/>
            <a href="http://${req.headers.host}/user/verify/${savedUser._id}/${token}">http://${req.headers.host}/user/verify/${savedUser._id}/${token}</a>
            <br/>
            <br/>
            Thank you!
            <br/>
            Botanic Life
            
            `,
        };
        await sgMail.send(msg);
        req.flash("error", "Check your email address and follow the instruction to activate your account within the next 7 days!");
        return res.redirect("/login");
        
    } catch (err) {
        console.log(err);
    }
}
};

 const userLogin = async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await User.findOne({email});
        if (!user) {
            req.flash("error", "Invalid credentials! Try again later.");
            return res.redirect("/login");
        }
        const match = await comparePassword(password, user.password);
        if (!match) {
            req.flash("error", "Invalid credentials");
            return res.redirect("/login");
        }
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: 604800000 });
        // set Bearer token authorization headers
        res.cookie("token", token, {expiresIn: 604800000 });
        // res.cookie("token", token, { httpOnly: true, maxAge: 604800000 }); // 7 days
        user.password = undefined;       
        // set user into session until the user logs out
        req.session.user = user;
        req.flash("error", "Login successful");
        return res.redirect("/dashboard");
    } catch (error) {
        console.log(error);
        req.flash("error", error.message);
        return res.redirect("/login");
    }
};

 const userLoginCheckout = async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await User.findOne({email});
        if (!user) {
            req.flash("success", "Invalid credentials! Try again later.");
            return res.redirect("../checkout");
        }
        const match = await comparePassword(password, user.password);
        if (!match) {
            req.flash("success", "Invalid credentials");
            return res.redirect("../checkout");
        }
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: 604800000 });
        // set Bearer token authorization headers
        res.cookie("token", token, {expiresIn: 604800000 });
        // res.cookie("token", token, { httpOnly: true, maxAge: 604800000 }); // 7 days
        user.password = undefined;       
        // set user into session until the user logs out
        req.session.user = user;
        req.flash("success", "Login successful! Proceed to checkout");
        return res.redirect("../checkout");
    } catch (error) {
        console.log(error);
        req.flash("success", error.message);
        return res.redirect("../checkout");
    }
};
 const userVerify = async (req, res) => {
    const {token} = req.params;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id);
        if (!user) {
            req.flash("error", "Invalid token!");
            return res.redirect("/login");
        }
        if (user.isActivated) {
            req.flash("error", "Account already verified!");
            return res.redirect("/login");
        }
        user.isActivated = true;
        await user.save();
        req.flash("error", "Account verified successfully!");
        return res.redirect("/login");
    } catch (error) {
        console.log(error);
        req.flash("error", error.message);
        return res.redirect("/login");
    }
};

 const userLogout = (req, res) => {
    res.clearCookie("token");
    // set the session.user to null
    req.session.user = null;
    req.flash("error", "You have been logged out!");
    return res.redirect("/login");
};

 const forgotPasswordPage = (req, res) => {
    res.render("auth/forgot-password", {
        flash: req.flash("error"),
        errors: [],
        _
    });
};

 const forgotPassword = async (req, res) => {
    const {email} = req.body;
    try {
        const user = await User.findOne({email});
        if (!user) {
            req.flash("error", "Invalid credentials! Try again later.");
            return res.redirect("/forgot-password");
        }
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: "3d"});
        const msg = {
            to: user.email,
            from: process.env.SENDGRID_SENDER,
            subject: "Reset Your BotanicLife Account Password",
            html: `
            <img src="https://res.cloudinary.com/mikejuwon/image/upload/v1666708917/botaniclife-logo_zoyusw.png" alt="Botanic Life" width="100" height="70"></img>
            <br/>
            <br/>
            Dear ${user.name.firstName} ${user.name.lastName},
            <p> You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
            <br/>
            Please click on the link below to reset your password:
            <a href="http://${req.headers.host}/user/reset-password/${token}">Reset Password Now</a>
            <br/>
            <p> If you did not request this, please ignore this email and your password will remain unchanged.</p>
            Thank you!
            <br/>
            Botanic Life
            `,
        };
        await sgMail.send(msg);
        req.flash("error", "Check your email address and follow the instruction to reset your password!");
        return res.redirect("/login");
    } catch (error) {
        console.log(error);
        req.flash("error", error.message);
        return res.redirect("/forgot-password");
    }
};

 const resetPasswordPage = async (req, res) => {
    const {token} = req.params;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            req.flash("error", "Invalid token!");
            return res.redirect("/login");
        }
        res.render("auth/reset-password", {
            flash: req.flash("error"),
            errors: [],
            token,
            _
        });
    } catch (error) {
        console.log(error);
        req.flash("error", error.message);
        return res.redirect("/login");
    }
};

 const resetPassword = async (req, res) => {
    const {token} = req.params;
    const {password} = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            req.flash("error", "Invalid token!");
            return res.redirect("/login");
        }
        user.password = await hashPassword(password);
        await user.save();

        const msg = {
            to: user.email,
            from: process.env.SENDGRID_SENDER,
            subject: "Your BotanicLife Account Password Has Been Reset",
            html: `
            <img src="https://res.cloudinary.com/mikejuwon/image/upload/v1666708917/botaniclife-logo_zoyusw.png" alt="Botanic Life" width="100" height="70"></img>
            <br/>
            <p>Dear ${user.name.firstName} ${user.name.lastName},</p>
            <p> This is a confirmation that the password for your account ${user.email} has just been changed.</p>
            <br/>
            Thank you!
            <br/>
            Botanic Life
            `,
        };
        await sgMail.send(msg);
        req.flash("error", "Password reset successful! You can now login with your new password.");
        return res.redirect("/login");
    } catch (error) {
        console.log(error);
        req.flash("error", error.message);
        return res.redirect("/login");
    }
};

 const userDashboard = async (req, res) => {
    const user = req.session.user;
    let cart = new Cart(req.session.cart ? req.session.cart : {});
    let cartItems = cart.generateArray();
    try {
        const orders = await Order.find({email: user.email}).sort({createdAt: -1});
        // get user's messages from the messages collection
        const messages = await conn.botanicAdmin.collection("messages").find({email: user.email}).sort({ _id: -1 }).toArray();
        res.render("pages/dashboard", {
            flash: req.flash("error"),
            orders,
            messages,
            user,
            cartItems,
            cart,
            moment,
            errors: [],
            _
        });
    } catch (error) {
        console.log(error);
        req.flash("error", error.message);
        return res.redirect("/dashboard");
    }
};

 const cancelOrder = async (req, res) => {
    const {id} = req.params;
    const {reason} = req.body;
    const user = await User.findOne({ _id: req.session.user._id });
    try {

        if (!reason) {
            req.flash("error", "Please provide a reason for cancelling your order!");
            return res.redirect("/dashboard");
        }

        const order = await Order.findById(id);
        if (!order) {
            req.flash("error", "Order not found!");
            return res.redirect("/dashboard");
        }
        if (order.status === "shipped") {
            req.flash("error", "Sorry, you cannot cancel this order because it is already processed and shipped!");
            return res.redirect("/dashboard");
        }
        order.status = "cancel request";
        await order.save();

        await conn.botanicAdmin.collection("cancellations").insertOne({
            orderId: order._id,
            orderNumber: order.orderNumber,
            reason,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: "pending",
        });

        const msg = {
            to: order.email,
            from: process.env.SENDGRID_SENDER,
            subject: "The Cancel Request For Your Order Has Been Sent",
            html: `
            <br/>
            <p>Dear ${order.name.firstName} ${order.name.lastName},</p>
            <p> This is a confirmation that you have requested that your order with order number ${order.orderNumber} should be cancelled.</p>
            <br/>
            <img src="https://res.cloudinary.com/mikejuwon/image/upload/v1666708917/botaniclife-logo_zoyusw.png" alt="Botanic Life" width="100" height="50"></img>
            <br/>
            <br/>   
            Thank you!<br/>
            Botanic Life
            `,
        };
        await sgMail.send(msg);

        // create a new message to the message collection from the botanicAdmin database
        const message = {
            name: user.name.firstName + " " + user.name.lastName,
            email: user.email,
            subject: "Cancel Request For Order",
            message: `Dear ${user.name.firstName} ${user.name.lastName}, This is a confirmation that you have requested that your order with order number ${order.orderNumber} should be cancelled.
            Thank you!
            Botanic Life`,
        };
        await conn.botanicAdmin.collection("messages").insertOne(message);

        req.flash("error", "Your cancel request has been sent! You will be notified when your order has been cancelled.");
        return res.redirect("/dashboard");
    } catch (error) {
        console.log(error);
        req.flash("error", error.message);
        return res.redirect("/dashboard");
    }
};

 const updateAccount = async (req, res) => {
    const { id } = req.params;
    const {firstName, lastName, phone, address, city, currentPass, newPass} = req.body;
    // user's orders
    const orders = await Order.find({email: req.session.user.email}).sort({createdAt: -1});

    // Validate user input
    const errors = [];
    if (!firstName || !lastName || !phone || !address || !city) {
        errors.push({message: "All fields are required!"});
    }
    if (newPass && newPass.length < 6) {
        errors.push({message: "Password must be at least 6 characters!"});
    }
    if (errors.length > 0) {
        return res.render("pages/dashboard", {
            flash: req.flash("error"),
            errors,
            user: req.session.user,
            cartItems: req.session.cart ? req.session.cart.generateArray() : [],
            cart: req.session.cart,
            orders,
            moment,
            _
        });
    } else {
    
    try {
        const user = await User.findById(id);
        if (!user) {
            req.flash("error", "User not found!");
            return res.redirect("/dashboard");
        }
        user.name.firstName = firstName;
        user.name.lastName = lastName;
        user.phone = phone;
        user.address = address;
        user.city = city;
        if (currentPass && newPass) {
            const isValid = await comparePassword(currentPass, user.password);
            if (!isValid) {
                req.flash("error", "Invalid current password!");
                return res.redirect("/dashboard");
            }
            user.password = await hashPassword(newPass);
        }
        await user.save();
        req.flash("error", "Profile updated successfully!");
        return res.redirect("/dashboard");
    } catch (error) {
        console.log(error);
        req.flash("error", error.message);
        return res.redirect("/dashboard");
    }
    }
};

 const deleteAccount = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) {
            req.flash("error", "User not found!");
            return res.redirect("/dashboard");
        }
        await user.remove();
        // delete user's orders that are not shipped or delivered from the orders collection
        await Order.deleteMany({email: user.email, status: {$ne: "shipped"}, status: {$ne: "delivered"}});
        // delete user's messages from the messages collection
        await conn.botanicAdmin.collection("messages").deleteMany({email: user.email});

        // send email to the user to notify that the account has been deleted
        const msg = {
            to: user.email,
            from: process.env.SENDGRID_SENDER,
            subject: "Your Account Has Been Deleted",
            html: `
            <br/>
            <p>Dear ${user.name.firstName} ${user.name.lastName},</p>
            <p> This is a confirmation that your account has been deleted.</p>
            <p> We are sorry to see you go. We hope to see you again soon.</p>
            <br/>
            <img src="https://res.cloudinary.com/mikejuwon/image/upload/v1666708917/botaniclife-logo_zoyusw.png" alt="Botanic Life" width="100" height="70"></img>
            <br/>
            <br/>
            Thank you!<br/>
            Botanic Life
            `,
        };
        await sgMail.send(msg);
        req.session.user = null;
        req.flash("error", "Your account has been deleted!");
        return res.redirect("/login");
    } catch (error) {
        console.log(error);
        req.flash("error", error.message);
        return res.redirect("/dashboard");
    }
};

 const deliveredOrder = async (req, res) => {
    const { id } = req.params;
    try {
        const order = await Order.findById(id);
        if (!order) {
            req.flash("error", "Order not found!");
            return res.redirect("/dashboard");
        }
        order.status = "delivered";
        order.paymentStatus = "paid";
        await order.save();

        // send email to the user to notify that the order has been delivered
        const msg = {
            to: order.email,
            from: process.env.SENDGRID_SENDER,
            subject: "Your Order Has Been Delivered",
            html: `
            <br/>
            <p>Dear ${order.name.firstName} ${order.name.lastName},</p>
            <p> This is a confirmation that your order with order number ${order.orderNumber} has been delivered.</p>
            <p> Thank you for shopping with us.</p>
            <br/>
            <img src="https://res.cloudinary.com/mikejuwon/image/upload/v1666708917/botaniclife-logo_zoyusw.png" alt="Botanic Life" width="100" height="60"></img>
            <br/>
            <br/>
            Thank you!<br/>
            Botanic Life
            `,
        };
        await sgMail.send(msg);

        // send message to the user to notify that the order has been delivered
        const message = {
            name: order.name.firstName + " " + order.name.lastName,
            email: order.email,
            subject: "Your Order Has Been Delivered",
            message: `This is a confirmation that your order with order number ${order.orderNumber} has been delivered.
            <br/>
            Thank you for shopping with us.`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await conn.botanicAdmin.collection("messages").insertOne(message);
        req.flash("error", "Order status updated to delivered!");
        return res.redirect("/dashboard");
    } catch (error) {
        console.log(error);
        req.flash("error", error.message);
        return res.redirect("/dashboard");
    }
};

module.exports = {
    loginPage, registerPage, userRegister, userLogin, userLogout, userDashboard, deleteAccount, deliveredOrder,
    cancelOrder, resetPasswordPage, resetPassword, forgotPasswordPage, forgotPassword, updateAccount,
    userLoginCheckout, userVerify
};