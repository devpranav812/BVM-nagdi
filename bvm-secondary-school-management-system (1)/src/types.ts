export type UserRole = 'director' | 'operator' | 'teacher' | 'admin' | 'accountant';

export type StaffRole = 'Teacher' | 'Computer Operator' | 'Accountant' | 'Office Staff' | 'Support Staff' | 'Other';

export interface User {
  id: string;
  schoolId: string;
  name: string;
  email: string;
  phone?: string;
  username?: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  assignedClass?: string; // e.g. "Class 8"
  assignedSection?: string; // e.g. "A"
  assignedClasses?: string[]; // e.g. ["Class 8 - A", "Class 8"]
  staffId?: string;
}

export interface SchoolInfo {
  id: string;
  name: string;
  contactNumber: string;
  altPhone?: string;
  email: string;
  address: string;
  academicYear: string;
  affiliationNumber?: string;
  directorName: string;
  principalName?: string;
}

export interface ClassSection {
  id: string;
  schoolId: string;
  name: string; // e.g. "Class 8"
  sections: string[]; // e.g. ["A", "B"]
  classTeacher?: string; // Teacher name
  classTeacherId?: string; // Teacher staffId
  roomNumber?: string;
  capacity?: number;
}

export interface Student {
  id: string;
  schoolId: string;
  admissionNo: string;
  fullName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  class: string; // e.g. "Class 8"
  section: string; // e.g. "A"
  rollNo: string;
  parentName: string;
  parentPhone: string;
  address: string;
  admissionDate: string;
  status: 'active' | 'inactive';
  bloodGroup?: string;
  attendancePercentage?: number;
  previousYearPendingFee?: number; // Previous year arrears / pending fees
}

export interface Staff {
  id: string;
  schoolId: string;
  employeeId: string;
  name: string;
  role: StaffRole;
  department: string; // e.g. "Mathematics", "Accounts", "Administration"
  phone: string;
  email: string;
  joiningDate: string;
  monthlySalary: number;
  status: 'active' | 'inactive';
  qualification?: string;
  assignedClass?: string; // Assigned class e.g. "Class 8"
  assignedSection?: string; // Assigned section e.g. "A"
}

export interface AttendanceAuditLog {
  id: string;
  schoolId: string;
  date: string; // YYYY-MM-DD
  class: string;
  section: string;
  markedById: string;
  markedByName: string;
  markedByPhone?: string;
  markedByRole: string;
  presentCount: number;
  absentCount: number;
  totalStudents: number;
  timestamp: string; // ISO string
}

export type StudentAttendanceStatus = 'present' | 'absent';

export interface StudentAttendanceEntry {
  studentId: string;
  status: StudentAttendanceStatus;
}

export interface StudentAttendanceSheet {
  id: string;
  schoolId: string;
  date: string; // YYYY-MM-DD
  class: string;
  section: string;
  markedBy: string;
  timestamp: string;
  entries: Record<string, StudentAttendanceStatus>; // studentId -> status
}

export type StaffAttendanceStatus = 'present' | 'absent' | 'leave' | 'late';

export interface StaffDailyAttendance {
  id: string;
  schoolId: string;
  date: string;
  records: Record<string, { status: StaffAttendanceStatus; notes?: string }>;
  markedBy: string;
}

export interface FeeStructure {
  id: string;
  schoolId: string;
  class: string;
  tuitionFee: number;
  activityFee: number;
  transportFee: number;
  examFee: number;
  term: 'Monthly' | 'Quarterly' | 'Annual';
}

export type FeeStatus = 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue';

export interface StudentFeeSummary {
  studentId: string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: FeeStatus;
}

export interface PaymentReceipt {
  id: string;
  schoolId: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  class: string;
  section: string;
  feeType: string;
  amount: number;
  totalFee?: number;
  pendingAmount?: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'UPI' | 'Other';
  notes?: string;
  collectedBy: string;
}

export interface PayrollRecord {
  id: string;
  schoolId: string;
  staffId: string;
  staffName: string;
  employeeId: string;
  designation?: string;
  department?: string;
  month: string; // e.g. "September 2026" or "2026-09"
  monthlySalary?: number;
  baseSalary?: number;
  allowances?: number;
  workingDays?: number;
  presentDays?: number;
  leaveDays?: number;
  absentDays?: number;
  deductions: number;
  finalPayable?: number;
  netSalary?: number;
  status?: 'Generated' | 'Paid';
  paymentStatus?: 'Paid' | 'Pending';
  paymentMethod?: 'Bank Transfer' | 'Cash' | 'Cheque';
  paymentDate?: string;
  remarks?: string;
}

export type NoticeAudience = 'All' | 'All Staff' | 'Teachers' | 'Students' | 'Accountant' | 'Accountants' | 'Specific Class';

export interface Notice {
  id: string;
  schoolId: string;
  title: string;
  description?: string;
  content?: string;
  date?: string;
  publishDate?: string;
  expiryDate?: string;
  targetAudience?: NoticeAudience;
  audience?: NoticeAudience;
  targetClass?: string;
  author?: string;
  postedBy?: string;
  isImportant?: boolean;
  isPinned?: boolean;
  status?: 'Active' | 'Draft' | 'Expired';
}

export interface RevokedAccount {
  id: string;
  schoolId: string;
  staffId: string;
  userId?: string;
  name: string;
  phone?: string;
  email?: string;
  username?: string;
  role: string;
  revokedBy: string;
  revokedAt: string;
  reason?: string;
}

