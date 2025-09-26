import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import { Category } from "../models/category.js";
import { Course } from "../models/course.js";

const router = express.Router();

// Get all categories (public endpoint)
router.get("/", async (req, res) => {
  try {
    const { active, sort } = req.query;
    
    let query = {};
    if (active === 'true') {
      query.isActive = true;
    }
    
    let sortOptions = { sortOrder: 1, name: 1 };
    if (sort === 'name') {
      sortOptions = { name: 1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    }
    
    const categories = await Category.find(query)
      .sort(sortOptions)
      .select('-__v');
    
    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to get categories" });
  }
});

// Get single category by ID (public endpoint)
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).select('-__v');
    
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    // Get course count for this category
    const courseCount = await Course.countDocuments({ categoryId: req.params.id });
    category.courseCount = courseCount;
    
    res.json({ category });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({ error: "Failed to get category" });
  }
});

// Get category by slug (public endpoint)
router.get("/slug/:slug", async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).select('-__v');
    
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    // Get course count for this category
    const courseCount = await Course.countDocuments({ categoryId: category._id });
    category.courseCount = courseCount;
    
    res.json({ category });
  } catch (error) {
    console.error("Get category by slug error:", error);
    res.status(500).json({ error: "Failed to get category" });
  }
});

// Create category (admin only)
router.post("/", auth, admin, async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;
    
    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ error: "Category with this name already exists" });
    }
    
    const category = new Category({
      name,
      description,
      sortOrder: sortOrder || 0
    });
    
    await category.save();
    
    res.status(201).json({ 
      message: "Category created successfully",
      category 
    });
  } catch (error) {
    console.error("Create category error:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation error", 
        details: Object.values(error.errors).map(e => e.message) 
      });
    }
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Update category (admin only)
router.put("/:id", auth, admin, async (req, res) => {
  try {
    const { name, description, isActive, sortOrder } = req.body;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    // Check if another category with same name exists (excluding current one)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name, 
        _id: { $ne: req.params.id } 
      });
      if (existingCategory) {
        return res.status(400).json({ error: "Category with this name already exists" });
      }
    }
    
    // Update fields
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    
    await category.save();
    
    res.json({ 
      message: "Category updated successfully",
      category 
    });
  } catch (error) {
    console.error("Update category error:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation error", 
        details: Object.values(error.errors).map(e => e.message) 
      });
    }
    res.status(500).json({ error: "Failed to update category" });
  }
});

// Delete category (admin only)
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    // Check if category has courses
    const courseCount = await Course.countDocuments({ categoryId: req.params.id });
    if (courseCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category. It has ${courseCount} course(s) associated with it. Please reassign or delete the courses first.` 
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// Bulk update category order (admin only)
router.put("/bulk/order", auth, admin, async (req, res) => {
  try {
    const { categories } = req.body; // Array of { id, sortOrder }
    
    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: "Categories must be an array" });
    }
    
    const updatePromises = categories.map(({ id, sortOrder }) => 
      Category.findByIdAndUpdate(id, { sortOrder }, { new: true })
    );
    
    await Promise.all(updatePromises);
    
    res.json({ message: "Category order updated successfully" });
  } catch (error) {
    console.error("Bulk update category order error:", error);
    res.status(500).json({ error: "Failed to update category order" });
  }
});

// Toggle category active status (admin only)
router.patch("/:id/toggle", auth, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    category.isActive = !category.isActive;
    await category.save();
    
    res.json({ 
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      category 
    });
  } catch (error) {
    console.error("Toggle category status error:", error);
    res.status(500).json({ error: "Failed to toggle category status" });
  }
});

// Get category statistics (admin only)
router.get("/admin/stats", auth, admin, async (req, res) => {
  try {
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });
    const inactiveCategories = totalCategories - activeCategories;
    
    // Get categories with course counts
    const categoriesWithCourses = await Category.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'courses'
        }
      },
      {
        $project: {
          name: 1,
          courseCount: { $size: '$courses' },
          isActive: 1
        }
      },
      {
        $sort: { courseCount: -1 }
      }
    ]);
    
    res.json({
      totalCategories,
      activeCategories,
      inactiveCategories,
      categoriesWithCourses
    });
  } catch (error) {
    console.error("Get category stats error:", error);
    res.status(500).json({ error: "Failed to get category statistics" });
  }
});

export default router;
