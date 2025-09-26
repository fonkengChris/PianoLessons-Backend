import Joi from "joi";
import joiObjectId from "joi-objectid";

// Initialize the objectId validator
const objectId = joiObjectId(Joi);

export const courseSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  category: Joi.string()
    .valid(
      "Classical",
      "Jazz",
      "Pop",
      "Rock",
      "Blues",
      "Country",
      "Folk",
      "Electronic",
      "Theory",
      "Technique"
    )
    .required(),
  level: Joi.string().valid("Beginner", "Intermediate", "Advanced").required(),
  price: Joi.number().min(0).required(),
  imageUrl: Joi.string().uri(),
});

export const lessonSchema = Joi.object({
  courseId: objectId().required(),
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  videoUrl: Joi.string().required(),
  duration: Joi.number().min(0),
  order: Joi.number().required(),
});

export const reviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().min(3).max(500),
});

export const progressSchema = Joi.object({
  completed: Joi.boolean().required(),
  watchTime: Joi.number().min(0).required(),
});

export const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(50).required(),
});
