import express from 'express';
import multer from 'multer';
import path from 'path';
import { createCircular, getCirculars } from '../controllers/circularController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateRequest, circularSchema } from '../middlewares/validation.js';

const router = express.Router();

// Configure Multer Storage with secure unique names
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedOriginalName}`);
  }
});

// Configure File Filter for secure file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|csv|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type! Allowed types: PDF, Word, Excel, CSV, Text, and Images.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

router.route('/')
  .post(protect, upload.single('file'), validateRequest(circularSchema), createCircular)
  .get(protect, getCirculars);

export default router;
