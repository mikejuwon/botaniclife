const conn = require("../config/database");
import _ from "lodash";
const ObjectID = require("mongodb").ObjectId;
import Cart from "../models/Cart";
import Order from "../models/orders";
import User from "../models/users";
import jwt from 'jsonwebtoken';
import sgMail from "@sendgrid/mail";
import {hashPassword, comparePassword} from '../helpers/auth';
import moment from "moment";
import validator from "validator";
import request from "request";
import QRCode from "qrcode";
import bwipjs from "bwip-js";

const paystack = require("../config/paystack")(request);    


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function genCode(length){
  var result           = '';
  var characters       = '0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function sendMessage(user, subject, order) {
  const msg = {
    name: user.name.firstName + " " + user.name.lastName,
    email: user.email,
    subject: subject,
    message: `
    <h3>Thank you for shopping with us!</h3>
      <p>Hi ${user.name.firstName} ${user.name.lastName},</p>
      <p>Your order has been received and is being processed. Your order details are shown below for your reference:</p>
      <ul>
        <strong><li>Order Number: ${result.orderNumber}</li></strong>
        <strong><li>Order Date: ${result.createdAt}</li></strong>
        <strong><li>Order Total: ₦${result.amount.toLocaleString()}</li></strong>
        <strong><li>Payment Method: ${result.paymentMethod}</li></strong>
        <strong><li>Order Status: ${result.status}</li></strong>
        <strong><li>Payment Status: ${result.paymentStatus}</li></strong>
        <strong><li>Note: ${result.note}</li></strong>
      </ul>
      <br/>
      <p><strong>Billing Information</strong></p>
      <ul>
        <li>Full Name: ${result.name.firstName} ${result.name.lastName}</li>
        <li>Phone Number: ${result.phone}</li>
        <li>Email: ${result.email}</li>
        <li>Address: ${result.address}</li>
        <li>City: ${result.city}</li>
      </ul>
      <p><strong>Shipping Information</strong></p>
      <ul>
        <li>Full Name: ${result.shippingInfo.name.firstName} ${result.shippingInfo.name.lastName}</li>
        <li>Phone Number: ${result.shippingInfo.phone}</li>
        <li>Email: ${result.shippingInfo.email}</li>
        <li>Address: ${result.shippingInfo.address}</li>
        <li>City: ${result.shippingInfo.city}</li>
      </ul>
      <br/>

      <p>Thank you for shopping with us.</p><br/>
      <img src="https://res.cloudinary.com/mikejuwon/image/upload/v1666708917/botaniclife-logo_zoyusw.png" alt="Botanic Life" width="150" height="70"></img>
      <br/>
    <p>Best Regards,</p>
    <p>Botanic Life</p>
  `,
    createdAt: new Date(),
    updatedAt: new Date(),
  };  
    await conn.botanicAdmin.collection("messages").insertOne(msg);
};

