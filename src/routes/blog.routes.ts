import { Router } from 'express';
import { createBlog, getAllBlogs, deleteBlog, updateBlog, likeBlog } from '../controllers/blog.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/', upload.array('images', 5), createBlog);
router.get('/', getAllBlogs);
router.put('/:id', upload.array('images', 5), updateBlog);
router.post('/:id/like', likeBlog);
router.delete('/:id', deleteBlog);

export default router;
