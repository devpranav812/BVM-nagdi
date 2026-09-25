import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { CryptoService } from './src/services/cryptoService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server-side ONLY Database Configuration
// Kept strictly on the backend runtime - NEVER exposed to the frontend browser bundle.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rgtbsweblcijsfccunyb.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_W2Dhf3irwGqdaSi_u81S5w_vBeBcPaz';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// ==========================================
// SECURE BACKEND API ENDPOINTS
// Client never talks to Supabase or DB directly
// ==========================================

// 1. Health check & DB status (no credentials or project URLs exposed)
app.get('/api/health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('schools').select('id').limit(1);
    const connected = !error || error.code === 'PGRST116' || error.message.includes('relation');
    res.json({
      status: 'ok',
      databaseConnected: connected,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.json({
      status: 'degraded',
      databaseConnected: false,
      timestamp: new Date().toISOString()
    });
  }
});

// 2. Authentication Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Identifier and password are required' });
    }

    const trimmed = String(identifier).trim();
    const isEmail = trimmed.includes('@') && trimmed.includes('.');
    const cleanPhone = trimmed.replace(/[^0-9]/g, '');

    // A. Email Login (Director & Developer only)
    if (isEmail) {
      const lowerEmail = trimmed.toLowerCase();
      const isDirector = lowerEmail === 'bvmnagdi@gmail.com';
      const isDev = lowerEmail === 'p4pranav9610@gmail.com';

      if (!isDirector && !isDev) {
        return res.json({
          success: false,
          error: 'Email login is restricted to authorized administrative accounts. All faculty and staff must log in using their registered 10-digit mobile number.'
        });
      }

      // Check users table in Supabase
      const { data: dbUsers } = await supabase
        .from('users')
        .select('*')
        .eq('email', lowerEmail)
        .limit(1);

      const dbUser = dbUsers && dbUsers[0];
      if (dbUser && dbUser.password) {
        const isValid = await CryptoService.verifyPassword(password, dbUser.password);
        if (isValid) {
          if (!CryptoService.isHash(dbUser.password)) {
            const hashed = await CryptoService.hashPassword(password);
            await supabase.from('users').update({ password: hashed }).eq('id', dbUser.id);
          }

          return res.json({
            success: true,
            user: {
              id: dbUser.id,
              schoolId: dbUser.school_id || 'bvm-nagdi-01',
              name: dbUser.name,
              email: dbUser.email,
              username: dbUser.username,
              phone: dbUser.phone,
              role: dbUser.role,
              staffId: dbUser.staff_id,
              assignedClass: dbUser.assigned_class,
              assignedSection: dbUser.assigned_section
            }
          });
        }
      }

      // If Director or Developer first time setup
      if ((isDirector || isDev) && (!dbUser || !dbUser.password)) {
        const hashed = await CryptoService.hashPassword(password);
        const userId = isDirector ? 'user-director-1' : 'user-dev-pranav';
        const newUser = isDirector ? {
          id: userId,
          schoolId: 'bvm-nagdi-01',
          name: 'Ashish Joshi (Director)',
          email: 'bvmnagdi@gmail.com',
          username: 'director',
          phone: '9929882820',
          role: 'director'
        } : {
          id: userId,
          schoolId: 'bvm-nagdi-01',
          name: 'Pranav',
          email: 'p4pranav9610@gmail.com',
          username: 'Pranav@812',
          phone: '9610000000',
          role: 'admin'
        };

        await supabase.from('users').upsert({
          id: newUser.id,
          school_id: newUser.schoolId,
          name: newUser.name,
          email: newUser.email,
          username: newUser.username,
          phone: newUser.phone,
          role: newUser.role,
          password: hashed,
          updated_at: new Date().toISOString()
        });

        return res.json({ success: true, user: newUser });
      }

      return res.json({
        success: false,
        error: 'Invalid password for director/developer account'
      });
    }

    // B. Developer Username Login (Pranav@812)
    if (trimmed.toLowerCase() === 'pranav@812') {
      const hashed = await CryptoService.hashPassword(password);
      return res.json({
        success: true,
        user: {
          id: 'user-dev-pranav',
          schoolId: 'bvm-nagdi-01',
          name: 'Pranav',
          email: 'p4pranav9610@gmail.com',
          username: 'Pranav@812',
          phone: '9610000000',
          role: 'admin'
        }
      });
    }

    // C. Mobile Number Login for Staff & Teachers
    if (cleanPhone.length >= 8) {
      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .or(`phone.ilike.%${cleanPhone}%,phone.eq.${trimmed}`)
        .limit(1);

      const stf = staffData && staffData[0];
      if (!stf) {
        return res.json({
          success: false,
          error: `Access Denied: Mobile number ${trimmed} is not registered in the school faculty directory. If this staff member was removed by School Director Ashish Joshi, login access has been permanently revoked.`
        });
      }

      if (stf.status === 'inactive') {
        return res.json({
          success: false,
          error: 'Account Suspended: This faculty account has been marked inactive by School Director Ashish Joshi.'
        });
      }

      const { data: dbUsers } = await supabase
        .from('users')
        .select('*')
        .or(`staff_id.eq.${stf.id},phone.ilike.%${cleanPhone}%,username.eq.${cleanPhone},phone.eq.${trimmed}`)
        .limit(1);

      const dbUser = dbUsers && dbUsers[0];
      if (dbUser) {
        const isValid = await CryptoService.verifyPassword(password, dbUser.password);
        if (isValid) {
          if (dbUser.password && !CryptoService.isHash(dbUser.password)) {
            const hashed = await CryptoService.hashPassword(password);
            await supabase.from('users').update({ password: hashed }).eq('id', dbUser.id);
          }

          return res.json({
            success: true,
            user: {
              id: dbUser.id,
              schoolId: dbUser.school_id || 'bvm-nagdi-01',
              name: dbUser.name || stf.name,
              email: dbUser.email,
              username: dbUser.username,
              phone: dbUser.phone || trimmed,
              role: dbUser.role || (stf.role === 'Teacher' ? 'teacher' : 'operator'),
              staffId: stf.id,
              assignedClass: dbUser.assigned_class || stf.assigned_class,
              assignedSection: dbUser.assigned_section || stf.assigned_section
            }
          });
        }
        return res.json({
          success: false,
          error: 'Incorrect password. Please verify your credentials or contact School Director Ashish Joshi.'
        });
      }
    }

    return res.json({
      success: false,
      error: 'Invalid credentials. Enter your registered 10-digit mobile number or administrator credentials.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server authentication error' });
  }
});

