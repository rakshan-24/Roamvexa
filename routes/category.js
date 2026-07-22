const express = require("express");
const router = express.Router();
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const wrapAsync = require("../utils/wrapAsync.js");

const listings = require("../models/listing");




router.get('/category/:category', async(req, res) => {
    try {
        const category = req.params.category;
        const alisting = await listings.find({ category });
        res.render("../views/listings/category.ejs", { category, alisting });
    } catch (err) {
        console.error("Category route failed:", err);
        res.status(500).send("Category data is currently unavailable because MongoDB is not reachable.");
    }
  });


module.exports = router;