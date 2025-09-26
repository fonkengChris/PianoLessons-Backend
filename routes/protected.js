import express from "express";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, (req, res) => {
  res.json({ message: "This is a protected route" });
});

export default router;