async function sendMail (user, subject, result) {
  const message = {
    to: user.email,
    from: process.env.SENDGRID_SENDER,
    subject: subject,
    html: `
      <h3>Thank you for shopping with us!</h3>
        <p>Hi ${user.name.firstName} ${user.name.lastName},</p>
        <p>Your order has been received and is being processed. Your order details are shown below for your reference:</p>
        <ul>
          <strong><li>Order Number: ${result.orderNumber}</li></strong>
          <strong><li>Order Date: ${result.createdAt}</li></strong>
          <strong><li>Order Total: ₦${result.amount.toLocaleString()}</li></strong>
          <strong><li>Payment Method: ${result.paymentMethod}</li></strong>
          <strong><li>Order Status: ${result.status}</li></strong>
          <strong><li>Payment Status: ${result.paymentStatus}</li></strong>
          <strong><li>Note: ${result.note}</li></strong>
        </ul>
        <br/>
        <p><strong>Billing Information</strong></p>
        <ul>
          <li>Full Name: ${result.name.firstName} ${result.name.lastName}</li>
          <li>Phone Number: ${result.phone}</li>
          <li>Email: ${result.email}</li>
          <li>Address: ${result.address}</li>
          <li>City: ${result.city}</li>
        </ul>
        <p><strong>Shipping Information</strong></p>
        <ul>
          <li>Full Name: ${result.shippingInfo.name.firstName} ${result.shippingInfo.name.lastName}</li>
          <li>Phone Number: ${result.shippingInfo.phone}</li>
          <li>Email: ${result.shippingInfo.email}</li>
          <li>Address: ${result.shippingInfo.address}</li>
          <li>City: ${result.shippingInfo.city}</li>
        </ul>
        <br/>

        <p>Thank you for shopping with us.</p><br/>
        <img src="https://res.cloudinary.com/mikejuwon/image/upload/v1666708917/botaniclife-logo_zoyusw.png" alt="Botanic Life" width="150" height="70"></img>
        <br/>
      <p>Best Regards,</p>
      <p>Botanic Life</p>
    `,
  };
  await sgMail.send(message);
};

async function sendMailNewUser (savedUser, subject, result, token) {
      // send email to user
      const msg = {
        to: savedUser.email,
        from: process.env.SENDGRID_SENDER,
        subject: subject,
        html: `
        <h1>Thank you for shopping and signing up with us!</h1>
        <p>Hi ${savedUser.name.firstName},</p>
        <p>Your order has been received and is being processed. Your order details are shown below for your reference:</p>
        <ul>
          <strong><li>Order Number: ${result.orderNumber}</li></strong>
          <strong><li>Order Date: ${result.createdAt}</li></strong>
          <strong><li>Order Total: ₦${result.amount.toLocaleString()}</li></strong>
          <strong><li>Payment Method: ${result.paymentMethod}</li></strong>
          <strong><li>Order Status: ${result.status}</li></strong>
          <strong><li>Payment Status: ${result.paymentStatus}</li></strong>
          <strong><li>Note: ${result.note}</li></strong>
        </ul>
        <br/>
        <p><strong>Billing Information</strong></p>
        <ul>
          <li>Full Name: ${result.name.firstName} ${result.name.lastName}</li>
          <li>Phone Number: ${result.phone}</li>
          <li>Email: ${result.email}</li>
          <li>Address: ${result.address}</li>
          <li>City: ${result.city}</li>
        </ul>
        <p><strong>Shipping Information</strong></p>
        <ul>
          <li>Full Name: ${result.shippingInfo.name.firstName} ${result.shippingInfo.name.lastName}</li>
          <li>Phone Number: ${result.shippingInfo.phone}</li>
          <li>Email: ${result.shippingInfo.email}</li>
          <li>Address: ${result.shippingInfo.address}</li>
          <li>City: ${result.shippingInfo.city}</li>
        </ul>
        <br/>            
        <p>Thank you for shopping with us.</p>
        <p>And as you requested, an account has been created for you.</p>
        <h3>Verify Your Account</h3>
        <p>Please click the link below to activate your account immediately.</p>
        <a href="http://${req.headers.host}/user/activate/${savedUser._id}/${token}">Activate Account</a>
        <p>You can also copy and paste the link below into your browser to activate your account.</p>
        <p>Note: This link expires in 7 days.</p>
        <br>
        
        <img src="https://res.cloudinary.com/mikejuwon/image/upload/v1666708917/botaniclife-logo_zoyusw.png" alt="Botanic Life" width="100" height="50"></img><br/>
        <p>Best Regards,</p>
        <p>Botanic Life</p>
        `,
    };
    await sgMail.send(msg);
};

