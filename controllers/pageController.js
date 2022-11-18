const conn = require("../config/database");
import _ from "lodash";
import request from "request";
// ObjectID from mongodb
const ObjectID = require("mongodb").ObjectId;
import moment from "moment";
import Cart from "../models/Cart";
import User from "../models/users";
import Redistribution from "../models/redistribution";




export const homePage = async (req, res) => {
  // res.render(path.join(__dirname, "../views/index.html"));

  // check for user
  const user = req.session.user;
  // find all the products
  const products = await conn.botanicAdmin
    .collection("products")
    .find({})
    .toArray();
  // get only the last 3 blogs from the blogs collection
  const blogs = await conn.botanicAdmin
    .collection("blogs")
    .find({})
    .sort({ _id: -1 })
    .limit(3)
    .toArray();
  // get only the last 3 added testimonies from the testimonies collection
  const testimonies = await conn.botanicAdmin
    .collection("testimonies")
    .find({})
    .sort({ _id: -1 })
    .limit(3)
    .toArray();

  // get the cart from the session
  let cart = new Cart(req.session.cart ? req.session.cart : {});
  // get the cart items
  let cartItems = cart.generateArray();
  // // get the total price of the cart
  // let totalPrice = cart.totalPrice;
  // // get the total quantity of the cart
  // let totalQty = cart.totalQty;

  // get the objects from the array cart
  // let cartObjects = cartItems.map(item => {
  //     return {
  //         id: item.item._id,
  //         name: item.item.name,
  //         price: item.item.price,
  //         image: item.item.image,
  //         quantity: item.qty,
  //         total: item.price
  //     }
  // });

  // console.log(cartObjects, totalPrice, totalQty);

  // if user is logged in, get the user cart
  // const userCart = User.findOne({ email: user.email }, (err, user) => {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     return user.cart;
  //   }
  // });

  res.render("pages/index", {
    products,
    blogs,
    moment,
    testimonies,
    cartItems,
    cart,
    user,
    // userCart,
    _,
  });
};

export const cartPage = async (req, res) => {
  const user = req.session.user;
  let cart = new Cart(req.session.cart ? req.session.cart : {});
  let cartItems = cart.generateArray();
  res.render("pages/cart-page", {
    flash: req.flash("error"),
    errors: [],
    cartItems,
    cart,
    user,
    _,
  });
};

export const aboutPage = (req, res) => {
  const user = req.session.user;
  let cart = new Cart(req.session.cart ? req.session.cart : {});
  let cartItems = cart.generateArray();
  res.render("pages/about", {
    cartItems,
    cart,
    user,
    _,
  });
};

export const productsPage = async (req, res) => {
  const user = req.session.user;
  let cart = new Cart(req.session.cart ? req.session.cart : {});
  let cartItems = cart.generateArray();
  const products = await conn.botanicAdmin
    .collection("products")
    .find({})
    .toArray();
  res.render("pages/products", {
    flash: req.flash("success"),
    products,
    errors: [],
    cartItems,
    cart,
    user,
    _,
  });
};

export const contactPage = (req, res) => {
  const user = req.session.user;
  let cart = new Cart(req.session.cart ? req.session.cart : {});
  let cartItems = cart.generateArray();
  res.render("pages/contact", {
    flash: req.flash("error"),
    errors: [],
    cartItems,
    cart,
    user,
    _,
  });
};

export const singleProduct = async (req, res) => {
  const user = req.session.user;
  let cart = new Cart(req.session.cart ? req.session.cart : {});
  let cartItems = cart.generateArray();
  const productID = req.params.id;
  const product = await conn.botanicAdmin
    .collection("products")
    .findOne({ _id: new ObjectID(productID) });
  
  // find other products
  const otherProducts = await conn.botanicAdmin.collection('products').find({
    _id: {
      $ne: new ObjectID(productID)
    }
  }).toArray();

  // check if the product is in the cart
  let inCart = false;
  if (cartItems.length > 0) {
    cartItems.forEach(item => {
      if (item.item._id == productID) {
        inCart = true;
      }
    });
  }

  res.render("pages/single-product", {
    flash: req.flash("error"),
    errors: [],
    inCart,
    product,
    otherProducts,
    moment,
    cartItems,
    cart,
    user,
    _,
  });
};

