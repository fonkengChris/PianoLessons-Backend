import mongoose from "mongoose";
import { Course } from "./models/course.js";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

async function migrateCategories() {
  try {
    // Find all courses that don't have a category
    const coursesWithoutCategory = await Course.find({ category: { $exists: false } });
    
    console.log(`Found ${coursesWithoutCategory.length} courses without category`);
    
    if (coursesWithoutCategory.length === 0) {
      console.log("No courses need migration");
      return;
    }
    
    // Update each course with a default category
    for (const course of coursesWithoutCategory) {
      // Set a default category based on the course title or description
      let defaultCategory = "Theory"; // Default fallback
      
      const title = course.title.toLowerCase();
      const description = course.description.toLowerCase();
      
      if (title.includes("classical") || description.includes("classical")) {
        defaultCategory = "Classical";
      } else if (title.includes("jazz") || description.includes("jazz")) {
        defaultCategory = "Jazz";
      } else if (title.includes("pop") || description.includes("pop")) {
        defaultCategory = "Pop";
      } else if (title.includes("rock") || description.includes("rock")) {
        defaultCategory = "Rock";
      } else if (title.includes("blues") || description.includes("blues")) {
        defaultCategory = "Blues";
      } else if (title.includes("country") || description.includes("country")) {
        defaultCategory = "Country";
      } else if (title.includes("folk") || description.includes("folk")) {
        defaultCategory = "Folk";
      } else if (title.includes("electronic") || description.includes("electronic")) {
        defaultCategory = "Electronic";
      } else if (title.includes("technique") || description.includes("technique")) {
        defaultCategory = "Technique";
      }
      
      await Course.findByIdAndUpdate(course._id, { 
        category: defaultCategory,
        updatedAt: new Date()
      });
      
      console.log(`Updated course "${course.title}" with category: ${defaultCategory}`);
    }
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    mongoose.connection.close();
  }
}

migrateCategories(); 