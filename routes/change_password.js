import bcrypt from "bcryptjs";
import Joi from "joi";
import { User } from "../models/user.js";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import express from "express";
const router = express.Router();

const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,50}$/;

router.post("/:id", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.message);

  let user = await User.findOne({ _id: req.params.id });
  if (!user) return res.status(400).send("User not found.");

  const validPassword = await bcrypt.compare(
    req.body.old_password,
    user.password
  );
  if (!validPassword) return res.status(400).send("Invalid password.");

  const salt = await bcrypt.genSalt(10);
  const new_password = await bcrypt.hash(req.body.password, salt);

  const response = await User.updateOne(user, { password: new_password });

  res.send(user);
});

function validate(req) {
  const schema = Joi.object({
    old_password: Joi.string().required(),
    password: Joi.string().pattern(PWD_REGEX).required().messages({
      "string.pattern.base":
        "Password must be 8-50 characters long, include at least one lowercase letter, one uppercase letter, one number, and one special character (!@#$%).",
    }),
  });

  return schema.validate(req);
}
export default router;
