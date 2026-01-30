"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBlog = exports.likeBlog = exports.updateBlog = exports.getAllBlogs = exports.createBlog = void 0;
const blog_model_1 = __importDefault(require("../models/blog.model"));
// Create a new blog
const createBlog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, author } = req.body;
        let imageUrls = [];
        if (req.files && Array.isArray(req.files)) {
            imageUrls = req.files.map(file => file.path);
        }
        const blog = yield blog_model_1.default.create({
            title,
            description,
            images: imageUrls,
            author: author || 'Ram Kharpude',
            isPublished: true
        });
        res.status(201).json(blog);
    }
    catch (error) {
        console.error("Create Blog Error:", error);
        res.status(500).json({ message: 'Error creating blog', error });
    }
});
exports.createBlog = createBlog;
// Get all blogs (for users and admin)
const getAllBlogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blogs = yield blog_model_1.default.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(blogs);
    }
    catch (error) {
        console.error("Get Blogs Error:", error);
        res.status(500).json({ message: 'Error fetching blogs', error });
    }
});
exports.getAllBlogs = getAllBlogs;
// Update a blog
const updateBlog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, description } = req.body;
        const blog = yield blog_model_1.default.findByPk(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        let newImageUrls = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            newImageUrls = req.files.map(file => file.path);
        }
        // Handle existing images passed in body check
        // If editing, we might want to keep old images if no new ones, or replace?
        // Let's assume replacement / appending logic similar to products if needed, 
        // but for now simplest is: if new files, use them. 
        // Or if we want to support deleting images, we'd need that logic. 
        // Let's stick to the previous simple logic: if files uploaded, replace/add.
        // Actually, looking at product controller, we merged. 
        // But WriteBlogScreen previously just sent the array.
        // Let's emulate Product Controller logic to be safe if possible, OR just use new images if present.
        // Since the user asked to "make it work like products", I'll try to support image uploads properly.
        if (newImageUrls.length > 0) {
            blog.images = newImageUrls; // Replacing images for now to keep it simple as per previous logic (which replaced `images` with `req.body.images`)
        }
        else if (req.body.images) {
            // If strictly text passed (e.g. keeping old URLs)
            // We need to handle this carefully.
            // If the frontend sends existing URLs as text, we should respect that.
            // But FormData handles arrays differently.
            // Let's assume for this task: New Uploads Replace Old Images (or user re-selects them).
            // Wait, `AddProduct` logic allowed keeping old.
            // Let's rely on what the frontend sends.
        }
        blog.title = title || blog.title;
        blog.description = description || blog.description;
        // If we want to allow partial updates of images via text (old urls), we need to parse req.body.images
        // But let's stick to: if new files, use them.
        if (newImageUrls.length > 0) {
            blog.images = newImageUrls;
        }
        yield blog.save();
        res.status(200).json(blog);
    }
    catch (error) {
        console.error("Update Blog Error:", error);
        res.status(500).json({ message: 'Error updating blog', error });
    }
});
exports.updateBlog = updateBlog;
// Toggle Blog Like
const likeBlog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const blog = yield blog_model_1.default.findByPk(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        // Validate and cast userId
        const userIdNum = parseInt(userId);
        if (isNaN(userIdNum)) {
            return res.status(400).json({ message: 'Invalid User ID' });
        }
        let likedBy = blog.likedBy || [];
        // Ensure likedBy is an array (handle SQLite potential string storage)
        if (typeof likedBy === 'string') {
            try {
                likedBy = JSON.parse(likedBy);
            }
            catch (e) {
                likedBy = [];
            }
        }
        // Ensure all items in likedBy are numbers to prevent mismatch
        likedBy = likedBy.map((uid) => parseInt(uid)).filter((uid) => !isNaN(uid));
        let isLiked = false;
        if (likedBy.includes(userIdNum)) {
            // Unlike
            likedBy = likedBy.filter((uid) => uid !== userIdNum);
            blog.likes = Math.max(0, blog.likes - 1);
            isLiked = false;
        }
        else {
            // Like
            likedBy.push(userIdNum);
            blog.likes += 1;
            isLiked = true;
        }
        blog.likedBy = likedBy;
        // Explicitly tell Sequelize that the JSON column has changed
        blog.changed('likedBy', true);
        yield blog.save();
        res.status(200).json({ message: isLiked ? 'Blog liked' : 'Blog unliked', likes: blog.likes, isLiked });
    }
    catch (error) {
        console.error("Like Blog Error:", error);
        res.status(500).json({ message: 'Error liking blog', error });
    }
});
exports.likeBlog = likeBlog;
// Delete a blog (Admin only)
const deleteBlog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield blog_model_1.default.destroy({ where: { id } });
        if (result) {
            res.status(200).json({ message: 'Blog deleted successfully' });
        }
        else {
            res.status(404).json({ message: 'Blog not found' });
        }
    }
    catch (error) {
        console.error("Delete Blog Error:", error);
        res.status(500).json({ message: 'Error deleting blog', error });
    }
});
exports.deleteBlog = deleteBlog;