async function sendMailAnonymous (email, firstName, lastName, subject, result, req) {

  const msg = {
    to: email,
    from: process.env.SENDGRID_SENDER,
    subject: subject,
    html: `
      <h3>Thank you for shopping with us!</h3>
        <p>Hi ${firstName} ${lastName},</p>
        <p>Your order has been received and is being processed. Your order details are shown below for your reference:</p>
        <ul>
          <strong><li>Order Number: ${result.orderNumber}</li></strong>
          <strong><li>Order Date: ${result.createdAt}</li></strong>
          <strong><li>Order Total: ₦${result.amount.toLocaleString()}</li></strong>
          <strong><li>Payment Method: ${result.paymentMethod}</li></strong>
          <strong><li>Order Status: ${result.status}</li></strong>
          <strong><li>Payment Status: ${result.paymentStatus}</li></strong>
          <strong><li>Note: ${result.note}</li></strong>
        </ul>
        <br/>
        <p><strong>Billing Information</strong></p>
        <ul>
          <li>Full Name: ${result.name.firstName} ${result.name.lastName}</li>
          <li>Phone Number: ${result.phone}</li>
          <li>Email: ${result.email}</li>
          <li>Address: ${result.address}</li>
          <li>City: ${result.city}</li>
        </ul>
        <p><strong>Shipping Information</strong></p>
        <ul>
          <li>Full Name: ${result.shippingInfo.name.firstName} ${result.shippingInfo.name.lastName}</li>
          <li>Phone Number: ${result.shippingInfo.phone}</li>
          <li>Email: ${result.shippingInfo.email}</li>
          <li>Address: ${result.shippingInfo.address}</li>
          <li>City: ${result.shippingInfo.city}</li>
        </ul>
        <br/>
        <p>You can track your order by contacting our customer service team on <a href="tel:+234 908 599 7938">+234 908 599 7938</a> or by sending an email to
        <a href="mailto:info@botaniclife.ng">info@botaniclife.ng</a></p>
        <p>Alternatively, you can go to this link below to track your order.</p>
        <a href="http://${req.headers.host}/track-order/${result._id}">Track Order</a>
        <p><strong>Note:</strong> Once your order has been delivered, you can download the sales invoice from this page also.</p>

        <p>You can also visit our website for more information.</p>
        <br>
        <img src="https://res.cloudinary.com/mikejuwon/image/upload/v1666708917/botaniclife-logo_zoyusw.png" alt="Botanic Life" width="150" height="70"></img>
        <br/>
      <p>Best Regards,</p>
      <p>Botanic Life</p>
    `,
  };
  await sgMail.send(msg);
};


export const addToCart = async (req, res) => {
  const user = req.session.user;
  const productID = req.params.id;
  const quantity = req.body.quantity;

  const product = await conn.botanicAdmin
    .collection("products")
    .findOne({ _id: new ObjectID(productID) });

  // if product is not in stock or quantity is not available or quantity is greater than stock
  if (product.quantity === 0 || quantity > product.quantity) {
    // return to the page with error message
    req.flash("error", "Product is not in stock or quantity is not available!");
    return res.redirect("../product/" + productID);
  } else {

  const cart = new Cart(req.session.cart ? req.session.cart : {});
  cart.add(product, product._id, quantity);
  req.session.cart = cart;

  // generate cart items
  const cartItems = cart.generateArray();
  // if user is logged in, save cart to database
  if (user) {
    await User.findByIdAndUpdate(user._id, {
      cart: cartItems,
    });
  }
  req.flash("error", "Product added to cart");
  res.redirect("../product/" + productID);
  }
};

export const removeFromCart = async (req, res) => {
  const user = req.session.user;
  const productID = req.params.id;
  const cart = new Cart(req.session.cart ? req.session.cart : {});
  const cartItems = cart.generateArray();
  cart.removeItem(productID);
  req.session.cart = cart;

  // if user is logged in, remove item from cart in database
  if (user) {
    cartItems.find(async (item) => {
      if (item.item._id.toString() === productID) {
        await User.findByIdAndUpdate(user._id, {
          $pull: { cart: { item: item.item._id } },
        });
      }
    });
  }
  req.flash("error", "Product removed from cart!");
  res.redirect("../view-cart");
};

