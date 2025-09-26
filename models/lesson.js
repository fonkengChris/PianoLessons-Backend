import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true },
  duration: Number, // in minutes
  order: { type: Number, required: true }, // for ordering lessons within a course
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Lesson = mongoose.model("Lesson", lessonSchema);

export { Lesson };
