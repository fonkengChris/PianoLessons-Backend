import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import validate from "../middleware/validate.js";
import { courseSchema } from "../validation/schemas.js";
import { Course } from "../models/course.js";
import { Lesson } from "../models/lesson.js";
import { Review } from "../models/review.js";
import upload from "../utils/fileUpload.js";

const router = express.Router();

// Get all courses with filtering and pagination
router.get("/", async (req, res) => {
  const { level, category, search, page = 1, limit = 10 } = req.query;

  let query = {};
  if (level) query.level = level;
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const courses = await Course.find(query)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort("title");

  const total = await Course.countDocuments(query);

  res.json({
    courses,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  });
});

// Get single course (public)
router.get("/:id", async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  res.json(course);
});

// Create course (admin only)
router.post("/", [auth, admin, validate(courseSchema)], async (req, res) => {
  const course = new Course(req.body);
  await course.save();
  res.status(201).json(course);
});

// Update course (admin only)
router.put("/:id", [auth, admin, validate(courseSchema)], async (req, res) => {
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: Date.now() },
    { new: true }
  );

  if (!course) return res.status(404).json({ message: "Course not found" });
  res.json(course);
});

// Delete course (admin only)
router.delete("/:id", [auth, admin], async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  // Delete associated lessons
  await Lesson.deleteMany({ courseId: req.params.id });
  // Delete associated reviews
  await Review.deleteMany({ courseId: req.params.id });

  await course.deleteOne();
  res.json({ message: "Course and associated data deleted" });
});

// Get course statistics
router.get("/:id/stats", auth, async (req, res) => {
  const reviews = await Review.find({ courseId: req.params.id });
  const lessons = await Lesson.find({ courseId: req.params.id });

  const avgRating =
    reviews.reduce((acc, rev) => acc + rev.rating, 0) / (reviews.length || 1);
  const totalDuration = lessons.reduce(
    (acc, lesson) => acc + (lesson.duration || 0),
    0
  );

  res.json({
    totalLessons: lessons.length,
    totalReviews: reviews.length,
    averageRating: avgRating,
    totalDuration,
  });
});

// Upload course image
router.post(
  "/:id/image",
  [auth, admin, upload.single("image")],
  async (req, res) => {
    if (!req.file)
      return res.status(400).json({ message: "No image file provided" });

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        imageUrl: `/uploads/${req.file.filename}`,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  }
);

// Get courses by category
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const courses = await Course.find({ category })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort("title");

    const total = await Course.countDocuments({ category });

    res.json({
      courses,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      category,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all available categories
router.get("/categories", async (req, res) => {
  try {
    const categories = [
      "Classical",
      "Jazz",
      "Pop",
      "Rock",
      "Blues",
      "Country",
      "Folk",
      "Electronic",
      "Theory",
      "Technique",
    ];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
