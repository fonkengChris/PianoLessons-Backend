import express from "express";
import auth from "../middleware/auth.js";
import { Review } from "../models/review.js";
import { Course } from "../models/course.js";

const router = express.Router();

// Add a review
router.post("/:courseId", auth, async (req, res) => {
  const { rating, comment } = req.body;

  // Check if user already reviewed this course
  const existingReview = await Review.findOne({
    userId: req.user.id,
    courseId: req.params.courseId,
  });

  if (existingReview) {
    return res
      .status(400)
      .json({ message: "You've already reviewed this course" });
  }

  const review = new Review({
    userId: req.user.id,
    courseId: req.params.courseId,
    rating,
    comment,
  });

  await review.save();
  res.status(201).json(review);
});

// Get reviews for a course
router.get("/course/:courseId", async (req, res) => {
  const reviews = await Review.find({ courseId: req.params.courseId }).populate(
    "userId",
    "name"
  );
  res.json(reviews);
});

export default router;