export const blogPage = async (req, res) => {
  const user = req.session.user;
  let cart = new Cart(req.session.cart ? req.session.cart : {});
  let cartItems = cart.generateArray();

  // pagination
  const page = req.query.page || req.params.page || 1;
  const perPage = 3;
  const skip = (page - 1) * perPage;
  const currentPage = page;
  const blogs = await conn.botanicAdmin.collection('blogs').find({}).sort({ _id: -1 }).skip(skip).limit(perPage).toArray();

  // get the total number of blogs
  const totalBlogs = await conn.botanicAdmin.collection('blogs').countDocuments();

  // get 3 most recent blogs
  const recentBlogs = await conn.botanicAdmin.collection('blogs').find({}).sort({ _id: -1 }).limit(3).toArray();

  res.render("pages/blogs", {
    flash: req.flash("error"),
    errors: [],
    blogs,
    recentBlogs,
    moment,
    cartItems,
    cart,
    user,
    _,
    current: currentPage,
    pages: Math.ceil(totalBlogs / perPage),
  });  
  
};

export const blogSingle = async (req, res) => {
  const user = req.session.user;
  let cart = new Cart(req.session.cart ? req.session.cart : {});
  let cartItems = cart.generateArray();
  const blogID = req.params.id;
  const blog = await conn.botanicAdmin
    .collection("blogs")
    .findOne({ _id: new ObjectID(blogID) });
  // pick other posts apart from the current one
  const recentBlogs = await conn.botanicAdmin
    .collection("blogs")
    .find({ _id: { $ne: new ObjectID(blogID) } })
    .sort({ _id: -1 })
    .limit(3)
    .toArray();
  // pick random blog from the latest blogs
  // const randomBlogs = _.sample(otherBlogs);

  // update the views
  await conn.botanicAdmin.collection('blogs').updateOne({ _id: new ObjectID(blogID) }, {
    $inc: {
      views: 1
    }
  });

  // comments
  const comments = await conn.botanicAdmin.collection('comments').find({ blogId: ObjectID(blog._id) }).toArray();

  res.render("pages/single-blog", {
    flash: req.flash("success"),
    errors: [],
    blog,
    comments,
    recentBlogs,
    moment,
    cartItems,
    cart,
    user,
    _,
  });
};

