import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadDocument, getDocuments, deleteDocument } from '../controllers/documentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.route('/')
  .post(protect, upload.single('file'), uploadDocument)
  .get(protect, getDocuments);

router.route('/:id')
  .delete(protect, deleteDocument);

export default router;
