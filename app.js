require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const methodoverride = require("method-override");
const path = require("path");
const ExpressError = require("./utils/ExpressError.js");
const ejsMate = require("ejs-mate");
const listings = require("./models/listing.js");

const ListingRouter = require("./routes/listing.js");
const categoryRouter=require("./routes/category.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const searchRouter = require("./routes/search.js");

const session = require("express-session");
const MongoStore = require("connect-mongo").default || require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./models/user.js");
const dbUrl = process.env.ATLASDB_URL || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/wanderlust";
const port = process.env.PORT || 3003;

app.use(methodoverride("_method"));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.urlencoded({ extended: true }));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

const sessionOption = {
  secret: process.env.SECRET || "roamvexa-secret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  },
};

const setupSession = (mongoUrl) => {
  let store;

  if (mongoUrl) {
    store = MongoStore.create({
      mongoUrl,
      crypto: {
        secret: process.env.SECRET || "roamvexa-secret",
      },
      touchAfter: 24 * 60 * 60,
    });

    store.on("error", function (e) {
      console.error("Session store error", e);
    });
  } else {
    console.warn("MongoDB session store unavailable; using default memory store.");
  }

  app.use(session({ ...sessionOption, store }));
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
};

passport.use(new LocalStrategy(User.authenticate()));

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = new User({
              googleId: profile.id,
              email: profile.emails[0].value,
              username:
                profile.displayName || profile.emails[0].value.split("@")[0],
            });
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn("Google OAuth is not configured; skipping Google strategy.");
}

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const localDbUrl = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
  let connectedUrl = null;
  try {
    await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 5000 });
    connectedUrl = dbUrl;
    console.log(`Connected to DB: ${dbUrl}`);
  } catch (err) {
    console.warn(`Failed to connect to primary DB (${dbUrl}), trying local fallback...`);
    try {
      await mongoose.connect(localDbUrl, { serverSelectionTimeoutMS: 5000 });
      connectedUrl = localDbUrl;
      console.log(`Connected to local DB: ${localDbUrl}`);
    } catch (localErr) {
      console.warn("MongoDB connection unavailable; continuing without a persistent session store.", localErr);
      connectedUrl = null;
    }
  }

  setupSession(connectedUrl);
  app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
  });

  app.use("/listings", ListingRouter);
  app.use("/listings/:id", reviewRouter);
  app.use("/", userRouter);
  app.use("/", categoryRouter);
  app.use("/search", searchRouter);

  app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, "Page not Found"));
  });

  app.use((err, req, res, next) => {
    let { statusCode = 404, message = "page Not Found" } = err;
    res.status(statusCode).render("error.ejs", { message });
    next();
  });

  if (require.main === module) {
    app.listen(port, () => {
      console.log(`server started on port ${port}`);
    });
  }
}

main().catch((err) => {
  console.error("Application startup failed:", err);
  process.exit(1);
});

module.exports = app;

