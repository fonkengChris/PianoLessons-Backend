import express from "express";
import authRoutes from "../routes/auth.js";
import userRoutes from "../routes/users.js";
import protectedRoutes from "../routes/protected.js";
import courseRoutes from "../routes/courses.js";
import lessonRoutes from "../routes/lessons.js";
import subscriptionRoutes from "../routes/subscriptions.js";
import paymentRoutes from "../routes/payments.js";
import progressRoutes from "../routes/progress.js";
import reviewRoutes from "../routes/reviews.js";
import changePasswordRoutes from "../routes/change_password.js";
import emailRoutes from "../routes/emails.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, validateAuth } from "../models/user.js";

export default function (app) {
  // Direct login route for frontend convenience
  app.post("/api/login", async (req, res) => {
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

  // Mount auth routes at /api/auth (login will be at /api/auth)
  app.use("/api/auth", authRoutes);

  // Mount change password routes at /api/auth/change-password
  app.use("/api/auth/change-password", changePasswordRoutes);

  // Mount user routes at /api/users
  app.use("/api/users", userRoutes);

  // Mount other routes
  app.use("/api/protected", protectedRoutes);
  app.use("/api/courses", courseRoutes);
  app.use("/api/lessons", lessonRoutes);
  app.use("/api/subscriptions", subscriptionRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/progress", progressRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/emails", emailRoutes);
  app.use("/uploads", express.static("uploads")); // Serve uploaded files
}
