import express from "express";
import bcrypt from "bcryptjs";
import { User, validateAuth } from "../models/user.js";

const router = express.Router();

// Login Route
router.post("/", async (req, res) => {
  try {
    const { error } = validateAuth(req.body);
    if (error) return res.status(400).json({ error: error.message });

    let user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(400).json({ error: "Invalid email or password" });

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword)
      return res.status(400).json({ error: "Invalid email or password" });

    const accessToken = user.generateAccessToken();
    res.json({
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        subscriptionActive: user.subscriptionActive,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
