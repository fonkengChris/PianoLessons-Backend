import mongoose from "mongoose";
import { Category } from "./models/category.js";

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/piano-lessons")
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const categories = [
  {
    name: "Classical",
    description: "Classical piano music and techniques",
    sortOrder: 1,
    isActive: true
  },
  {
    name: "Jazz",
    description: "Jazz piano styles and improvisation",
    sortOrder: 2,
    isActive: true
  },
  {
    name: "Pop",
    description: "Popular music and contemporary piano",
    sortOrder: 3,
    isActive: true
  },
  {
    name: "Rock",
    description: "Rock piano and keyboard techniques",
    sortOrder: 4,
    isActive: true
  },
  {
    name: "Blues",
    description: "Blues piano styles and techniques",
    sortOrder: 5,
    isActive: true
  },
  {
    name: "Gospel",
    description: "Gospel piano and spiritual music",
    sortOrder: 6,
    isActive: true
  },
  {
    name: "Country",
    description: "Country piano and folk music",
    sortOrder: 7,
    isActive: true
  },
  {
    name: "R&B",
    description: "Rhythm and Blues piano techniques",
    sortOrder: 8,
    isActive: true
  }
];

async function seedCategories() {
  try {
    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    const insertedCategories = await Category.insertMany(categories);
    console.log(`Successfully seeded ${insertedCategories.length} categories`);

    // Display the seeded categories
    console.log('\nSeeded categories:');
    insertedCategories.forEach(category => {
      console.log(`- ${category.name}: ${category.description}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
