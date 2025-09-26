"use strict";
import mongoose from "mongoose";
import { Course } from "./models/course.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/pianolessons";

const sampleCourses = [
  {
    title: "Beginner Classical Piano",
    description:
      "Learn the basics of classical piano, including reading sheet music and basic technique.",
    category: "Classical",
    level: "Beginner",
    price: 49.99,
    imageUrl: "https://example.com/images/classical-beginner.jpg",
  },
  {
    title: "Jazz Improvisation",
    description:
      "Explore the fundamentals of jazz piano improvisation and chord progressions.",
    category: "Jazz",
    level: "Intermediate",
    price: 59.99,
    imageUrl: "https://example.com/images/jazz-improv.jpg",
  },
  {
    title: "Pop Piano Hits",
    description:
      "Play your favorite pop songs on the piano with easy-to-follow lessons.",
    category: "Pop",
    level: "Beginner",
    price: 39.99,
    imageUrl: "https://example.com/images/pop-hits.jpg",
  },
  {
    title: "Advanced Rock Techniques",
    description: "Master advanced rock piano techniques and solos.",
    category: "Rock",
    level: "Advanced",
    price: 69.99,
    imageUrl: "https://example.com/images/rock-advanced.jpg",
  },
  {
    title: "Blues Piano Essentials",
    description: "Learn the essential blues scales, licks, and rhythms.",
    category: "Blues",
    level: "Intermediate",
    price: 54.99,
    imageUrl: "https://example.com/images/blues-essentials.jpg",
  },
  {
    title: "Country Piano for Beginners",
    description:
      "Start your journey into country piano with simple songs and techniques.",
    category: "Country",
    level: "Beginner",
    price: 44.99,
    imageUrl: "https://example.com/images/country-beginner.jpg",
  },
  {
    title: "Folk Song Arrangements",
    description: "Arrange and play classic folk songs on the piano.",
    category: "Folk",
    level: "Intermediate",
    price: 49.99,
    imageUrl: "https://example.com/images/folk-arrangements.jpg",
  },
  {
    title: "Electronic Music Production",
    description: "Create electronic music using piano and digital tools.",
    category: "Electronic",
    level: "Advanced",
    price: 79.99,
    imageUrl: "https://example.com/images/electronic-production.jpg",
  },
  {
    title: "Music Theory Basics",
    description: "Understand the basics of music theory for piano players.",
    category: "Theory",
    level: "Beginner",
    price: 29.99,
    imageUrl: "https://example.com/images/theory-basics.jpg",
  },
  {
    title: "Piano Technique Mastery",
    description:
      "Improve your piano technique with advanced exercises and drills.",
    category: "Technique",
    level: "Advanced",
    price: 64.99,
    imageUrl: "https://example.com/images/technique-mastery.jpg",
  },
];

async function seedCourses() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
    await Course.deleteMany({});
    await Course.insertMany(sampleCourses);
    console.log("Sample courses seeded successfully!");
  } catch (err) {
    console.error("Error seeding courses:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedCourses();
