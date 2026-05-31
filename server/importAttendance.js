import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import Student from './models/Student.js';
import ClassRoom from './models/ClassRoom.js';
import Attendance from './models/Attendance.js';
import { parseHeaderToDate, autoCreateStudentsFromCSV, importAttendanceCSV } from './services/attendanceImportService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Config ──────────────────────────────────────────────────────────────────
const CSV_PATH   = path.join(__dirname, 'uploads', 'CLASS_LOG_CSE_2025-26-MARCH_2026 - CSE_2_A.csv');
const MONTH_STR  = 'March 2026';
const YEAR_NUM   = 2026;
const CLASS_NAME = 'II CSE A';

// ── Main ─────────────────────────────────────────────────────────────────────
const run = async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await connectDB();

    // 1. Read CSV from disk
    if (!fs.existsSync(CSV_PATH)) {
      console.error(`❌  CSV file not found at:\n   ${CSV_PATH}`);
      process.exit(1);
    }
    const csvText = fs.readFileSync(CSV_PATH, 'utf-8');
    console.log(`📂 Loaded CSV: ${path.basename(CSV_PATH)}`);
    console.log(`   Rows: ${csvText.split(/\r?\n/).filter(l => l.trim()).length - 1} students\n`);

    // 2. Find or create classroom: II CSE A
    let classRoom = await ClassRoom.findOne({ className: CLASS_NAME });

    if (!classRoom) {
      console.log(`⚙️  Classroom "${CLASS_NAME}" not found — auto-creating...`);
      const incharge = await User.findOne({ role: 'class_incharge' }).lean();
      classRoom = await ClassRoom.create({
        className:    CLASS_NAME,
        department:   'CSE',
        year:         2,
        section:      'A',
        semester:     3,
        academicYear: '2025-2026',
        studentsCount: 0,
        isActive:     true,
        inchargeId:   incharge ? incharge._id : undefined,
      });
      console.log(`✅  Created classroom: ${classRoom.className}\n`);
    } else {
      console.log(`🏫 Found classroom: ${classRoom.className}  (Sem ${classRoom.semester})`);
    }

    // 3. Find incharge user (for createdBy / importedBy reference)
    const inchargeUser = await User.findOne({ role: 'class_incharge' }).lean();
    if (!inchargeUser) {
      console.error('❌  No class_incharge user found. Run seed.js first.');
      process.exit(1);
    }
    console.log(`👤 Importer: ${inchargeUser.name || inchargeUser.email}\n`);

    // ── STEP 1: Auto-create student ERP accounts ─────────────────────────────
    console.log('👥 STEP 1 — Auto-creating student ERP accounts from CSV...');
    const userResult = await autoCreateStudentsFromCSV({
      csvText,
      classRoom,
      importedBy: inchargeUser._id,
    });

    console.log(`   ✅ New accounts created : ${userResult.newUsersCreated}`);
    console.log(`   ⏭️  Already existing     : ${userResult.existingCount}`);

    if (userResult.credentialsList.length > 0) {
      console.log('\n──────────────────────────────────────────────────────────────────');
      console.log('   GENERATED STUDENT CREDENTIALS');
      console.log('──────────────────────────────────────────────────────────────────');
      console.log('   RegNo          | Name                   | Email                               | Password');
      console.log('──────────────────────────────────────────────────────────────────');
      userResult.credentialsList.forEach(c => {
        const reg   = c.registerNumber.padEnd(14);
        const name  = c.name.padEnd(22);
        const email = c.email.padEnd(36);
        console.log(`   ${reg} | ${name} | ${email} | ${c.defaultPassword}`);
      });
      console.log('──────────────────────────────────────────────────────────────────\n');
    }

    // ── STEP 2: Import attendance records ─────────────────────────────────────
    console.log('📅 STEP 2 — Importing March 2026 attendance records...');
    const attendanceResult = await importAttendanceCSV({
      csvText,
      classId:    classRoom._id,
      importedBy: inchargeUser._id,
      month:      MONTH_STR,
      year:       YEAR_NUM,
    });

    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('✅  IMPORT COMPLETE');
    console.log('══════════════════════════════════════════════════════════════════');
    console.log(`   CSV File          : ${path.basename(CSV_PATH)}`);
    console.log(`   Classroom         : ${CLASS_NAME}`);
    console.log(`   Month             : ${MONTH_STR}`);
    console.log(`   New users created : ${userResult.newUsersCreated}`);
    console.log(`   Existing users    : ${userResult.existingCount}`);
    console.log(`   Attendance records: ${attendanceResult.importedCount}`);
    console.log(`   Updated (dupes)   : ${attendanceResult.skippedCount}`);
    if (attendanceResult.failedRows.length > 0) {
      console.log(`   Failed rows       : ${attendanceResult.failedRows.length}`);
      attendanceResult.failedRows.forEach(r =>
        console.log(`     Row ${r.row}: ${r.registerNumber || '?'} → ${r.reason}`)
      );
    }
    console.log('══════════════════════════════════════════════════════════════════\n');
    console.log('   Default login for new students:');
    console.log('   Email    : <registerNumber.toLowerCase()>@kvcetstudent.edu');
    console.log('   Password : KVCET@123  (must be changed on first login)');
    console.log('══════════════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Import failed: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
};

run();