export const checkOutPage = async (req, res) => {
  const user = req.session.user;
  let cart = new Cart(req.session.cart ? req.session.cart : {});
  let cartItems = cart.generateArray();
  res.render("pages/checkout-page", {
    flash: req.flash("success"),
    cartItems,
    cart,
    user,
    errors: [],
    _,
  });
};

export const payOnDelivery = async (req, res) => {
  const user = req.session.user;
  let cart = new Cart(req.session.cart ? req.session.cart : {});
  let cartItems = cart.generateArray();
  let orderNumber = genCode(12);

  const { firstName, lastName, email, phone, address, city, note, createAccount, sameAsBilling,
    shipping_firstName, shipping_lastName, shipping_email, shipping_phone, shipping_address, shipping_city } = req.body;

  const errors = [];

  if (!firstName || !lastName || !email || !phone || !address || !city) {
    errors.push({ message: "Error occurred!!! All fields are required and must be provided accurately!" });
  }

  // check if user did not check the sameAsBilling checkbox and shipping details are not provided
  if (!sameAsBilling && (!shipping_firstName || !shipping_lastName || !shipping_email || !shipping_phone || !shipping_address || !shipping_city)) {
    errors.push({ message: "Error occurred!!! Shipping details are required!" });
  }

  // check if cart is empty
  if (cartItems.length === 0) {
    errors.push({ message: "Cart is empty!" });
  }

  if (errors.length > 0) {
    res.render("pages/checkout-page", {
      flash: req.flash("success"),
      errors,
      cartItems,
      cart,
      user,
      _,
    });
  } else {

  const shippingInfo = {
    name: {
      firstName: sameAsBilling ? firstName : shipping_firstName,
      lastName: sameAsBilling ? lastName : shipping_lastName,
    },
    email: sameAsBilling ? email : shipping_email,
    phone: sameAsBilling ? phone : shipping_phone,
    address: sameAsBilling ? address : shipping_address,
    city: sameAsBilling ? city : shipping_city,
  };

  const order = new Order({
    products: cartItems,
    cart: cart,
    address: address,
    name: {
      firstName: firstName,
      lastName: lastName,
    },
    email: email,
    amount: cart.totalPrice,
    phone: phone,
    city: city,
    note: note,
    orderNumber: orderNumber,
    paymentStatus: "unpaid",
    paymentId: "",
    paymentMethod: "pay on delivery",
    shippingInfo: shippingInfo,
  });

    if (req.session.user) {
      const user = await User.findOne({ _id: req.session.user._id });
      order.save((err, result) => {
        if (err) {
          console.log(err);
        }

        User.findOneAndUpdate(
          { _id: req.session.user._id },
          { $push: { orders: result._id } },
          (err, data) => {
            if (err) {
              console.log(err);
            }
          }
        );
      
      // update product quantity in database
      const items = result.products;
        items.map(async (item) => {
            const product = await conn.botanicAdmin.collection("products").findOne({ _id: new ObjectID(item.item._id) });
            const newStock = product.quantity - item.qty;
            await conn.botanicAdmin.collection("products").updateOne({ _id: new ObjectID(item.item._id) }, { $set: { quantity: newStock } });
        });

      sendMail(user, "Order Confirmation", result);

      // call the sendMessage function and pass req.session.user as user, order as order and subject as subject
      sendMessage(user, "Order Confirmation", result);

      req.flash("error", "Your order has been placed successfully!");
      req.session.cart = null;
      return res.redirect("../dashboard");
    });
  } else {

    User.findOne({ email: email }, (err, user) => {
      if (err) {
        console.log(err);
      }

      if (user) {
        order.save((err, result) => {
          if (err) {
            console.log(err);
          }
        // update user orders
          User.findOneAndUpdate(
            { email: email },
            { $push: { orders: result._id } },
            (err, data) => {
              if (err) {
                console.log(err);
              }
            }
          );

          // update product quantity in database
          const items = result.products;
          items.map(async (item) => {
              const product = await conn.botanicAdmin.collection("products").findOne({ _id: new ObjectID(item.item._id) });
              const newStock = product.quantity - item.qty;
              await conn.botanicAdmin.collection("products").updateOne({ _id: new ObjectID(item.item._id) }, { $set: { quantity: newStock } });
          });
        
        // if the user exist in the database, send the email to the user
        sendMail(user, "Order Confirmation", result);
        sendMessage(user, "Order Confirmation", result);
        req.session.cart = null;
        req.flash("error", "Order placed successfully! Login to view and track your order.");
        return res.redirect("../login");

      });
    } else if (!user && createAccount) {
      order.save((err, result) => {
        if (err) {
          console.log(err);
        }
        // if the user does not exist in the database, create a new user
        const user = new User({
          email: email,
          address: address,
          name: {
            firstName: firstName,
            lastName: lastName,
          },
          phone: phone,
          city: city,
          orders: [result._id],
        });
        
        
        user.save((err, savedUser) => {
          if (err) {
            console.log(err);
          }
  
          const token = jwt.sign({ _id: savedUser._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
          });
  
          sendMailNewUser(savedUser, "Verify Your BotanicLife Account", result, token);
        
        });

        // update product quantity in database
        const items = result.products;
        items.map(async (item) => {
            const product = await conn.botanicAdmin.collection("products").findOne({ _id: new ObjectID(item.item._id) });
            const newStock = product.quantity - item.qty;
            await conn.botanicAdmin.collection("products").updateOne({ _id: new ObjectID(item.item._id) }, { $set: { quantity: newStock } });
        });
        req.session.cart = null;
        req.flash("success", "Your order has been placed successfully and your account has been created! Check your email immediately for further instructions.");
        return res.redirect("/checkout");
      });
    } else if (!user && !createAccount) {
      order.save((err, result) => {
        if (err) {
          console.log(err);
        }

        // update product quantity in database
        const items = result.products;
        items.map(async (item) => {
            const product = await conn.botanicAdmin.collection("products").findOne({ _id: new ObjectID(item.item._id) });
            const newStock = product.quantity - item.qty;
            await conn.botanicAdmin.collection("products").updateOne({ _id: new ObjectID(item.item._id) }, { $set: { quantity: newStock } });
        });
        
        sendMailAnonymous(email, firstName, lastName, "Order Confirmation", result, req);
        req.session.cart = null;
        req.flash("success", "Your order has been placed successfully! Check your email immediately for further instructions.");
        return res.redirect("/checkout");
      });

    }
  });
    
  }
}
};

