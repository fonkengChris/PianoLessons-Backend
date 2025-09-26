# Course Category Feature Implementation

## Overview

Added a `category` attribute to the Course model to better organize and filter piano courses.

## Changes Made

### 1. Course Model (`models/course.js`)

- Added `category` field with predefined enum values:
  - Classical
  - Jazz
  - Pop
  - Rock
  - Blues
  - Country
  - Folk
  - Electronic
  - Theory
  - Technique

### 2. Validation Schema (`validation/schemas.js`)

- Updated `courseSchema` to include category validation
- Category is now a required field

### 3. Course Routes (`routes/courses.js`)

- Updated GET `/api/courses` to support filtering by category
- Added GET `/api/courses/category/:category` to get courses by specific category
- Added GET `/api/courses/categories` to get all available categories

## New API Endpoints

### Get Courses by Category

```
GET /api/courses/category/:category?page=1&limit=10
```

Returns paginated courses for a specific category.

### Get All Categories

```
GET /api/courses/categories
```

Returns an array of all available categories.

### Enhanced Course Filtering

```
GET /api/courses?category=Classical&level=Beginner&search=piano
```

Now supports filtering by category in addition to level and search.

## Migration

### Running the Migration

If you have existing courses without categories, run the migration script:

```bash
node migrate-categories.js
```

This script will:

1. Find all courses without a category field
2. Assign a default category based on course title/description
3. Update the database with the new category field

### Manual Category Assignment

The migration script uses the following logic to assign categories:

- Searches for category keywords in title and description
- Falls back to "Theory" if no specific category is detected
- Updates the `updatedAt` timestamp

## Database Impact

- New required field: `category` (String, enum)
- Existing courses will need migration if they don't have categories
- No breaking changes to existing functionality

## Frontend Integration

The frontend can now:

1. Display category filters
2. Show course categories in course cards
3. Filter courses by category
4. Use the categories endpoint for dropdown menus

## Example Usage

### Creating a New Course

```javascript
const newCourse = {
  title: "Jazz Piano Fundamentals",
  description: "Learn the basics of jazz piano",
  category: "Jazz", // Required field
  level: "Beginner",
  price: 49.99,
};
```

### Filtering Courses

```javascript
// Get all jazz courses
const jazzCourses = await fetch("/api/courses/category/Jazz");

// Get all categories
const categories = await fetch("/api/courses/categories");

// Filter by multiple criteria
const filteredCourses = await fetch(
  "/api/courses?category=Classical&level=Intermediate"
);
```
