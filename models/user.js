import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Joi from "joi";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2, maxlength: 50 },
  email: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 255,
  },
  password: { type: String, required: true, minlength: 5, maxlength: 1024 },
  role: {
    type: String,
    enum: ["user", "admin", "super_admin"],
    default: "user",
  },
  isAdmin: { type: Boolean, default: false },
  subscriptionActive: { type: Boolean, default: false },
  progress: [
    {
      lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
      completed: { type: Boolean, default: false },
      lastWatched: Date,
      watchTime: { type: Number, default: 0 }, // in seconds
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// JWT token generation method
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
      isAdmin: this.isAdmin,
    },
    process.env.JWT_PRIVATE_KEY,
    { expiresIn: "7d" }
  );
};

const User = mongoose.model("User", userSchema);

// Validation schemas
const validatePost = (user) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });
  return schema.validate(user);
};

const validatePut = (user) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().min(5).max(255).email(),
    role: Joi.string().valid("user", "admin", "super_admin"),
  });
  return schema.validate(user);
};

const validateAuth = (req) => {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });
  return schema.validate(req);
};

// Role constants
const ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
};

export { User, validatePost, validatePut, validateAuth, ROLES };