export const activateAccountPage = async (req, res) => {
  const { id, token } = req.params;

  // check if user is already verified
  const user = await User.findOne({ _id: id });
  if (user.isActivated) {
    req.flash("error", "Your account is already activated. You can now login.");
    return res.redirect("/login");
  } else {
    try {
    const user = await User.findOne({ _id: id });
    res.render("auth/activate", {
      flash: req.flash("success"),
      user,
      token,
    });
    } catch (error) {
    console.log(error);
    }
  }
}

export const activateAccount = async (req, res) => {
  const { id, token } = req.params;
  const { email, password } = req.body;

  const hashedPass = await hashPassword(password);

  try {
    const user = await User.findOne({ _id: id });
    if (user) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded) {
        // find user and set the user's password and update the isActivated field to true
        const updatedUser = await User.findOneAndUpdate(
          { _id: id },
          { $set: { password: hashedPass, isActivated: true } },
          { new: true }
        );
        if (updatedUser) {
          // save message to the database
          const msg = {
            name: updatedUser.name.firstName + ' ' + updatedUser.name.lastName,
            email: updatedUser.email,
            subject: 'Welcome to BotanicLife',
            message: 'Thank you for signing up with us. We are glad to have you on board. You can now start shopping.',
          }

          await conn.botanicAdmin.collection('messages').insertOne(msg);

          req.flash("error", "Account activated successfully! Login to continue.");
          return res.redirect("../login");
        }

        req.flash("error", "Sorry! We could not activate your account. Please try again.");
        return res.redirect("../login");        
      }
    }
  } catch (error) {
    console.log(error);
  }
};

