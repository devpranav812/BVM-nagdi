-- ==============================================================================
-- BVM SECONDARY SCHOOL NAGDI - PRODUCTION SUPABASE POSTGRESQL SCHEMA
-- Project URL: https://rgtbsweblcijsfccunyb.supabase.co
-- School: Bhagwati Vidya Mandir Secondary School, Nagdi
-- Clean State: 0 Students, 0 Staff (Only Director and Developer Accounts)
-- ==============================================================================

-- Drop existing tables to start fresh if resetting
DROP TABLE IF EXISTS attendance_audit_logs CASCADE;
DROP TABLE IF EXISTS payroll CASCADE;
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS staff_attendance CASCADE;
DROP TABLE IF EXISTS student_attendance CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS schools CASCADE;

-- 1. SCHOOL PROFILE
CREATE TABLE schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Bhagwati Vidya Mandir Secondary School, Nagdi',
  address TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT,
  affiliation_number TEXT,
  principal_name TEXT,
  director_name TEXT DEFAULT 'Ashish Joshi',
  academic_year TEXT DEFAULT '2026-2027',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ACADEMIC CLASSES
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '["A", "B"]'::jsonb,
  class_teacher TEXT,
  room_number TEXT,
  capacity INTEGER DEFAULT 45,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. STAFF & FACULTY
CREATE TABLE staff (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  monthly_salary NUMERIC NOT NULL DEFAULT 15000,
  joining_date DATE,
  qualification TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SYSTEM USERS (Director, Developer, and Authorized Staff)
-- ON DELETE CASCADE ensures when Director removes any staff member,
-- their portal login credentials and user account are automatically and permanently deleted!
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  username TEXT,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('director', 'operator', 'admin', 'teacher', 'accountant')),
  staff_id TEXT REFERENCES staff(id) ON DELETE CASCADE,
  assigned_class TEXT,
  assigned_section TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. STUDENTS DIRECTORY (0 Records Initially)
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  admission_no TEXT UNIQUE NOT NULL,
  roll_no TEXT,
  full_name TEXT NOT NULL,
  class TEXT NOT NULL,
  section TEXT NOT NULL,
  dob DATE,
  gender TEXT,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  address TEXT,
  admission_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  attendance_percentage NUMERIC DEFAULT NULL,
  previous_year_pending_fee NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. STUDENT ATTENDANCE SHEETS
CREATE TABLE student_attendance (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  class_name TEXT NOT NULL,
  section TEXT NOT NULL,
  marked_by TEXT NOT NULL,
  entries JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, class_name, section)
);

