import { z } from 'zod';

export const validateRequest = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

// --- SCHEMAS ---

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  registerNumber: z.string().min(3, 'Register number must be at least 3 characters').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.email || data.registerNumber, {
  message: "Either email or registerNumber must be provided",
  path: ["email"]
});

export const requestSchema = z.object({
  type: z.enum(['leave', 'bonafide', 'onduty', 'other']),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
});

export const complaintSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  category: z.enum(['academic', 'facility', 'hostel', 'other']),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  type: z.enum(['complaint', 'feedback']).optional(),
  location: z.string().optional(),
});

export const circularSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.enum(['academic', 'event', 'holiday', 'exam', 'general']),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  event_date: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  location: z.string().optional(),
  organizer: z.string().optional(),
});

export const userCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['hod', 'faculty', 'class_incharge', 'student']),
  department: z.string().min(2, 'Department must be specified'),
  employeeId: z.string().optional(),
  registerNumber: z.string().optional(),
});

export const attendanceSchema = z.object({
  subjectCode: z.string().min(2, 'Subject code is required'),
  subjectName: z.string().min(2, 'Subject name is required'),
  attendanceData: z.array(z.object({
    studentId: z.string().min(24, 'Invalid student identifier'),
    present: z.boolean()
  }))
});

export const internalMarkSchema = z.object({
  subjectCode: z.string().min(2, 'Subject code is required'),
  assessmentType: z.string().min(2, 'Assessment type is required'),
  maximumMarks: z.number().positive(),
  marksData: z.array(z.object({
    studentId: z.string().min(24, 'Invalid student identifier'),
    marksScored: z.number().nonnegative()
  }))
});

export const classRoomCreateSchema = z.object({
  className: z.string().min(2, 'Class name must be at least 2 characters'),
  department: z.string().min(2, 'Department must be specified'),
  year: z.number().int().min(1).max(4),
  section: z.string().min(1),
  academicYear: z.string().min(4, 'Academic year is required'),
  semester: z.number().int().min(1).max(8)
});

export const studentCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  registerNumber: z.string().min(3, 'Register number is required'),
  department: z.string().min(2, 'Department is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  year: z.number().int().min(1).max(4).optional(),
  currentSemester: z.number().int().min(1).max(8).optional(),
  currentSection: z.string().optional(),
  rollNumber: z.string().optional(),
  batchYear: z.string().optional()
});

