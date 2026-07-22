const express = require("express");
const router = express.Router();
const listings = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware-old.js");
const wrapAsync = require("../utils/wrapAsync.js");
let listingController = require("../controller/listing.js");
const multer  = require('multer');
const {storage}=require("../cloudConfig.js");
const upload = multer({ storage });

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn,upload.single('listing[image]'),validateListing, wrapAsync(listingController.createListing));
    //new route
router.get("/new", isLoggedIn, wrapAsync(listingController.rendernewForm));

router.route("/:id")
    .get(wrapAsync(listingController.showsallListings))
    .put(isLoggedIn, isOwner,upload.single('listing[image]'), validateListing, wrapAsync(listingController.updateListing))
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing))




router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.rendereditForm));


module.exports = router;

 