-- 7. ATTENDANCE AUDIT LOGS (Who recorded or updated attendance)
CREATE TABLE attendance_audit_logs (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  class_name TEXT NOT NULL,
  section TEXT NOT NULL,
  marked_by_id TEXT,
  marked_by_name TEXT NOT NULL,
  marked_by_phone TEXT,
  marked_by_role TEXT NOT NULL,
  present_count INTEGER NOT NULL DEFAULT 0,
  absent_count INTEGER NOT NULL DEFAULT 0,
  total_students INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. STAFF DAILY ATTENDANCE
CREATE TABLE staff_attendance (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  date DATE NOT NULL UNIQUE,
  marked_by TEXT NOT NULL,
  records JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. FEE PAYMENTS & RECEIPTS
CREATE TABLE fee_payments (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  receipt_no TEXT UNIQUE NOT NULL,
  student_id TEXT,
  student_name TEXT NOT NULL,
  admission_no TEXT NOT NULL,
  class TEXT NOT NULL,
  section TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  total_fee NUMERIC NOT NULL,
  pending_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date DATE NOT NULL,
  collected_by TEXT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. PAYROLL DISBURSEMENTS
CREATE TABLE payroll (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  staff_id TEXT,
  staff_name TEXT NOT NULL,
  month TEXT NOT NULL,
  base_salary NUMERIC NOT NULL,
  present_days INTEGER DEFAULT 26,
  total_working_days INTEGER DEFAULT 26,
  deductions NUMERIC DEFAULT 0,
  bonus NUMERIC DEFAULT 0,
  net_salary NUMERIC NOT NULL,
  final_payable NUMERIC NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Paid', 'Pending')),
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- POLICIES: Allow access for application operations
CREATE POLICY "Allow all on schools" ON schools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on classes" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on staff" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on student_attendance" ON student_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on attendance_audit_logs" ON attendance_audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on staff_attendance" ON staff_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on fee_payments" ON fee_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on payroll" ON payroll FOR ALL USING (true) WITH CHECK (true);

-- INITIAL SEED: School Profile
INSERT INTO schools (id, name, address, contact_number, email, affiliation_number, director_name, academic_year)
VALUES (
  'bvm-nagdi-01',
  'Bhagwati Vidya Mandir Secondary School, Nagdi',
  'Nagdi, Arnod, Pratapgarh, Rajasthan - 312615',
  '9929882820',
  'bvmnagdi@gmail.com',
  'RBSE-RJ/48201/SEC',
  'Ashish Joshi',
  '2026-2027'
) ON CONFLICT (id) DO UPDATE SET
  contact_number = '9929882820',
  director_name = 'Ashish Joshi',
  email = 'bvmnagdi@gmail.com';

-- INITIAL SEED: Only Director Profile & Developer Profile
INSERT INTO users (id, school_id, name, email, phone, username, password, role)
VALUES
  ('user-director-1', 'bvm-nagdi-01', 'Ashish Joshi (Director)', 'bvmnagdi@gmail.com', '9929882820', 'director', 'director123', 'director'),
  ('user-dev-1', 'bvm-nagdi-01', 'Pranav (Lead Developer)', 'p4pranav9610@gmail.com', '9610000000', 'Pranav@812', 'Pranav@812', 'admin')
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  username = EXCLUDED.username;

-- INITIAL SEED: Academic Classes (Nursery, LKG, UKG, and Classes 1 to 10)
INSERT INTO classes (id, school_id, name, sections, room_number, capacity)
VALUES
  ('cls-nursery', 'bvm-nagdi-01', 'Nursery', '["A"]'::jsonb, 'KG Block 1', 30),
  ('cls-lkg', 'bvm-nagdi-01', 'LKG', '["A"]'::jsonb, 'KG Block 2', 30),
  ('cls-ukg', 'bvm-nagdi-01', 'UKG', '["A"]'::jsonb, 'KG Block 3', 35),
  ('cls-1', 'bvm-nagdi-01', 'Class 1', '["A", "B"]'::jsonb, 'Room 101', 40),
  ('cls-2', 'bvm-nagdi-01', 'Class 2', '["A", "B"]'::jsonb, 'Room 102', 40),
  ('cls-3', 'bvm-nagdi-01', 'Class 3', '["A", "B"]'::jsonb, 'Room 103', 40),
  ('cls-4', 'bvm-nagdi-01', 'Class 4', '["A", "B"]'::jsonb, 'Room 104', 40),
  ('cls-5', 'bvm-nagdi-01', 'Class 5', '["A", "B"]'::jsonb, 'Room 105', 40),
  ('cls-6', 'bvm-nagdi-01', 'Class 6', '["A", "B"]'::jsonb, 'Room 201', 45),
  ('cls-7', 'bvm-nagdi-01', 'Class 7', '["A", "B"]'::jsonb, 'Room 202', 45),
  ('cls-8', 'bvm-nagdi-01', 'Class 8', '["A", "B"]'::jsonb, 'Room 203', 50),
  ('cls-9', 'bvm-nagdi-01', 'Class 9', '["A", "B"]'::jsonb, 'Room 204', 50),
  ('cls-10', 'bvm-nagdi-01', 'Class 10', '["A", "B"]'::jsonb, 'Room 205', 50)
ON CONFLICT (id) DO NOTHING;
