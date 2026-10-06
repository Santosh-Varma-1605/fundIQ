import dotenv from "dotenv";
dotenv.config(); // ✅ ADD THIS HERE
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import Investor from "../models/Investor.js";
import Startup from "../models/Startup.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true, // ✅ IMPORTANT
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const role = req.query.state || "investor"; // ✅ get role

        const Model = role === "startup" ? Startup : Investor;

        const email = profile.emails[0].value;

        let user = await Model.findOne({ email });

        // create if not exists
        if (!user) {
          user = await Model.create({
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email,
            password: "google-auth",
          });
        }

        // attach role to user object
        user.role = role;

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

export default passport;