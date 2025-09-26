import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import validate from "../middleware/validate.js";
import { lessonSchema } from "../validation/schemas.js";
import { Lesson } from "../models/lesson.js";
import { Subscription } from "../models/subscription.js";
import upload from "../utils/fileUpload.js";

const router = express.Router();

// Get all lessons (admin only)
router.get("/", [auth, admin], async (req, res) => {
  try {
    const lessons = await Lesson.find().populate('courseId', 'title').sort('createdAt');
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: "Error fetching lessons", error: error.message });
  }
});

// Get lessons for a course (temporarily bypassed subscription requirement)
router.get("/course/:courseId", auth, async (req, res) => {
  // TODO: Temporarily bypassed subscription check for development
  // Check if user has active subscription
  // const subscription = await Subscription.findOne({
  //   userId: req.user.id,
  //   status: "active",
  //   endDate: { $gt: new Date() },
  // });

  // if (!subscription) {
  //   return res.status(403).json({ message: "Active subscription required" });
  // }

  const lessons = await Lesson.find({ courseId: req.params.courseId }).sort(
    "order"
  );
  res.json(lessons);
});

// Get single lesson (temporarily bypassed subscription requirement)
router.get("/:id", auth, async (req, res) => {
  // TODO: Temporarily bypassed subscription check for development
  // Check subscription
  // const subscription = await Subscription.findOne({
  //   userId: req.user.id,
  //   status: "active",
  //   endDate: { $gt: new Date() },
  // });

  // if (!subscription) {
  //   return res.status(403).json({ message: "Active subscription required" });
  // }

  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });
  res.json(lesson);
});

// Create lesson (admin only)
router.post("/", [auth, admin, validate(lessonSchema)], async (req, res) => {
  const lesson = new Lesson(req.body);
  await lesson.save();
  res.status(201).json(lesson);
});

// Update lesson (admin only)
router.put("/:id", [auth, admin, validate(lessonSchema)], async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: "Error updating lesson", error: error.message });
  }
});

// Upload lesson video
router.post(
  "/:id/video",
  [auth, admin, upload.single("video")],
  async (req, res) => {
    if (!req.file)
      return res.status(400).json({ message: "No video file provided" });

    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      {
        videoUrl: `/uploads/${req.file.filename}`,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    res.json(lesson);
  }
);

// Update lesson order
router.put("/reorder", [auth, admin], async (req, res) => {
  const { courseId, lessonOrders } = req.body;

  for (let item of lessonOrders) {
    await Lesson.findByIdAndUpdate(item.lessonId, {
      order: item.order,
      updatedAt: Date.now(),
    });
  }

  const lessons = await Lesson.find({ courseId }).sort("order");
  res.json(lessons);
});

// Delete lesson
router.delete("/:id", [auth, admin], async (req, res) => {
  const lesson = await Lesson.findByIdAndDelete(req.params.id);
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });
  res.json({ message: "Lesson deleted" });
});

export default router;
