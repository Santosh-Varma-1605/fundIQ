import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Investor from "../models/Investor.js";
import Startup from "../models/Startup.js";

const router = express.Router();

// 🔐 Protected route
router.get("/me", protect, async (req, res) => {
  try {
    const { id, role } = req.user;

    // ✅ Validate role (important)
    if (!["investor", "startup"].includes(role)) {
      return res.status(400).json({ success: false });
    }

    // ✅ Pick correct model
    const Model = role === "investor" ? Investor : Startup;

    // ✅ Fetch user data
    const user = await Model.findById(id).select("firstName lastName email");

    if (!user) {
      return res.status(404).json({ success: false });
    }

    // ✅ Return required data
    return res.json({
      success: true,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
});

export default router;