// paying with paystack
export const payWithPaystack = async (req, res) => {
  let cart = new Cart(req.session.cart ? req.session.cart : {});
  let cartItems = cart.generateArray();

  // const { email, address, firstName, lastName, phone, city } = req.body;
  const { firstName, lastName, email, phone, address, city, note, createAccount, sameAsBilling,
    shipping_firstName, shipping_lastName, shipping_email, shipping_phone, shipping_address, shipping_city } = req.body;

  // check if cart is empty
  if (cartItems.length === 0) {
    req.flash("success", "Your cart is empty!");
    return res.redirect("/checkout");
  }

  if (!sameAsBilling && (!shipping_firstName || !shipping_lastName || !shipping_email || !shipping_phone || !shipping_address || !shipping_city)) {
    req.flash("success", "Please fill in all the shipping details.");
    return res.redirect("/checkout");
  }
  // validations
  if (!email || !address || !firstName || !lastName || !phone || !city) {
    req.flash("success", "All fields are required!.");
    return res.redirect("/checkout");
  } else {
    const form = _.pick(req.body, [
      "amount",
      "email",
      "firstName",
      "lastName",
      "phone",
      "address",
      "city",
      "note",
      "createAccount",
      "sameAsBilling",
      "shipping_firstName",
      "shipping_lastName",
      "shipping_email",
      "shipping_phone",
      "shipping_address",
      "shipping_city",
    ],
    );
      
      form.metadata = {
        custom_fields: [
          {
            display_name: "First Name",
            variable_name: "firstName",
            value: form.firstName,
          },
          {
            display_name: "Last Name",
            variable_name: "lastName",
            value: form.lastName,
          },
          {
            display_name: "Phone Number",
            variable_name: "phone",
            value: form.phone,
          },
          {
            display_name: "Address",
            variable_name: "address",
            value: form.address,
          },
          {
            display_name: "City",
            variable_name: "city",
            value: form.city,
          },
          {
            display_name: "Note",
            variable_name: "note",
            value: form.note,
          },
          {
            display_name: "Create Account",
            variable_name: "createAccount",
            value: form.createAccount,
          },
          {
            display_name: "Same As Billing",
            variable_name: "sameAsBilling",
            value: form.sameAsBilling,
          },
          {
            display_name: "Shipping First Name",
            variable_name: "shipping_firstName",
            value: form.shipping_firstName,
          },
          {
            display_name: "Shipping Last Name",
            variable_name: "shipping_lastName",
            value: form.shipping_lastName,
          },
          {
            display_name: "Shipping Email",
            variable_name: "shipping_email",
            value: form.shipping_email,
          },
          {
            display_name: "Shipping Phone",
            variable_name: "shipping_phone",
            value: form.shipping_phone,
          },
          {
            display_name: "Shipping Address",
            variable_name: "shipping_address",
            value: form.shipping_address,
          },
          {
            display_name: "Shipping City",
            variable_name: "shipping_city",
            value: form.shipping_city,
          },
        ],
      };
  
    form.amount *= 100;
    paystack.initializePayment(form, (error, body) => {
        if (error) {
          // handle errors
          console.log(error);
          return;
        } else {
        const response = JSON.parse(body);
        if (response.status) {
          // redirect to page to complete payment
          return res.redirect(response.data.authorization_url);
        } else {
          //handle errors
          console.log(response.message);
          return res.redirect("/error");
        }
      }
      });
  }  
};

