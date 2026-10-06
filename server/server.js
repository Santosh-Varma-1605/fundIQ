import dns from "dns";

dns.setServers(["8.8.8.8"]);

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

import connectDB from "./config/db.js";
import { ensureCollections } from "./embeddings/vectorStore.js";
import passport from "./config/passport.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import advisorRoute from "./routes/advisor.js";
import investorProfileRoutes from "./routes/investorProfile.routes.js";
import startupProfileRoutes  from "./routes/startupProfile.routes.js";
import pitchCorrectorRoutes from "./routes/pitchCorrector.routes.js";
import arbiterRoutes from "./routes/arbiter.routes.js";
import smartMatchRoutes from "./routes/smartMatch.routes.js";
import swipeRoutes from "./routes/swipe.routes.js";
// 2. Connect DB
connectDB();
ensureCollections();

// 3. Initialize app
const app = express();

// 4. Core middlewares
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// 5. Passport init BEFORE routes
app.use(passport.initialize());

// 6. Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/advisor", advisorRoute);
app.use("/api/investor", investorProfileRoutes);
app.use("/api/startup",  startupProfileRoutes);
app.use("/api/pitch", pitchCorrectorRoutes);
app.use("/api/arbiter", arbiterRoutes);
app.use("/api", smartMatchRoutes);
app.use("/api", swipeRoutes);
// 7. Health check (optional but useful)
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 8. Start server
const PORT = process.env.PORT || 5000;
process.on("unhandledRejection", (reason, promise) => {
  console.error("\n=== UNHANDLED REJECTION ===");
  console.error(reason);
  console.error("===========================\n");
});

process.on("uncaughtException", (err) => {
  console.error("\n=== UNCAUGHT EXCEPTION ===");
  console.error(err);
  console.error("==========================\n");
});
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log("ENV CHECK:", process.env.MONGO_URI ? "Loaded" : "Missing");
});