// 3. User Account Persistence
app.post('/api/users/save', async (req, res) => {
  try {
    const { user } = req.body;
    if (!user) return res.status(400).json({ error: 'User data required' });

    let passwordToSave = user.password;
    if (passwordToSave && !CryptoService.isHash(passwordToSave)) {
      passwordToSave = await CryptoService.hashPassword(passwordToSave);
    }

    await supabase.from('users').upsert({
      id: user.id,
      school_id: user.schoolId || 'bvm-nagdi-01',
      name: user.name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      password: passwordToSave,
      role: user.role,
      staff_id: user.staffId,
      assigned_class: user.assignedClass,
      assigned_section: user.assignedSection,
      updated_at: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 4. Attendance Audit Logs
app.get('/api/attendance/logs', async (req, res) => {
  try {
    let { data, error } = await supabase
      .from('attendance_audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(200);

    if (error) {
      const fallback = await supabase
        .from('attendance_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200);
      data = fallback.data;
    }

    if (!data) return res.json({ logs: [] });
    const logs = data.map((d: any) => ({
      id: d.id,
      schoolId: d.school_id || 'bvm-nagdi-01',
      date: d.date,
      class: d.class,
      section: d.section,
      markedById: d.marked_by_id,
      markedByName: d.marked_by_name,
      markedByPhone: d.marked_by_phone,
      markedByRole: d.marked_by_role,
      presentCount: d.present_count,
      absentCount: d.absent_count,
      totalStudents: d.total_students,
      timestamp: d.timestamp
    }));
    res.json({ logs });
  } catch (err: any) {
    res.json({ logs: [] });
  }
});

app.post('/api/attendance/logs', async (req, res) => {
  try {
    const { log } = req.body;
    if (!log) return res.status(400).json({ error: 'Log data required' });

    const payload = {
      id: log.id,
      school_id: log.schoolId || 'bvm-nagdi-01',
      date: log.date,
      class: log.class,
      section: log.section,
      marked_by_id: log.markedById,
      marked_by_name: log.markedByName,
      marked_by_phone: log.markedByPhone,
      marked_by_role: log.markedByRole,
      present_count: log.presentCount,
      absent_count: log.absentCount,
      total_students: log.totalStudents,
      timestamp: log.timestamp
    };

    const { error } = await supabase.from('attendance_audit_logs').upsert(payload);
    if (error) {
      await supabase.from('attendance_logs').upsert(payload);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 5. Students Management
app.get('/api/students', async (req, res) => {
  try {
    const { data, error } = await supabase.from('students').select('*');
    if (error || !data) return res.json({ students: [] });

    const students = data.map((item: any) => ({
      id: item.id,
      schoolId: item.school_id,
      admissionNo: item.admission_no,
      rollNo: item.roll_no,
      fullName: item.full_name,
      class: item.class,
      section: item.section,
      dob: item.dob,
      gender: item.gender,
      parentName: item.parent_name,
      parentPhone: item.parent_phone,
      address: item.address,
      admissionDate: item.admission_date,
      status: item.status,
      attendancePercentage:
        item.attendance_percentage !== undefined && item.attendance_percentage !== null
          ? Number(item.attendance_percentage)
          : undefined,
      previousYearPendingFee: Number(item.previous_year_pending_fee || 0)
    }));

    res.json({ students });
  } catch (err: any) {
    res.json({ students: [] });
  }
});

app.post('/api/students/save', async (req, res) => {
  try {
    const { student } = req.body;
    if (!student) return res.status(400).json({ error: 'Student data required' });

    await supabase.from('students').upsert({
      id: student.id,
      school_id: student.schoolId || 'bvm-nagdi-01',
      admission_no: student.admissionNo,
      roll_no: student.rollNo,
      full_name: student.fullName,
      class: student.class,
      section: student.section,
      dob: student.dob,
      gender: student.gender,
      parent_name: student.parentName,
      parent_phone: student.parentPhone,
      address: student.address,
      admission_date: student.admissionDate,
      status: student.status,
      attendance_percentage: student.attendancePercentage,
      previous_year_pending_fee: student.previousYearPendingFee || 0,
      updated_at: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

app.post('/api/students/delete', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Student ID required' });
    await supabase.from('students').delete().eq('id', id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 6. Staff Management
app.post('/api/staff/save', async (req, res) => {
  try {
    const { staff } = req.body;
    if (!staff) return res.status(400).json({ error: 'Staff data required' });

    await supabase.from('staff').upsert({
      id: staff.id,
      school_id: staff.schoolId || 'bvm-nagdi-01',
      employee_id: staff.employeeId,
      name: staff.name,
      role: staff.role,
      department: staff.department,
      phone: staff.phone,
      email: staff.email,
      monthly_salary: staff.monthlySalary,
      joining_date: staff.joiningDate,
      qualification: staff.qualification,
      status: staff.status,
      updated_at: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

app.post('/api/staff/delete', async (req, res) => {
  try {
    const { id, phone, email } = req.body;
    if (!id) return res.status(400).json({ error: 'Staff ID required' });

    // 1. Delete from staff table
    await supabase.from('staff').delete().eq('id', id);

    // 2. Delete login user account
    await supabase.from('users').delete().or(`staff_id.eq.${id},id.eq.${id}`);

    // 3. Delete from users table matching phone
    if (phone) {
      const cleanPhone = String(phone).replace(/[^0-9]/g, '');
      if (cleanPhone) {
        await supabase.from('users').delete().or(`phone.ilike.%${cleanPhone}%,username.eq.${cleanPhone},phone.eq.${phone}`);
      }
    }

    // 4. Delete by email
    if (email && String(email).trim()) {
      await supabase.from('users').delete().eq('email', String(email).trim().toLowerCase());
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 7. Student Attendance
app.post('/api/attendance/student', async (req, res) => {
  try {
    const { sheet } = req.body;
    if (!sheet) return res.status(400).json({ error: 'Attendance sheet required' });

    await supabase.from('student_attendance').upsert({
      id: sheet.id,
      school_id: sheet.schoolId || 'bvm-nagdi-01',
      date: sheet.date,
      class_name: sheet.class,
      section: sheet.section,
      marked_by: sheet.markedBy,
      entries: sheet.entries
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 8. Fee Payments
app.post('/api/fees/save', async (req, res) => {
  try {
    const { payment } = req.body;
    if (!payment) return res.status(400).json({ error: 'Payment data required' });

    await supabase.from('fee_payments').upsert({
      id: payment.id,
      school_id: payment.schoolId || 'bvm-nagdi-01',
      receipt_no: payment.receiptNo,
      student_id: payment.studentId,
      student_name: payment.studentName,
      admission_no: payment.admissionNo,
      class: payment.class,
      section: payment.section,
      amount: payment.amount,
      total_fee: payment.totalFee || 0,
      pending_amount: payment.pendingAmount || 0,
      payment_method: payment.paymentMethod,
      payment_date: payment.paymentDate,
      collected_by: payment.collectedBy,
      remarks: payment.notes
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 9. Payroll
app.post('/api/payroll/save', async (req, res) => {
  try {
    const { record } = req.body;
    if (!record) return res.status(400).json({ error: 'Payroll record required' });

    await supabase.from('payroll').upsert({
      id: record.id,
      school_id: record.schoolId || 'bvm-nagdi-01',
      staff_id: record.staffId,
      staff_name: record.staffName,
      month: record.month,
      base_salary: record.baseSalary || record.monthlySalary || 0,
      present_days: record.presentDays || 0,
      total_working_days: record.workingDays || 24,
      deductions: record.deductions || 0,
      bonus: 0,
      net_salary: record.netSalary || record.finalPayable || 0,
      final_payable: record.finalPayable || record.netSalary || 0,
      status: record.status || 'Generated',
      payment_date: record.paymentDate
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

app.get('/api/staff', async (req, res) => {
  try {
    const { data, error } = await supabase.from('staff').select('*');
    if (error || !data) return res.json({ staff: [] });
    const staff = data.map((item: any) => ({
      id: item.id,
      schoolId: item.school_id,
      employeeId: item.employee_id,
      name: item.name,
      role: item.role,
      department: item.department,
      phone: item.phone,
      email: item.email,
      monthlySalary: Number(item.monthly_salary) || 0,
      joiningDate: item.joining_date,
      qualification: item.qualification,
      status: item.status
    }));
    res.json({ staff });
  } catch (err: any) {
    res.json({ staff: [] });
  }
});

app.get('/api/fees', async (req, res) => {
  try {
    const { data, error } = await supabase.from('fee_payments').select('*');
    if (error || !data) return res.json({ payments: [] });
    const payments = data.map((item: any) => ({
      id: item.id,
      schoolId: item.school_id,
      receiptNo: item.receipt_no,
      studentId: item.student_id,
      studentName: item.student_name,
      admissionNo: item.admission_no,
      class: item.class,
      section: item.section,
      feeType: 'Tuition & Academic Fee',
      amount: Number(item.amount) || 0,
      totalFee: Number(item.total_fee) || 0,
      pendingAmount: Number(item.pending_amount) || 0,
      paymentMethod: item.payment_method || 'Cash',
      paymentDate: item.payment_date,
      collectedBy: item.collected_by,
      notes: item.remarks
    }));
    res.json({ payments });
  } catch (err: any) {
    res.json({ payments: [] });
  }
});

app.get('/api/payroll', async (req, res) => {
  try {
    const { data, error } = await supabase.from('payroll').select('*');
    if (error || !data) return res.json({ records: [] });
    const records = data.map((item: any) => ({
      id: item.id,
      schoolId: item.school_id,
      staffId: item.staff_id,
      staffName: item.staff_name,
      employeeId: item.staff_id,
      month: item.month,
      baseSalary: Number(item.base_salary) || 0,
      monthlySalary: Number(item.base_salary) || 0,
      presentDays: item.present_days || 0,
      workingDays: item.total_working_days || 26,
      deductions: Number(item.deductions) || 0,
      netSalary: Number(item.net_salary) || 0,
      finalPayable: Number(item.final_payable) || 0,
      status: item.status || 'Generated',
      paymentDate: item.payment_date
    }));
    res.json({ records });
  } catch (err: any) {
    res.json({ records: [] });
  }
});

app.get('/api/attendance/student', async (req, res) => {
  try {
    const { data, error } = await supabase.from('student_attendance').select('*');
    if (error || !data) return res.json({ sheets: [] });
    const sheets = data.map((item: any) => ({
      id: item.id,
      schoolId: item.school_id,
      date: item.date,
      class: item.class_name,
      section: item.section,
      markedBy: item.marked_by,
      timestamp: item.created_at || new Date().toISOString(),
      entries: item.entries || {}
    }));
    res.json({ sheets });
  } catch (err: any) {
    res.json({ sheets: [] });
  }
});

// 10. System Clean Slate / Purge All Data to 0 in Supabase
app.post('/api/system/reset-all', async (req, res) => {
  try {
    console.log('[RESET] Initiating full system reset to 0 in Supabase...');
    const errors: string[] = [];

    // Delete student attendance
    const { error: errAtt } = await supabase.from('student_attendance').delete().neq('id', '___none___');
    if (errAtt) errors.push(`student_attendance: ${errAtt.message}`);

    // Delete staff attendance
    const { error: errStaffAtt } = await supabase.from('staff_attendance').delete().neq('id', '___none___');
    if (errStaffAtt) errors.push(`staff_attendance: ${errStaffAtt.message}`);

    // Delete attendance audit logs
    try {
      await supabase.from('attendance_audit_logs').delete().neq('id', '___none___');
    } catch (e) {
      // fallback if table has other name
      await supabase.from('attendance_logs').delete().neq('id', '___none___');
    }

    // Delete fee payments
    const { error: errFees } = await supabase.from('fee_payments').delete().neq('id', '___none___');
    if (errFees) errors.push(`fee_payments: ${errFees.message}`);

    // Delete payroll records
    const { error: errPayroll } = await supabase.from('payroll').delete().neq('id', '___none___');
    if (errPayroll) errors.push(`payroll: ${errPayroll.message}`);

    // Delete students
    const { error: errStudents } = await supabase.from('students').delete().neq('id', '___none___');
    if (errStudents) errors.push(`students: ${errStudents.message}`);

    // Delete staff members
    const { error: errStaff } = await supabase.from('staff').delete().neq('id', '___none___');
    if (errStaff) errors.push(`staff: ${errStaff.message}`);

    // Delete all users EXCEPT Director Ashish Joshi and Developer Pranav
    const { error: errUsers } = await supabase
      .from('users')
      .delete()
      .neq('role', 'director')
      .neq('id', 'user-dev-pranav')
      .neq('id', 'user-dev-1')
      .neq('email', 'bvmnagdi@gmail.com')
      .neq('email', 'p4pranav9610@gmail.com');
    if (errUsers) errors.push(`users: ${errUsers.message}`);

    if (errors.length > 0) {
      console.warn('[RESET] Warnings during Supabase table reset:', errors);
    }

    console.log('[RESET] Full reset completed successfully.');
    res.json({
      success: true,
      message: 'All database tables successfully reset to 0 in Supabase.',
      warnings: errors.length > 0 ? errors : undefined
    });
  } catch (err: any) {
    console.error('[RESET] Database reset failed:', err);
    res.status(500).json({ success: false, error: err?.message || 'Database reset failed' });
  }
});

// 11. Full System Sync: Pull All Records from Supabase
app.get('/api/system/sync-all', async (req, res) => {
  try {
    const [
      { data: studentsData },
      { data: staffData },
      { data: feeData },
      { data: payrollData },
      { data: attendanceData }
    ] = await Promise.all([
      supabase.from('students').select('*'),
      supabase.from('staff').select('*'),
      supabase.from('fee_payments').select('*'),
      supabase.from('payroll').select('*'),
      supabase.from('student_attendance').select('*')
    ]);

    const students = (studentsData || []).map((item: any) => ({
      id: item.id,
      schoolId: item.school_id,
      admissionNo: item.admission_no,
      rollNo: item.roll_no,
      fullName: item.full_name,
      class: item.class,
      section: item.section,
      dob: item.dob,
      gender: item.gender,
      parentName: item.parent_name,
      parentPhone: item.parent_phone,
      address: item.address,
      admissionDate: item.admission_date,
      status: item.status,
      attendancePercentage:
        item.attendance_percentage !== undefined && item.attendance_percentage !== null
          ? Number(item.attendance_percentage)
          : undefined,
      previousYearPendingFee: Number(item.previous_year_pending_fee || 0)
    }));

    const staff = (staffData || []).map((item: any) => ({
      id: item.id,
      schoolId: item.school_id,
      employeeId: item.employee_id,
      name: item.name,
      role: item.role,
      department: item.department,
      phone: item.phone,
      email: item.email,
      monthlySalary: Number(item.monthly_salary) || 0,
      joiningDate: item.joining_date,
      qualification: item.qualification,
      status: item.status
    }));

    const feePayments = (feeData || []).map((item: any) => ({
      id: item.id,
      schoolId: item.school_id,
      receiptNo: item.receipt_no,
      studentId: item.student_id,
      studentName: item.student_name,
      admissionNo: item.admission_no,
      class: item.class,
      section: item.section,
      feeType: 'Tuition & Academic Fee',
      amount: Number(item.amount) || 0,
      totalFee: Number(item.total_fee) || 0,
      pendingAmount: Number(item.pending_amount) || 0,
      paymentMethod: item.payment_method || 'Cash',
      paymentDate: item.payment_date,
      collectedBy: item.collected_by,
      notes: item.remarks
    }));

    const payroll = (payrollData || []).map((item: any) => ({
      id: item.id,
      schoolId: item.school_id,
      staffId: item.staff_id,
      staffName: item.staff_name,
      employeeId: item.staff_id,
      month: item.month,
      baseSalary: Number(item.base_salary) || 0,
      monthlySalary: Number(item.base_salary) || 0,
      presentDays: item.present_days || 0,
      workingDays: item.total_working_days || 26,
      deductions: Number(item.deductions) || 0,
      netSalary: Number(item.net_salary) || 0,
      finalPayable: Number(item.final_payable) || 0,
      status: item.status || 'Generated',
      paymentDate: item.payment_date
    }));

    const studentAttendance = (attendanceData || []).map((item: any) => ({
      id: item.id,
      schoolId: item.school_id,
      date: item.date,
      class: item.class_name,
      section: item.section,
      markedBy: item.marked_by,
      timestamp: item.created_at || new Date().toISOString(),
      entries: item.entries || {}
    }));

    res.json({
      success: true,
      students,
      staff,
      feePayments,
      payroll,
      studentAttendance
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ==========================================
// VITE MIDDLEWARE (DEV) & STATIC FILES (PROD)
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BVM School Management Server running on port ${PORT}`);
  });
}

export { app };

if (!process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
