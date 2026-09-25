import {
  SchoolInfo,
  User,
  ClassSection,
  Student,
  Staff,
  FeeStructure,
  PaymentReceipt,
  PayrollRecord,
  Notice,
  StudentAttendanceSheet,
  StaffDailyAttendance
} from '../types';

export const CURRENT_SCHOOL: SchoolInfo = {
  id: 'bvm-nagdi-01',
  name: 'Bhagwati Vidya Mandir Secondary School, Nagdi',
  contactNumber: '9929882820',
  altPhone: '9414000000',
  email: 'bvmnagdi@gmail.com',
  address: 'Nagdi, Arnod, Pratapgarh, Rajasthan - 312615',
  academicYear: '2026-2027',
  affiliationNumber: 'RBSE-RJ/48201/SEC',
  directorName: 'Ashish Joshi'
};

// ONLY Director and Developer have primary administrative access
export const DEMO_USERS: User[] = [
  {
    id: 'user-director-1',
    schoolId: 'bvm-nagdi-01',
    name: 'Ashish Joshi (Director)',
    email: 'bvmnagdi@gmail.com',
    username: 'director',
    phone: '9929882820',
    role: 'director'
  },
  {
    id: 'user-dev-pranav',
    schoolId: 'bvm-nagdi-01',
    name: 'Pranav',
    email: 'p4pranav9610@gmail.com',
    username: 'Pranav@812',
    phone: '9610000000',
    role: 'admin'
  }
];

// Academic classes including Pre-Primary (Nursery, LKG, UKG) and Grades 1-10
export const INITIAL_CLASSES: ClassSection[] = [
  { id: 'cls-nursery', schoolId: 'bvm-nagdi-01', name: 'Nursery', sections: ['A', 'B'], roomNumber: 'Room Pre-1', capacity: 35 },
  { id: 'cls-lkg', schoolId: 'bvm-nagdi-01', name: 'LKG', sections: ['A', 'B'], roomNumber: 'Room Pre-2', capacity: 35 },
  { id: 'cls-ukg', schoolId: 'bvm-nagdi-01', name: 'UKG', sections: ['A', 'B'], roomNumber: 'Room Pre-3', capacity: 35 },
  { id: 'cls-1', schoolId: 'bvm-nagdi-01', name: 'Class 1', sections: ['A', 'B'], roomNumber: 'Room 101', capacity: 40 },
  { id: 'cls-2', schoolId: 'bvm-nagdi-01', name: 'Class 2', sections: ['A', 'B'], roomNumber: 'Room 102', capacity: 40 },
  { id: 'cls-3', schoolId: 'bvm-nagdi-01', name: 'Class 3', sections: ['A', 'B'], roomNumber: 'Room 103', capacity: 40 },
  { id: 'cls-4', schoolId: 'bvm-nagdi-01', name: 'Class 4', sections: ['A', 'B'], roomNumber: 'Room 104', capacity: 40 },
  { id: 'cls-5', schoolId: 'bvm-nagdi-01', name: 'Class 5', sections: ['A', 'B'], roomNumber: 'Room 105', capacity: 40 },
  { id: 'cls-6', schoolId: 'bvm-nagdi-01', name: 'Class 6', sections: ['A', 'B'], roomNumber: 'Room 201', capacity: 45 },
  { id: 'cls-7', schoolId: 'bvm-nagdi-01', name: 'Class 7', sections: ['A', 'B'], roomNumber: 'Room 202', capacity: 45 },
  { id: 'cls-8', schoolId: 'bvm-nagdi-01', name: 'Class 8', sections: ['A', 'B'], roomNumber: 'Room 203', capacity: 50 },
  { id: 'cls-9', schoolId: 'bvm-nagdi-01', name: 'Class 9', sections: ['A', 'B'], roomNumber: 'Room 204', capacity: 50 },
  { id: 'cls-10', schoolId: 'bvm-nagdi-01', name: 'Class 10', sections: ['A', 'B'], roomNumber: 'Room 205', capacity: 50 }
];