// verify payment
export const verifyPayment = async (req, res) => {
  let cart = new Cart(req.session.cart ? req.session.cart : {});
  let cartItems = cart.generateArray();
  let orderNumber = genCode(12);
  const ref = req.query.reference;

  paystack.verifyPayment(ref, async (error, body) => {
    if (error) {
      // handle errors appropriately
      console.log(error);
      return;
    }
    const response = JSON.parse(body);
    // console.log(response);
    const data = _.at(response.data, [
      "reference",
      "amount",
      "channel",
      "authorization.card_type",
      "authorization.last4",
      "authorization.bank",
      "authorization.brand",
      "customer.email",
      "metadata.custom_fields[0].value",
      "metadata.custom_fields[1].value",
      "metadata.custom_fields[2].value",
      "metadata.custom_fields[3].value",
      "metadata.custom_fields[4].value",
      "metadata.custom_fields[5].value",
      "metadata.custom_fields[6].value",
      "metadata.custom_fields[7].value",
      "metadata.custom_fields[8].value",
      "metadata.custom_fields[9].value",
      "metadata.custom_fields[10].value",
      "metadata.custom_fields[11].value",
      "metadata.custom_fields[12].value",
      "metadata.custom_fields[13].value",
    ]);
    const [reference, amount, channel, cardType, last4, bank, brand, email, firstName, lastName, phone, address, city, note, createAccount, 
    sameAsBilling, shipping_firstName, shipping_lastName, shipping_email, shipping_phone, shipping_address, shipping_city] = data;

    const shippingInfo = {
      name: {
        firstName: sameAsBilling ? firstName : shipping_firstName,
        lastName: sameAsBilling ? lastName : shipping_lastName,
      },
      email: sameAsBilling ? email : shipping_email,
      phone: sameAsBilling ? phone : shipping_phone,
      address: sameAsBilling ? address : shipping_address,
      city: sameAsBilling ? city : shipping_city,
    };
    // create new order
    const order = new Order({
      orderNumber,
      amount: amount / 100,
      email,
      name: {
        firstName,
        lastName,
      },
      phone,
      address,
      city,
      note,
      cart: cart,
      products: cartItems,
      paymentId: reference,
      paymentStatus: "Paid",
      paymentMethod: `${channel} - ${brand}`,
      paymentDetails: {
        cardType,
        last4,
        bank,
      },
      shippingInfo,
    });

    // check if user is logged in, then save the order and send email
    if (req.session.user) {
      const user = await User.findOne({ _id: req.session.user._id });
      order.save((err, result) => {
        if (err) {
          console.log(err);
        }

        User.findOneAndUpdate(
          { _id: req.session.user._id },
          { $push: { orders: result._id } },
          (err, data) => {
            if (err) {
              console.log(err);
            }
          }
        );

        // update product quantity in database
        const items = result.products;
        items.map(async (item) => {
            const product = await conn.botanicAdmin.collection("products").findOne({ _id: new ObjectID(item.item._id) });
            const newStock = product.quantity - item.qty;
            await conn.botanicAdmin.collection("products").updateOne({ _id: new ObjectID(item.item._id) }, { $set: { quantity: newStock } });
        });

      // send email to user
      sendMail(user, "Order Confirmation", result)
      sendMessage(user, "Order Confirmation", result);
      req.flash("error", "Your order has been placed successfully!");
      req.session.cart = null;
      return res.redirect("../dashboard");
    });
    } else {
      // if user is not logged in, then check if the user exists in the database, if user exists then save the order and send email
      User.findOne({ email: email }, (err, user) => {
        if (err) {
          console.log(err);
        }
  
        if (user) {
          order.save((err, result) => {
            if (err) {
              console.log(err);
            }
          // update user orders
            User.findOneAndUpdate(
              { email: email },
              { $push: { orders: result._id } },
              (err, data) => {
                if (err) {
                  console.log(err);
                }
              }
            );

            // update product quantity in database
            const items = result.products;
            items.map(async (item) => {
                const product = await conn.botanicAdmin.collection("products").findOne({ _id: new ObjectID(item.item._id) });
                const newStock = product.quantity - item.qty;
                await conn.botanicAdmin.collection("products").updateOne({ _id: new ObjectID(item.item._id) }, { $set: { quantity: newStock } });
            });
          
          // if the user exist in the database, send the email to the user
          sendMail(user, "Order Confirmation", result);
          sendMessage(user, "Order Confirmation", result);
          req.session.cart = null;
          req.flash("error", "Order placed successfully! Login to view and track your order.");
          return res.redirect("../login");
  
        });     
    } else  if (!user && createAccount) {
      order.save((err, result) => {
        if (err) {
          console.log(err);
        }
        // if the user does not exist in the database, create a new user
        const user = new User({
          email: email,
          address: address,
          name: {
            firstName: firstName,
            lastName: lastName,
          },
          phone: phone,
          city: city,
          orders: [result._id],
        });
        
        
        user.save((err, savedUser) => {
          if (err) {
            console.log(err);
          }
  
          const token = jwt.sign({ _id: savedUser._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
          });  
          sendMailNewUser(savedUser, "Verify Your BotanicLife Account", result, token);
        
        });

        // update product quantity in database
        const items = result.products;
        items.map(async (item) => {
            const product = await conn.botanicAdmin.collection("products").findOne({ _id: new ObjectID(item.item._id) });
            const newStock = product.quantity - item.qty;
            await conn.botanicAdmin.collection("products").updateOne({ _id: new ObjectID(item.item._id) }, { $set: { quantity: newStock } });
        });
        req.session.cart = null;
        req.flash("success", "Your order has been placed successfully and your account has been created! Check your email immediately for further instructions.");
        return res.redirect("/checkout");
      });
    } else if (!user && !createAccount) {
      order.save((err, result) => {
        if (err) {
          console.log(err);
        }

        // update product quantity in database
        const items = result.products;
        items.map(async (item) => {
            const product = await conn.botanicAdmin.collection("products").findOne({ _id: new ObjectID(item.item._id) });
            const newStock = product.quantity - item.qty;
            await conn.botanicAdmin.collection("products").updateOne({ _id: new ObjectID(item.item._id) }, { $set: { quantity: newStock } });
        });

        sendMailAnonymous(email, firstName, lastName, "Order Confirmation", result, req);
        req.session.cart = null;
        req.flash("success", "Your order has been placed successfully! Check your email immediately for further instructions.");
        return res.redirect("/checkout");
      });

    }

  });
}
  });
}

