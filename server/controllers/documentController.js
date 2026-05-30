import StudentDocument from '../models/StudentDocument.js';
import path from 'path';
import fs from 'fs';

// @desc    Upload document
// @route   POST /api/documents
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, category } = req.body;

    const doc = await StudentDocument.create({
      studentId: req.user._id,
      title,
      category,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user documents
// @route   GET /api/documents
export const getDocuments = async (req, res) => {
  try {
    const docs = await StudentDocument.find({ studentId: req.user._id });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
export const deleteDocument = async (req, res) => {
  try {
    const doc = await StudentDocument.findOne({ _id: req.params.id, studentId: req.user._id });
    
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Attempt to delete file from disk
    const filePath = path.join(process.cwd(), doc.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await doc.deleteOne();
    res.json({ message: 'Document removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
