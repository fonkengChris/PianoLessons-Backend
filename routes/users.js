import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import _ from "lodash";
import { User, validatePost, validatePut, ROLES } from "../models/user.js";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import emailService from "../services/emailService.js";

const router = express.Router();

// Get all users (admin only)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort("name").select("-password");
    res.send(users);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user profile
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.send(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Register new user
router.post("/", async (req, res) => {
  try {
    const { error } = validatePost(req.body);
    if (error) return res.status(400).json({ error: error.message });

    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).json({ error: "User already exists" });

    user = new User(_.pick(req.body, ["name", "email", "password"]));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    const accessToken = user.generateAccessToken();

    // Send welcome email to new user
    try {
      console.log('Sending welcome email to new user:', user.email);
      await emailService.sendWelcomeEmail(user._id);
      console.log('Welcome email sent successfully');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
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
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ error: "Internal server error during registration" });
  }
});

// Get user by ID (admin only)
router.get("/:id", [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.send(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user
router.put("/:id", auth, async (req, res) => {
  try {
    const { error } = validatePut(req.body);
    if (error) return res.status(400).json({ error: error.message });

    // Check if user is updating their own profile
    const isSelfUpdate = req.params.id === req.user._id;
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isSuperAdmin = req.user.role === ROLES.SUPER_ADMIN;

    if (!isSelfUpdate && !isAdmin && !isSuperAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    let updateData = _.pick(req.body, ["name", "email"]);

    // Only allow role updates by super admins
    if (isSuperAdmin && req.body.role) {
      updateData.role = req.body.role;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });
    res.send(user);
  } catch (error) {
    console.error("Update error:", error);
    res.status(400).json({ error: "Invalid update request" });
  }
});

// Delete user
router.delete("/:id", auth, async (req, res) => {
  try {
    const isSelfDelete = req.params.id === req.user._id;
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isSuperAdmin = req.user.role === ROLES.SUPER_ADMIN;

    if (!isSelfDelete && !isAdmin && !isSuperAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Only super admins can delete admins
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ error: "User not found" });

    if (userToDelete.role === ROLES.ADMIN && !isSuperAdmin) {
      return res
        .status(403)
        .json({ error: "Only super admins can delete admin users" });
    }

    const user = await User.findByIdAndDelete(req.params.id).select(
      "-password"
    );

    if (isSelfDelete) {
      res.clearCookie("refresh-token");
      res.header("x-auth-token", "");
    }

    res.send(user);
  } catch (error) {
    console.error("Delete error:", error);
    res.status(400).json({ error: "Invalid delete request" });
  }
});

export default router;
