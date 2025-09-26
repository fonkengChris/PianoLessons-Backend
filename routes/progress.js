import express from "express";
import auth from "../middleware/auth.js";
import { User } from "../models/user.js";

const router = express.Router();

// Update lesson progress
router.post("/:lessonId", auth, async (req, res) => {
  const { completed, watchTime } = req.body;
  const user = await User.findById(req.user.id);

  const progressIndex = user.progress.findIndex(
    (p) => p.lessonId.toString() === req.params.lessonId
  );

  if (progressIndex > -1) {
    user.progress[progressIndex].completed = completed;
    user.progress[progressIndex].watchTime = watchTime;
    user.progress[progressIndex].lastWatched = new Date();
  } else {
    user.progress.push({
      lessonId: req.params.lessonId,
      completed,
      watchTime,
      lastWatched: new Date(),
    });
  }

  await user.save();
  res.json(user.progress);
});

// Get user's progress
router.get("/", auth, async (req, res) => {
  const user = await User.findById(req.user.id).populate("progress.lessonId");
  res.json(user.progress);
});

export default router;