// 0 Students initially - to be added by Director or Developer
export const INITIAL_STUDENTS: Student[] = [];

// 0 Staff initially - to be added by Director or Developer
export const INITIAL_STAFF: Staff[] = [];

// 0 Attendance records initially
export const INITIAL_STUDENT_ATTENDANCE_SHEETS: StudentAttendanceSheet[] = [];
export const INITIAL_STUDENT_ATTENDANCE: StudentAttendanceSheet[] = [];
export const INITIAL_STAFF_ATTENDANCE: StaffDailyAttendance[] = [];

// Standard Annual Fee Structures for all classes (Pre-Primary through Class 10)
export const INITIAL_FEE_STRUCTURES: FeeStructure[] = [
  { id: 'fee-nursery', schoolId: 'bvm-nagdi-01', class: 'Nursery', tuitionFee: 8500, activityFee: 1500, transportFee: 0, examFee: 1000, term: 'Annual' },
  { id: 'fee-lkg', schoolId: 'bvm-nagdi-01', class: 'LKG', tuitionFee: 9500, activityFee: 1500, transportFee: 0, examFee: 1000, term: 'Annual' },
  { id: 'fee-ukg', schoolId: 'bvm-nagdi-01', class: 'UKG', tuitionFee: 10500, activityFee: 1500, transportFee: 0, examFee: 1000, term: 'Annual' },
  { id: 'fee-1', schoolId: 'bvm-nagdi-01', class: 'Class 1', tuitionFee: 12000, activityFee: 2000, transportFee: 0, examFee: 1200, term: 'Annual' },
  { id: 'fee-2', schoolId: 'bvm-nagdi-01', class: 'Class 2', tuitionFee: 12500, activityFee: 2000, transportFee: 0, examFee: 1200, term: 'Annual' },
  { id: 'fee-3', schoolId: 'bvm-nagdi-01', class: 'Class 3', tuitionFee: 13500, activityFee: 2000, transportFee: 0, examFee: 1500, term: 'Annual' },
  { id: 'fee-4', schoolId: 'bvm-nagdi-01', class: 'Class 4', tuitionFee: 14500, activityFee: 2000, transportFee: 0, examFee: 1500, term: 'Annual' },
  { id: 'fee-5', schoolId: 'bvm-nagdi-01', class: 'Class 5', tuitionFee: 15500, activityFee: 2500, transportFee: 0, examFee: 1800, term: 'Annual' },
  { id: 'fee-6', schoolId: 'bvm-nagdi-01', class: 'Class 6', tuitionFee: 17000, activityFee: 2500, transportFee: 0, examFee: 2000, term: 'Annual' },
  { id: 'fee-7', schoolId: 'bvm-nagdi-01', class: 'Class 7', tuitionFee: 18500, activityFee: 2500, transportFee: 0, examFee: 2000, term: 'Annual' },
  { id: 'fee-8', schoolId: 'bvm-nagdi-01', class: 'Class 8', tuitionFee: 20000, activityFee: 3000, transportFee: 0, examFee: 2500, term: 'Annual' },
  { id: 'fee-9', schoolId: 'bvm-nagdi-01', class: 'Class 9', tuitionFee: 23000, activityFee: 3500, transportFee: 0, examFee: 3000, term: 'Annual' },
  { id: 'fee-10', schoolId: 'bvm-nagdi-01', class: 'Class 10', tuitionFee: 26000, activityFee: 4000, transportFee: 0, examFee: 3500, term: 'Annual' }
];

// 0 Payments initially
export const INITIAL_PAYMENTS: PaymentReceipt[] = [];

// 0 Payroll records initially
export const INITIAL_PAYROLL: PayrollRecord[] = [];

// 0 Notices
export const INITIAL_NOTICES: Notice[] = [];