export const addComment = async (req, res) => {
  if (
    !req.body.captcha ||
    req.body.captcha === "" ||
    req.body.captcha === undefined ||
    req.body.captcha === null
  ) {
    return res.json({
      success: false,
      msg: "Please select captcha",
    });
  } else {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`;
    request(verifyUrl, async (err, response, body) => {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
        return res.json({
          success: false,
          msg: "Failed captcha verification",
        });
      } else {
        const { name, email, comment, blogId } = req.body;

        if (!name || !email || !comment) {
          return res.json({
            success: false,
            msg: "All fields are required",
          });
        }

        const blog = await conn.botanicAdmin.collection('blogs').findOne({ _id: new ObjectID(blogId) });

        // add comment
        const newComment = {
          blogId: blog._id,
          comment,
          commentBy: {
            name,
            email
          },
          commentDate: new Date()
        }

        await conn.botanicAdmin.collection('comments').insertOne(newComment)
          .then(() => {
            conn.botanicAdmin.collection('blogs').updateOne({ _id: new ObjectID(blog._id) }, {
              $inc: {
                comments: 1
              }
            });
            return res.json({
              success: true,
              msg: 'Comment added successfully'
            });         

          })
          .catch(err => {
            req.flash('success', 'Something went wrong');
            res.redirect(`/blog/${blog._id}`);
          });
      }
    });
  }
  
};

export const addReply = async (req, res) => {
  const blogId = new ObjectID(req.params.blogId);
  const { name, email, reply } = req.body;
  const comment = await conn.botanicAdmin.collection('comments').findOne({ _id: new ObjectID(req.params.commentId) });

  if (!name || !email || !reply) {
    req.flash('success', 'Error occurred! All fields are required to reply.');
    return res.redirect(`/blog/${blogId}`);
  }

  const newReply = {
    reply,
    replyBy: {
      name,
      email
    },
    replyDate: new Date()
  }

  await conn.botanicAdmin.collection('comments').updateOne({ _id: new ObjectID(comment._id) }, {
    $push: {
      commentReplies: newReply
    }
  })
    .then(() => {
      req.flash('success', 'Reply added successfully');
      return res.redirect(`/blog/${blogId}`);
    })
    .catch(err => {
      req.flash('success', 'Something went wrong');
      res.redirect(`/blog/${blogId}`);
    });
};

export const nextPost = async (req, res) => {
  // get the id of the current post
  const currentPostID = req.params.id;
  // get the next post
  const nextPost = await conn.botanicAdmin.collection("blogs").findOne({
    _id: { $gt: new ObjectID(currentPostID) },
  });
  // if there is no next post, redirect to the current post
  if (!nextPost) {
    res.redirect(`/blog/${currentPostID}`);
  } else {
    res.redirect(`/blog/${nextPost._id}`);
  }
};

export const previousPost = async (req, res) => {
  // get the id of the current post
  const currentPostID = req.params.id;
  // get the previous post
  const previousPost = await conn.botanicAdmin.collection("blogs").findOne({
    _id: { $lt: new ObjectID(currentPostID) },
  });
  // if there is no previous post, redirect to the current post
  if (!previousPost) {
    res.redirect(`/blog/${currentPostID}`);
  } else {
    res.redirect(`/blog/${previousPost._id}`);
  }
};

export const shareOnFacebook = async (req, res) => {
  // get the id of the current post
  const currentPostID = req.params.id;

  const url = `http://${req.headers.host}/blog/${currentPostID}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  res.redirect(facebookUrl);
};

export const shareOnTwitter = async (req, res) => {
  // get the id of the current post
  const currentPostID = req.params.id;

  const url = `http://${req.headers.host}/blog/${currentPostID}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${url}`;
  res.redirect(twitterUrl);
};

export const shareOnLinkedIn = async (req, res) => {
  // get the id of the current post
  const currentPostID = req.params.id;

  const url = `http://${req.headers.host}/blog/${currentPostID}`;
  const linkedInUrl = `https://www.linkedin.com/shareArticle?url=${url}`;
  res.redirect(linkedInUrl);
};

export const shareOnWhatsApp = async (req, res) => {
  // get the id of the current post
  const currentPostID = req.params.id;

  const url = `http://${req.headers.host}/blog/${currentPostID}`;
  const whatsAppUrl = `https://api.whatsapp.com/send?text=${url}`;
  res.redirect(whatsAppUrl);
};

export const shareOnSkype = async (req, res) => {
  // get the id of the current post
  const currentPostID = req.params.id;

  const url = `http://${req.headers.host}/blog/${currentPostID}`;
  const skypeUrl = `https://web.skype.com/share?url=${url}`;
  res.redirect(skypeUrl);
};

export const errorPage = async (req, res) => {
  const user = req.session.user;
  let cart = new Cart(req.session.cart ? req.session.cart : {});
  let cartItems = cart.generateArray();

  // link that returns to the previous page
  const backLink = req.headers.referer;


  res.render("pages/404-page", {
    user, cart, cartItems, _, backLink
  })
};

export const returnPolicy = async (req, res) => {
  res.redirect('/error');
};

export const termsAndConditions = async (req, res) => {
  res.redirect('/error');
};

export const productReturns = async (req, res) => {
  res.redirect('/error');
};

export const wholesalePolicy = async (req, res) => {
  res.redirect('/error');
};

export const redistributionRequest = async (req, res) => {
  const { name, email, phone, address, subject, message } = req.body;

  if (!name || !email || !phone || !address || !subject || !message) {
    req.flash('error', 'Error occurred! All fields are required.');
    return res.redirect('/contact');
  } else {
    const newRequest = new Redistribution({
      name,
      email,
      phone,
      address,
      subject,
      message
    });

    await newRequest.save();

    req.flash('error', 'Your request has been submitted successfully. We will get back to you shortly.');
    return res.redirect('/contact');
  }
};