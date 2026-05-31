import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Import all models
import User from './models/User.js';
import Student from './models/Student.js';
import Attendance from './models/Attendance.js';
import Circular from './models/Circular.js';
import RequestModel from './models/Request.js';
import Complaint from './models/Complaint.js';
import Notification from './models/Notification.js';
import ClassRoom from './models/ClassRoom.js';

dotenv.config();

const importData = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    // 1. Wipe out existing seed data to prevent duplicates
    console.log('Purging database...');
    await User.deleteMany();
    await Student.deleteMany();
    await Attendance.deleteMany();
    await Circular.deleteMany();
    await RequestModel.deleteMany();
    await Complaint.deleteMany();
    await Notification.deleteMany();
    await ClassRoom.deleteMany();

    console.log('Inserting initial core users...');
    const users = [
      {
        name: 'Dr. Ramesh Kumar',
        email: 'hod@college.edu',
        password: 'admin123',
        role: 'hod',
        department: 'CSE',
        employeeId: 'FAC-CSE-001',
      },
      {
        name: 'Mrs. Priya Dharshini',
        email: 'faculty@college.edu',
        password: 'faculty123',
        role: 'faculty',
        department: 'CSE',
        employeeId: 'FAC-CSE-032',
      },
      {
        name: 'Mr. Saravanan A',
        email: 'incharge@college.edu',
        password: 'incharge123',
        role: 'class_incharge',
        department: 'CSE',
        employeeId: 'FAC-CSE-091',
      },
    ];

    const createdUsers = [];
    for (const u of users) {
      const createdUser = await User.create(u);
      createdUsers.push(createdUser);
    }

    const hodUser = createdUsers[0];
    const facultyUser = createdUsers[1];
    const inchargeUser = createdUsers[2];

    console.log('Core accounts seeded. Inserting classrooms...');

    // Seed Active Classrooms
    const class1 = await ClassRoom.create({
      className: 'III CSE A',
      department: 'CSE',
      year: 3,
      section: 'A',
      academicYear: '2025-2026',
      semester: 5,
      inchargeId: inchargeUser._id,
      studentsCount: 1,
      isActive: true
    });

    // Target Class: II Year A Section for March 2026 Import
    const class2 = await ClassRoom.create({
      className: 'II CSE A',
      department: 'CSE',
      year: 2,
      section: 'A',
      academicYear: '2025-2026',
      semester: 3,
      inchargeId: inchargeUser._id,
      studentsCount: 58,
      isActive: true
    });

    // Update incharge user profile with class assignments
    inchargeUser.assignedClasses.push(class1._id);
    inchargeUser.assignedClasses.push(class2._id);
    await inchargeUser.save();

    // Create 1 student inside class1
    const studentUser = await User.create({
      name: 'Abhishek R',
      email: 'student@college.edu',
      password: 'student123',
      role: 'student',
      department: 'CSE',
      registerNumber: 'CS2023001',
      createdBy: hodUser._id,
    });

    await Student.create({
      name: 'Abhishek R',
      email: 'student@college.edu',
      password: 'student123',
      department: 'CSE',
      registerNumber: 'CS2023001',
      userId: studentUser._id,
      mentorId: facultyUser._id,
      createdBy: hodUser._id,
      classId: class1._id,
      currentSemester: 5,
      currentSection: 'A',
      year: 3,
      batchYear: '2025-2026',
      rollNumber: 'CS23A01',
      academicStatus: 'Regular'
    });

    // Generate exactly 58 students inside class2 (II CSE A)
    console.log('Seeding exactly 58 enrolled students for II CSE A...');
    for (let i = 1; i <= 58; i++) {
      const regNo = `CS2026${String(i).padStart(3, '0')}`;
      const email = `student_ii_${i}@college.edu`;
      
      const stUser = await User.create({
        name: `Student ${i}`,
        email,
        password: 'student123',
        role: 'student',
        department: 'CSE',
        registerNumber: regNo,
        createdBy: hodUser._id,
      });

      await Student.create({
        name: `Student ${i}`,
        email,
        password: 'student123',
        department: 'CSE',
        registerNumber: regNo,
        userId: stUser._id,
        mentorId: facultyUser._id,
        createdBy: hodUser._id,
        classId: class2._id,
        currentSemester: 3,
        currentSection: 'A',
        year: 2,
        batchYear: '2025-2026',
        rollNumber: `CS26A${String(i).padStart(2, '0')}`,
        academicStatus: 'Regular'
      });
    }

    console.log('Classrooms and student connections established. Inserting modules datasets...');

    // 2. Seed aggregate Attendance records for Abhishek R
    await Attendance.create([
      {
        studentId: studentUser._id,
        subjectCode: 'CS8601',
        subjectName: 'Mobile Computing',
        totalClasses: 36,
        classesAttended: 34,
      },
      {
        studentId: studentUser._id,
        subjectCode: 'CS8602',
        subjectName: 'Compiler Design',
        totalClasses: 34,
        classesAttended: 31,
      },
      {
        studentId: studentUser._id,
        subjectCode: 'CS8603',
        subjectName: 'Artificial Intelligence',
        totalClasses: 32,
        classesAttended: 27,
      }
    ]);

    // 3. Seed Circulars
    const circulars = await Circular.create([
      {
        title: 'End Semester Theory Exams Timetable',
        category: 'exam',
        description: 'The end semester university theory examinations for third year students will commence from June 15, 2026. The detailed timetable is attached herewith.',
        event_date: new Date('2026-06-15'),
        deadline: new Date('2026-06-14'),
        location: 'Exam Cell, Block A',
        organizer: 'Exam Cell Coordinator',
        createdBy: hodUser._id,
      },
      {
        title: 'National Level Hackathon - KVCETHack 2026',
        category: 'event',
        description: 'Our department is organizing a 24-hour national-level smart India hackathon on June 28, 2026. Cash prizes worth Rs. 50,000 to be won.',
        event_date: new Date('2026-06-28'),
        deadline: new Date('2026-06-20'),
        location: 'CSE Lab 4 & Seminar Hall',
        organizer: 'KVCET CSE Association',
        createdBy: hodUser._id,
      },
      {
        title: 'Academic Council Meeting & Syllabus Review',
        category: 'academic',
        description: 'Important circular regarding syllabus revisions for CSE 2026 regulation. HOD and all senior professors are requested to attend.',
        event_date: new Date('2026-06-05'),
        deadline: new Date('2026-06-04'),
        location: 'Conference Hall, Main Block',
        organizer: 'Office of HOD',
        createdBy: hodUser._id,
      }
    ]);

    // 4. Seed Student Requests for Abhishek R
    await RequestModel.create([
      {
        studentId: studentUser._id,
        type: 'leave',
        title: 'Sick Leave for Fever',
        description: 'Respected Sir/Madam, I am suffering from severe viral fever, so I am unable to attend classes for two days. Kindly grant me leave.',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-02'),
        status: 'Faculty_Approved',
        facultyComments: 'Genuine request, approved. Recommended for HOD approval.',
      },
      {
        studentId: studentUser._id,
        type: 'bonafide',
        title: 'Bonafide for Education Loan',
        description: 'Need a bonafide certificate to submit to State Bank of India for processing my third-year educational loan.',
        status: 'Pending',
      },
      {
        studentId: studentUser._id,
        type: 'onduty',
        title: 'On-Duty for Paper Presentation at IIT',
        description: 'I have been selected to present a research paper on Blockchain at IIT Madras. Requesting OD permission for June 8, 2026.',
        startDate: new Date('2026-06-08'),
        endDate: new Date('2026-06-08'),
        status: 'HOD_Approved',
        facultyComments: 'Excellent work. Recommended.',
        hodComments: 'Congratulations! OD approved. Present well.',
      }
    ]);

    // 5. Seed Complaints and Feedback
    await Complaint.create([
      {
        title: 'Lab 4 Air Conditioning Malfunction',
        description: 'Two AC units on the left row in Lab 4 are blowing warm air, making it extremely difficult to conduct practical sessions.',
        category: 'facility',
        priority: 'high',
        status: 'Under Review',
        type: 'complaint',
        submittedBy: facultyUser._id,
        location: 'Lab 4, Block B Third Floor',
        comments: [
          {
            user: hodUser._id,
            text: 'Maintenance team notified. Repair team will arrive tomorrow morning.',
            createdAt: new Date()
          }
        ]
      },
      {
        title: 'Improvement in Hostel Wi-Fi Bandwidth',
        description: 'The Wi-Fi speed in the girls hostel block B is very low after 8 PM, making it hard to download study materials or complete assignments.',
        category: 'hostel',
        priority: 'medium',
        status: 'Pending',
        type: 'feedback',
        submittedBy: studentUser._id,
        location: 'Girls Hostel Block B',
      }
    ]);

    // 6. Seed Notifications
    await Notification.create([
      {
        recipientId: studentUser._id,
        senderId: hodUser._id,
        title: 'OD Request Approved',
        message: 'Your On-Duty request for the IIT Paper Presentation has been approved by the HOD.',
        type: 'request',
        read: false,
      },
      {
        recipientId: hodUser._id,
        senderId: studentUser._id,
        title: 'New Request Awaiting Review',
        message: 'Abhishek R submitted a new Bonafide Certificate request.',
        type: 'request',
        read: false,
      },
      {
        recipientId: studentUser._id,
        senderId: hodUser._id,
        title: 'End Sem Timetable Released',
        message: 'New circular published: End Semester Theory Exams Timetable.',
        type: 'circular',
        read: true,
      }
    ]);

    console.log('Database successfully seeded with 58 target students, classrooms, and assignments!');
    process.exit();
  } catch (error) {
    console.error(`Error with data seeding: ${error.message}`);
    process.exit(1);
  }
};

importData();
