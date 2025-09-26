import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: [
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
    ],
  },
  level: {
    type: String,
    required: true,
    enum: ["Beginner", "Intermediate", "Advanced"],
  },
  price: { type: Number, required: true },
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Course = mongoose.model("Course", courseSchema);

export { Course };