export const printInvoice = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id });
  const user = await User.findOne({ email: order.email });

  // generate qr code
  // const qrCode = await QRCode.toDataURL(order.orderNumber.toString());
  // generate barcode
  const barcode = await bwipjs.toBuffer({
    bcid: "code128", // Barcode type
    text: order.orderNumber.toString(), // Text to encode
    scale: 2, // 3x scaling factor
    height: 10, // Bar height, in millimeters
    includetext: true, // Show human-readable text
    textxalign: "center", // Always good to set this
  });
  const barcodeData = `data:image/png;base64,${barcode.toString("base64")}`;
  // generate qr code to redirect to order page
  const qrCode = await QRCode.toDataURL(
    `http://${req.headers.host}/track-order/${order._id}`
  );

  // check if the order has been delivered
  if (order.status !== 'delivered') {
    return res.rediret('../404');
  } else {
    res.render("pages/invoice", { 
      user,
      order,
      moment,
      qrCode,
      barcodeData,
      _,
     });
  }

};

export const trackOrderPage = async (req, res) => {
  let cart = new Cart(req.session.cart ? req.session.cart : {});
  let cartItems = cart.generateArray();
  const order = await Order.findOne({ _id: req.params.id });
  const user = await User.findOne({ email: order.email });
  
  res.render("pages/track-order", { user, order, cart, cartItems, moment, _ });
};
