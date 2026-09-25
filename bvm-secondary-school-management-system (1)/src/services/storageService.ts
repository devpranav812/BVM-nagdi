import {
  SchoolInfo,
  User,
  UserRole,
  ClassSection,
  Student,
  Staff,
  FeeStructure,
  PaymentReceipt,
  PayrollRecord,
  Notice,
  StudentAttendanceSheet,
  StaffDailyAttendance,
  StudentAttendanceStatus,
  StaffAttendanceStatus,
  FeeStatus,
  AttendanceAuditLog
} from '../types';
import {
  CURRENT_SCHOOL,
  DEMO_USERS,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_STAFF,
  INITIAL_FEE_STRUCTURES,
  INITIAL_PAYMENTS,
  INITIAL_NOTICES,
  INITIAL_PAYROLL,
  INITIAL_STUDENT_ATTENDANCE,
  INITIAL_STAFF_ATTENDANCE
} from '../data/mockData';
import { SupabaseService } from './supabaseService';
import { CryptoService } from './cryptoService';

const STORAGE_KEYS = {
  SCHOOL: 'bvm_school_info',
  USER: 'bvm_active_user',
  USERS: 'bvm_users',
  CLASSES: 'bvm_classes',
  STUDENTS: 'bvm_students',
  STAFF: 'bvm_staff',
  FEE_STRUCTURES: 'bvm_fee_structures',
  PAYMENTS: 'bvm_payments',
  NOTICES: 'bvm_notices',
  PAYROLL: 'bvm_payroll',
  STUDENT_ATTENDANCE: 'bvm_student_attendance',
  STAFF_ATTENDANCE: 'bvm_staff_attendance',
  ATTENDANCE_LOGS: 'bvm_attendance_audit_logs'
};

// Automatic one-time wipe to clean SaaS state: 0 students, 0 staff, Director & Developer only (no hardcoded passwords)
const CLEAN_SAAS_KEY = 'bvm_clean_saas_v7_unhardcoded';
if (typeof window !== 'undefined' && localStorage.getItem(CLEAN_SAAS_KEY) !== 'ready') {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEMO_USERS));
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.STUDENT_ATTENDANCE, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.STAFF_ATTENDANCE, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE_LOGS, JSON.stringify([]));
  localStorage.setItem(CLEAN_SAAS_KEY, 'ready');
}

function getStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading storage for ${key}`, e);
    return fallback;
  }
}

function setStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving storage for ${key}`, e);
  }
}

export class StorageService {
  static notifyChange(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bvm_data_changed'));
    }
  }

  // School Info
  static getSchoolInfo(): SchoolInfo {
    const info = getStorage<SchoolInfo>(STORAGE_KEYS.SCHOOL, CURRENT_SCHOOL);
    // School name is permanently immutable and bound to Bhagwati Vidya Mandir Secondary School, Nagdi
    return {
      ...info,
      name: CURRENT_SCHOOL.name,
      contactNumber: info.contactNumber && info.contactNumber !== '6266572346' ? info.contactNumber : '9929882820'
    };
  }

  static updateSchoolInfo(info: Partial<SchoolInfo>): SchoolInfo {
    const current = this.getSchoolInfo();
    const updated = {
      ...current,
      ...info,
      name: CURRENT_SCHOOL.name // Protected immutable school name
    };
    setStorage(STORAGE_KEYS.SCHOOL, updated);
    this.notifyChange();
    return updated;
  }

  static saveSchoolInfo(info: SchoolInfo): SchoolInfo {
    const protectedInfo = {
      ...info,
      name: CURRENT_SCHOOL.name // Protected immutable school name
    };
    setStorage(STORAGE_KEYS.SCHOOL, protectedInfo);
    this.notifyChange();
    return protectedInfo;
  }

  // Users Management & Authentication
  static getUsers(): User[] {
    let users = getStorage<User[]>(STORAGE_KEYS.USERS, []);
    if (!users || users.length === 0) {
      setStorage(STORAGE_KEYS.USERS, DEMO_USERS);
      return DEMO_USERS;
    }

    // Ensure Developer Pranav is registered with his username & email
    const hasDev = users.some(
      u => u.username?.toLowerCase() === 'pranav@812' || u.email.toLowerCase() === 'p4pranav9610@gmail.com'
    );
    if (!hasDev) {
      const devUser = DEMO_USERS.find(u => u.username === 'Pranav@812');
      if (devUser) {
        users = [...users.filter(u => u.id !== 'user-dev-1'), devUser];
        setStorage(STORAGE_KEYS.USERS, users);
      }
    }

    // Ensure any legacy unhashed plaintext passwords are wiped clean
    let modified = false;
    users = users.map(u => {
      if (u.role === 'director' && u.password && !CryptoService.isHash(u.password)) {
        modified = true;
        const { password: _, ...rest } = u;
        return rest;
      }
      return u;
    });
    if (modified) {
      setStorage(STORAGE_KEYS.USERS, users);
    }

    return users;
  }

  static saveUser(user: User): User[] {
    const list = this.getUsers();
    const idx = list.findIndex(
      u => u.id === user.id || 
           (user.username && u.username?.toLowerCase() === user.username.toLowerCase()) ||
           u.email.toLowerCase() === user.email.toLowerCase()
    );
    let updated: User[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = { ...list[idx], ...user };
    } else {
      updated = [...list, user];
    }
    setStorage(STORAGE_KEYS.USERS, updated);
    this.notifyChange();
    SupabaseService.saveUser(user).catch(console.warn);
    return updated;
  }

  static deleteUser(id: string): User[] {
    const list = this.getUsers();
    const updated = list.filter(u => u.id !== id && u.staffId !== id);
    setStorage(STORAGE_KEYS.USERS, updated);
    this.notifyChange();
    return updated;
  }

  static createStaffLogin(staff: Staff, customPassword?: string): { user: User; password: string; phone: string } {
    const users = this.getUsers();
    const existing = users.find(
      u => u.staffId === staff.id || (staff.phone && u.phone === staff.phone) || (staff.email && u.email.toLowerCase() === staff.email.toLowerCase())
    );

    const firstName = staff.name.trim().split(/\s+/)[0].replace(/[^a-zA-Z]/g, '') || 'Staff';
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

    // Unique password: includes their name + '@' + random 4-digit number (e.g. Pooja@4829)
    const generatedPassword = `${capitalizedName}@${Math.floor(1000 + Math.random() * 9000)}`;
    const password = customPassword || existing?.password || generatedPassword;

    // Staff member logs in from their mobile number
    const cleanPhone = (staff.phone || '').replace(/[^0-9]/g, '');

    // Map staff role to system UserRole
    let role: UserRole = 'teacher';
    if (staff.role === 'Computer Operator' || staff.role === 'Office Staff') {
      role = 'operator';
    } else if (staff.role === 'Accountant') {
      role = 'accountant';
    } else if (staff.role === 'Teacher') {
      role = 'teacher';
    }

    const newUser: User = {
      id: existing?.id || `user-staff-${Date.now()}`,
      schoolId: 'bvm-nagdi-01',
      name: staff.name,
      email: staff.email && staff.email.trim() ? staff.email.trim().toLowerCase() : `${cleanPhone || 'staff'}@bvmnagdi.internal`,
      phone: staff.phone,
      username: cleanPhone, // Staff logs in using their 10-digit mobile number
      password,
      role,
      staffId: staff.id,
      assignedClass: staff.assignedClass || '',
      assignedSection: staff.assignedSection || 'A',
      assignedClasses: staff.assignedClass ? [staff.assignedClass] : []
    };

    this.saveUser(newUser);
    return { user: newUser, password, phone: staff.phone };
  }

  // Alias for backward compatibility
  static createTeacherLogin(staff: Staff, customPassword?: string): { user: User; password: string; phone: string } {
    return this.createStaffLogin(staff, customPassword);
  }

  static getStaffCredentials(staffId: string): { phone: string; username: string; email: string; password: string; role: string; assignedClass?: string } | null {
    const users = this.getUsers();
    const stf = this.getStaff().find(s => s.id === staffId);
    if (!stf) return null;

    let u = users.find(
      user => user.staffId === staffId || (stf.phone && user.phone === stf.phone) || (stf.email && user.email.toLowerCase() === stf.email.toLowerCase())
    );

    if (u) {
      let needsSave = false;
      const firstName = stf.name.trim().split(/\s+/)[0].replace(/[^a-zA-Z]/g, '') || 'Staff';
      const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

      // Ensure phone is saved
      if (!u.phone && stf.phone) {
        u.phone = stf.phone;
        needsSave = true;
      }

      // Ensure teacher has a unique password containing their name + '@' + random 4-digit number
      let password = u.password;
      if (!password || !password.includes('@')) {
        password = `${capitalizedName}@${Math.floor(1000 + Math.random() * 9000)}`;
        needsSave = true;
      }

      // Ensure assigned class is synced
      if (stf.assignedClass && u.assignedClass !== stf.assignedClass) {
        u.assignedClass = stf.assignedClass;
        u.assignedClasses = [stf.assignedClass];
        needsSave = true;
      }

      if (needsSave) {
        u = { ...u, password };
        this.saveUser(u);
      }

      return {
        phone: u.phone || stf.phone,
        username: u.username || (stf.phone || '').replace(/[^0-9]/g, ''),
        email: u.email,
        password: u.password || password,
        role: u.role,
        assignedClass: u.assignedClass || stf.assignedClass
      };
    }

    // If not found yet, create on demand
    const created = this.createStaffLogin(stf);
    return {
      phone: created.phone,
      username: created.user.username || (created.phone || '').replace(/[^0-9]/g, ''),
      email: created.user.email,
      password: created.password,
      role: created.user.role,
      assignedClass: created.user.assignedClass
    };
  }

  // Attendance Audit Logs
  static getAttendanceLogs(): AttendanceAuditLog[] {
    return getStorage<AttendanceAuditLog[]>(STORAGE_KEYS.ATTENDANCE_LOGS, []);
  }

  static addAttendanceLog(log: AttendanceAuditLog): AttendanceAuditLog[] {
    const logs = this.getAttendanceLogs();
    const updated = [log, ...logs].slice(0, 500); // keep recent 500 logs
    setStorage(STORAGE_KEYS.ATTENDANCE_LOGS, updated);
    this.notifyChange();
    SupabaseService.saveAttendanceLog(log).catch(console.warn);
    return updated;
  }

  // Auth / Current User
  static getActiveUser(): User | null {
    return getStorage<User | null>(STORAGE_KEYS.USER, null);
  }

  static setActiveUser(user: User | null): void {
    setStorage(STORAGE_KEYS.USER, user);
  }

  static getCurrentUser(): User | null {
    return getStorage<User | null>(STORAGE_KEYS.USER, null);
  }

  static setCurrentUser(user: User | null): void {
    setStorage(STORAGE_KEYS.USER, user);
  }

  static getDemoUsers(): User[] {
    return this.getUsers();
  }

  // Teacher Class Assignment Helpers
  static getTeacherAssignedClasses(teacherName: string): ClassSection[] {
    const classes = this.getClasses();
    return classes.filter(c => c.classTeacher?.toLowerCase() === teacherName.toLowerCase());
  }

  static assignTeacherToClass(classId: string, teacherName: string): ClassSection[] {
    const list = this.getClasses();
    const updated = list.map(c => {
      if (c.id === classId) {
        return { ...c, classTeacher: teacherName };
      }
      return c;
    });
    setStorage(STORAGE_KEYS.CLASSES, updated);
    return updated;
  }

  // Classes & Sections
  static getClasses(): ClassSection[] {
    let classes = getStorage<ClassSection[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    // Ensure Pre-Primary classes (Nursery, LKG, UKG) are always present
    const prePrimary: ClassSection[] = [
      { id: 'cls-nursery', schoolId: 'bvm-nagdi-01', name: 'Nursery', sections: ['A', 'B'], roomNumber: 'Room Pre-1', capacity: 35 },
      { id: 'cls-lkg', schoolId: 'bvm-nagdi-01', name: 'LKG', sections: ['A', 'B'], roomNumber: 'Room Pre-2', capacity: 35 },
      { id: 'cls-ukg', schoolId: 'bvm-nagdi-01', name: 'UKG', sections: ['A', 'B'], roomNumber: 'Room Pre-3', capacity: 35 }
    ];
    let hasChanged = false;
    for (let i = prePrimary.length - 1; i >= 0; i--) {
      const p = prePrimary[i];
      if (!classes.some(c => c.name.toLowerCase() === p.name.toLowerCase())) {
        classes = [p, ...classes];
        hasChanged = true;
      }
    }
    if (hasChanged) {
      setStorage(STORAGE_KEYS.CLASSES, classes);
    }
    return classes;
  }

  static saveClass(item: ClassSection): ClassSection[] {
    const list = this.getClasses();
    const idx = list.findIndex(c => c.id === item.id);
    let updated: ClassSection[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = item;
    } else {
      updated = [item, ...list];
    }
    setStorage(STORAGE_KEYS.CLASSES, updated);
    return updated;
  }

  static deleteClass(id: string): ClassSection[] {
    const updated = this.getClasses().filter(c => c.id !== id);
    setStorage(STORAGE_KEYS.CLASSES, updated);
    return updated;
  }

  // Students
  static getStudents(): Student[] {
    const students = getStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const sheets = this.getStudentAttendanceSheets();

    // Dynamically calculate actual attendance percentage from recorded register sheets
    return students.map(s => {
      let presentDays = 0;
      let totalRecordedDays = 0;

      sheets.forEach(sheet => {
        if (sheet.entries && sheet.entries[s.id]) {
          totalRecordedDays++;
          if (sheet.entries[s.id] === 'present') {
            presentDays++;
          }
        }
      });

      let realPct: number | undefined;
      if (totalRecordedDays > 0) {
        realPct = Math.round((presentDays / totalRecordedDays) * 100);
      } else if (s.attendancePercentage !== undefined && s.attendancePercentage !== 95 && s.attendancePercentage !== 94) {
        realPct = s.attendancePercentage;
      } else {
        realPct = undefined; // No fake 95%
      }

      return {
        ...s,
        attendancePercentage: realPct
      };
    });
  }

  static getStudentById(id: string): Student | undefined {
    return this.getStudents().find(s => s.id === id);
  }

  // Generate guaranteed unique Admission / Student ID (e.g. BVM-2026-001)
  static getNextAdmissionNumber(): string {
    const students = this.getStudents();
    const prefix = 'BVM-2026-';
    let highest = 0;
    students.forEach(s => {
      if (s.admissionNo) {
        const match = s.admissionNo.match(/BVM-2026-(\d+)/i);
        if (match && match[1]) {
          const val = parseInt(match[1], 10);
          if (val > highest) highest = val;
        }
      }
    });
    const nextNum = highest + 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  }

  static isAdmissionNoTaken(admissionNo: string, excludeStudentId?: string): boolean {
    const students = this.getStudents();
    const query = admissionNo.trim().toLowerCase();
    return students.some(
      s => s.admissionNo.trim().toLowerCase() === query && s.id !== excludeStudentId
    );
  }

  static saveStudent(student: Student): Student[] {
    const list = this.getStudents();
    const idx = list.findIndex(s => s.id === student.id);
    let updated: Student[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = student;
    } else {
      updated = [student, ...list];
    }
    setStorage(STORAGE_KEYS.STUDENTS, updated);
    this.notifyChange();
    // Asynchronously sync to Supabase database
    SupabaseService.saveStudent(student).catch(console.warn);
    return updated;
  }

  /**
   * Bulk save student records (used by CSV Bulk Importer)
   */
  static saveStudents(newStudents: Student[]): Student[] {
    const list = this.getStudents();
    const map = new Map<string, Student>();
    list.forEach(s => map.set(s.id, s));
    newStudents.forEach(s => map.set(s.id, s));
    const updated = Array.from(map.values());
    setStorage(STORAGE_KEYS.STUDENTS, updated);
    this.notifyChange();
    newStudents.forEach(s => SupabaseService.saveStudent(s).catch(console.warn));
    return updated;
  }

  /**
   * Update previous year pending fee for a student (Director & Computer Operator)
   */
  static updateStudentPreviousYearPendingFee(studentId: string, amount: number): Student[] {
    const list = this.getStudents();
    const idx = list.findIndex(s => s.id === studentId);
    if (idx < 0) return list;

    const updatedStudent: Student = {
      ...list[idx],
      previousYearPendingFee: Math.max(0, Math.round(amount))
    };

    list[idx] = updatedStudent;
    setStorage(STORAGE_KEYS.STUDENTS, list);
    this.notifyChange();
    SupabaseService.saveStudent(updatedStudent).catch(console.warn);
    return list;
  }

  static deleteStudent(id: string): Student[] {
    const list = this.getStudents();
    const updated = list.filter(s => s.id !== id);
    setStorage(STORAGE_KEYS.STUDENTS, updated);
    this.notifyChange();
    SupabaseService.deleteStudent(id).catch(console.warn);
    return updated;
  }

  static toggleStudentStatus(id: string): Student[] {
    const list = this.getStudents();
    let targetStudent: Student | undefined;
    const updated = list.map(s => {
      if (s.id === id) {
        targetStudent = { ...s, status: s.status === 'active' ? ('inactive' as const) : ('active' as const) };
        return targetStudent;
      }
      return s;
    });
    setStorage(STORAGE_KEYS.STUDENTS, updated);
    this.notifyChange();
    if (targetStudent) {
      SupabaseService.saveStudent(targetStudent).catch(console.warn);
    }
    return updated;
  }

  // Staff
  static getStaff(): Staff[] {
    return getStorage<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
  }

  static saveStaff(staff: Staff): Staff[] {
    // If this staff member was previously removed, re-adding them restores and re-authorizes login access
    this.unrevokeStaffCredentials(staff);

    const list = this.getStaff();
    const idx = list.findIndex(s => s.id === staff.id);
    let updated: Staff[];
    const isNew = idx < 0;
    if (!isNew) {
      updated = [...list];
      updated[idx] = staff;
    } else {
      updated = [staff, ...list];
    }
    setStorage(STORAGE_KEYS.STAFF, updated);

    // Automatically ensure portal login credentials exist for the staff member
    this.createStaffLogin(staff);

    this.notifyChange();
    SupabaseService.saveStaff(staff).catch(console.warn);
    return updated;
  }

  static toggleStaffStatus(id: string): Staff[] {
    const list = this.getStaff();
    let targetStaff: Staff | undefined;
    const updated = list.map(s => {
      if (s.id === id) {
        targetStaff = { ...s, status: s.status === 'active' ? ('inactive' as const) : ('active' as const) };
        return targetStaff;
      }
      return s;
    });
    setStorage(STORAGE_KEYS.STAFF, updated);
    this.notifyChange();
    if (targetStaff) {
      if (targetStaff.status === 'active') {
        this.unrevokeStaffCredentials(targetStaff);
      }
      SupabaseService.saveStaff(targetStaff).catch(console.warn);
    }
    return updated;
  }

  static getRevokedCredentials(): string[] {
    return getStorage<string[]>('bvm_revoked_credentials', []);
  }

  /**
   * Clear any revocation for a re-added staff member so their login access is fully restored
   */
  static unrevokeStaffCredentials(staff: Staff): void {
    const revoked = this.getRevokedCredentials();
    const cleanPhone = (staff.phone || '').replace(/[^0-9]/g, '');
    const staffId = staff.id;
    const email = staff.email?.toLowerCase().trim();

    const filtered = revoked.filter(r => {
      const rDigits = r.replace(/[^0-9]/g, '');
      const rLower = r.toLowerCase().trim();
      if (staffId && (r === staffId || rLower === staffId.toLowerCase())) return false;
      if (cleanPhone && cleanPhone.length >= 8 && (rDigits === cleanPhone || rDigits.includes(cleanPhone) || cleanPhone.includes(rDigits))) return false;
      if (email && rLower === email) return false;
      return true;
    });

    setStorage('bvm_revoked_credentials', filtered);
  }

  static isCredentialRevoked(identifier: string): boolean {
    const revoked = this.getRevokedCredentials();
    const clean = identifier.trim().toLowerCase();
    const digits = identifier.replace(/[^0-9]/g, '');
    return revoked.some(r => {
      const rLower = r.toLowerCase();
      const rDigits = r.replace(/[^0-9]/g, '');
      return (
        rLower === clean ||
        (digits.length >= 8 && rDigits === digits) ||
        (rDigits.length >= 8 && digits.length >= 8 && (rDigits.includes(digits) || digits.includes(rDigits)))
      );
    });
  }

  static deleteStaff(id: string): Staff[] {
    const list = this.getStaff();
    const removedMember = list.find(s => s.id === id);
    const updated = list.filter(s => s.id !== id);
    setStorage(STORAGE_KEYS.STAFF, updated);

    // If this staff member had a login account, clean it up permanently
    if (removedMember) {
      const cleanPhone = (removedMember.phone || '').replace(/[^0-9]/g, '');
      const users = this.getUsers().filter(u => {
        if (u.role === 'director' || u.role === 'admin') return true;
        if (u.staffId === removedMember.id || u.id === removedMember.id) return false;
        if (cleanPhone && (u.phone?.replace(/[^0-9]/g, '') === cleanPhone || u.username === cleanPhone)) return false;
        if (removedMember.email && u.email.toLowerCase() === removedMember.email.toLowerCase()) return false;
        return true;
      });
      setStorage(STORAGE_KEYS.USERS, users);

      // Track revoked identifiers to ensure this removed staff member can NEVER log back in
      const currentRevoked = this.getRevokedCredentials();
      const toRevoke = [
        removedMember.id,
        cleanPhone,
        removedMember.phone,
        removedMember.email
      ].filter(Boolean) as string[];
      setStorage('bvm_revoked_credentials', Array.from(new Set([...currentRevoked, ...toRevoke])));

      // If this teacher was assigned to any class, clear the assignment
      const classes = this.getClasses();
      const updatedClasses = classes.map(c => {
        if (c.classTeacher?.toLowerCase() === removedMember.name.toLowerCase()) {
          return { ...c, classTeacher: undefined };
        }
        return c;
      });
      setStorage(STORAGE_KEYS.CLASSES, updatedClasses);

      // Call Supabase to permanently remove from staff and users table
      SupabaseService.deleteStaff(removedMember.id, removedMember.phone, removedMember.email).catch(console.warn);
    }

    this.notifyChange();
    return updated;
  }

  // Student Attendance
  static getStudentAttendanceSheets(): StudentAttendanceSheet[] {
    return getStorage<StudentAttendanceSheet[]>(STORAGE_KEYS.STUDENT_ATTENDANCE, INITIAL_STUDENT_ATTENDANCE);
  }

  static getStudentAttendance(date: string, className: string, section: string): StudentAttendanceSheet | undefined {
    const sheets = this.getStudentAttendanceSheets();
    return sheets.find(s => s.date === date && s.class === className && s.section === section);
  }

  static recordStudentAttendance(
    date: string,
    className: string,
    section: string,
    entries: Record<string, StudentAttendanceStatus>,
    markedBy: string
  ): StudentAttendanceSheet[] {
    const sheets = this.getStudentAttendanceSheets();
    const existingIdx = sheets.findIndex(s => s.date === date && s.class === className && s.section === section);
    const newSheet: StudentAttendanceSheet = {
      id: existingIdx >= 0 ? sheets[existingIdx].id : `att-${Date.now()}`,
      schoolId: 'bvm-nagdi-01',
      date,
      class: className,
      section,
      markedBy,
      timestamp: new Date().toISOString(),
      entries
    };

    let updated: StudentAttendanceSheet[];
    if (existingIdx >= 0) {
      updated = [...sheets];
      updated[existingIdx] = newSheet;
    } else {
      updated = [newSheet, ...sheets];
    }
    setStorage(STORAGE_KEYS.STUDENT_ATTENDANCE, updated);

    // Dynamically update individual students' attendance percentage across all recorded sheets
    const students = this.getStudents();
    const updatedStudents = students.map(s => {
      let pres = 0;
      let total = 0;
      updated.forEach(sheet => {
        if (sheet.entries && sheet.entries[s.id]) {
          total++;
          if (sheet.entries[s.id] === 'present') pres++;
        }
      });
      if (total > 0) {
        return { ...s, attendancePercentage: Math.round((pres / total) * 100) };
      }
      return s;
    });
    setStorage(STORAGE_KEYS.STUDENTS, updatedStudents);

    this.notifyChange();
    SupabaseService.saveStudentAttendance(newSheet).catch(console.warn);
    return updated;
  }

  // Staff Attendance
  static getStaffAttendanceSheets(): StaffDailyAttendance[] {
    return getStorage<StaffDailyAttendance[]>(STORAGE_KEYS.STAFF_ATTENDANCE, INITIAL_STAFF_ATTENDANCE);
  }

  static getStaffAttendance(date: string): StaffDailyAttendance | undefined {
    const sheets = this.getStaffAttendanceSheets();
    return sheets.find(s => s.date === date);
  }

  static recordStaffAttendance(
    date: string,
    records: Record<string, { status: StaffAttendanceStatus; notes?: string }>,
    markedBy: string
  ): StaffDailyAttendance[] {
    const sheets = this.getStaffAttendanceSheets();
    const idx = sheets.findIndex(s => s.date === date);
    const sheet: StaffDailyAttendance = {
      id: idx >= 0 ? sheets[idx].id : `stf-att-${Date.now()}`,
      schoolId: 'bvm-nagdi-01',
      date,
      records,
      markedBy
    };

    let updated: StaffDailyAttendance[];
    if (idx >= 0) {
      updated = [...sheets];
      updated[idx] = sheet;
    } else {
      updated = [sheet, ...sheets];
    }
    setStorage(STORAGE_KEYS.STAFF_ATTENDANCE, updated);
    this.notifyChange();
    return updated;
  }

  // Fees
  static getFeeStructures(): FeeStructure[] {
    let list = getStorage<FeeStructure[]>(STORAGE_KEYS.FEE_STRUCTURES, INITIAL_FEE_STRUCTURES);
    // Ensure Pre-Primary classes (Nursery, LKG, UKG) fee structures exist
    const prePrimary: FeeStructure[] = [
      { id: 'fee-nursery', schoolId: 'bvm-nagdi-01', class: 'Nursery', tuitionFee: 8500, activityFee: 1500, transportFee: 0, examFee: 1000, term: 'Annual' },
      { id: 'fee-lkg', schoolId: 'bvm-nagdi-01', class: 'LKG', tuitionFee: 9500, activityFee: 1500, transportFee: 0, examFee: 1000, term: 'Annual' },
      { id: 'fee-ukg', schoolId: 'bvm-nagdi-01', class: 'UKG', tuitionFee: 10500, activityFee: 1500, transportFee: 0, examFee: 1000, term: 'Annual' }
    ];
    let changed = false;
    for (let i = prePrimary.length - 1; i >= 0; i--) {
      const p = prePrimary[i];
      if (!list.some(f => f.class.toLowerCase() === p.class.toLowerCase())) {
        list = [p, ...list];
        changed = true;
      }
    }
    // Enforce Annual fee term
    list = list.map(f => (f.term !== 'Annual' ? { ...f, term: 'Annual' as const } : f));
    if (changed) {
      setStorage(STORAGE_KEYS.FEE_STRUCTURES, list);
    }
    return list;
  }

  static saveFeeStructure(item: FeeStructure): FeeStructure[] {
    const list = this.getFeeStructures();
    const idx = list.findIndex(f => f.id === item.id || f.class === item.class);
    let updated: FeeStructure[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = { ...list[idx], ...item };
    } else {
      updated = [...list, item];
    }
    setStorage(STORAGE_KEYS.FEE_STRUCTURES, updated);
    this.notifyChange();
    return updated;
  }

  static getPayments(): PaymentReceipt[] {
    return getStorage<PaymentReceipt[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  }

  static recordPayment(payment: Omit<PaymentReceipt, 'id' | 'receiptNo'>): PaymentReceipt {
    const payments = this.getPayments();
    const receiptNo = `BVM-REC-2026-${String(payments.length + 1).padStart(3, '0')}`;
    const studentFeeCalc = this.getStudentFeeCalculation(payment.studentId);
    const calculatedPending = Math.max(0, studentFeeCalc.pendingAmount - payment.amount);

    const newReceipt: PaymentReceipt = {
      ...payment,
      id: `pay-${Date.now()}`,
      receiptNo,
      totalFee: payment.totalFee ?? studentFeeCalc.totalFee,
      pendingAmount: payment.pendingAmount !== undefined ? payment.pendingAmount : calculatedPending
    };

    const updated = [newReceipt, ...payments];
    setStorage(STORAGE_KEYS.PAYMENTS, updated);
    this.notifyChange();
    SupabaseService.saveFeePayment(newReceipt).catch(console.warn);
    return newReceipt;
  }

  // Dynamic Dashboard Overview Metrics (Connected to all modules)
  static getDashboardMetrics(): {
    studentRateFormatted: string;
    studentSummaryText: string;
    studentPresentCount: number;
    studentTotalCount: number;
    staffRateFormatted: string;
    staffSummaryText: string;
    staffPresentCount: number;
    staffTotalCount: number;
    totalCollectedFees: number;
    totalPendingFees: number;
    activeStudentsCount: number;
    activeStaffCount: number;
    currentMonthPayroll: number;
  } {
    const today = new Date().toISOString().split('T')[0];
    const studentSheets = this.getStudentAttendanceSheets();
    const students = this.getStudents();
    const activeStudents = students.filter(s => s.status === 'active');
    const activeStudentsCount = activeStudents.length;

    // Check today's sheets first, otherwise use the most recent sheet date
    const todaySheets = studentSheets.filter(s => s.date === today);
    let targetSheets = todaySheets;
    let isToday = true;

    if (todaySheets.length === 0 && studentSheets.length > 0) {
      isToday = false;
      // Get the most recent date available in sheets
      const dates = Array.from(new Set(studentSheets.map(s => s.date))).sort().reverse();
      const mostRecentDate = dates[0];
      targetSheets = studentSheets.filter(s => s.date === mostRecentDate);
    }

    let studentPres = 0;
    let studentMarked = 0;

    targetSheets.forEach(sheet => {
      Object.values(sheet.entries || {}).forEach(status => {
        studentMarked++;
        if (status === 'present') studentPres++;
      });
    });

    let studentRateFormatted = '0%';
    let studentSummaryText = '0 students enrolled';
    if (activeStudentsCount === 0) {
      studentRateFormatted = '0%';
      studentSummaryText = '0 students enrolled';
    } else if (studentMarked > 0) {
      const pct = Math.round((studentPres / studentMarked) * 1000) / 10;
      studentRateFormatted = `${pct}%`;
      studentSummaryText = `${studentPres} of ${studentMarked} present ${isToday ? 'today' : '(latest register)'}`;
    } else {
      studentRateFormatted = 'Pending';
      studentSummaryText = `0 of ${activeStudentsCount} marked today • Attendance pending`;
    }

    // Staff Attendance
    const staffList = this.getStaff().filter(s => s.status === 'active');
    const activeStaffCount = staffList.length;
    const staffSheets = this.getStaffAttendanceSheets();
    const staffToday = staffSheets.find(s => s.date === today);

    let staffPres = 0;
    let staffLate = 0;
    let staffLeave = 0;
    let staffMarked = 0;

    if (staffToday && staffToday.records) {
      Object.values(staffToday.records).forEach(rec => {
        staffMarked++;
        if (rec.status === 'present') staffPres++;
        else if (rec.status === 'late') staffLate++;
        else if (rec.status === 'leave') staffLeave++;
      });
    }

    let staffRateFormatted = '0%';
    let staffSummaryText = '0 staff enrolled';
    if (activeStaffCount === 0) {
      staffRateFormatted = '0%';
      staffSummaryText = '0 staff members enrolled';
    } else if (staffMarked > 0) {
      const attending = staffPres + staffLate;
      const pct = Math.round((attending / staffMarked) * 1000) / 10;
      staffRateFormatted = `${pct}%`;
      staffSummaryText = `${staffPres} present • ${staffLeave} on leave • ${staffLate} late`;
    } else {
      staffRateFormatted = 'Pending';
      staffSummaryText = `0 of ${activeStaffCount} marked today • Muster pending`;
    }

    // Fee calculations
    const payments = this.getPayments();
    const totalCollectedFees = payments.reduce((sum, p) => sum + p.amount, 0);

    let totalPendingFees = 0;
    students.forEach(st => {
      const calc = this.getStudentFeeCalculation(st.id);
      totalPendingFees += calc.pendingAmount;
    });

    // Payroll calculation
    const payroll = this.getPayroll();
    let currentMonthPayroll = staffList.reduce((sum, stf) => sum + (stf.monthlySalary || 0), 0);
    if (payroll && payroll.length > 0) {
      const currentMonthRecords = payroll.filter(p => p.month === '2026-09');
      if (currentMonthRecords.length > 0) {
        currentMonthPayroll = currentMonthRecords.reduce((sum, p) => sum + (p.finalPayable || p.netSalary || 0), 0);
      }
    }

    return {
      studentRateFormatted,
      studentSummaryText,
      studentPresentCount: studentPres,
      studentTotalCount: studentMarked || activeStudentsCount,
      staffRateFormatted,
      staffSummaryText,
      staffPresentCount: staffPres,
      staffTotalCount: staffMarked || activeStaffCount,
      totalCollectedFees,
      totalPendingFees,
      activeStudentsCount,
      activeStaffCount,
      currentMonthPayroll
    };
  }

  // Calculate fee status for a student (Annual Fee + Previous Year Arrears)
  static getStudentFeeCalculation(studentId: string): {
    annualFee: number;
    previousYearPendingFee: number;
    totalFee: number;
    paidAmount: number;
    pendingAmount: number;
    status: FeeStatus;
    payments: PaymentReceipt[];
  } {
    const student = this.getStudentById(studentId);
    if (!student) {
      return {
        annualFee: 0,
        previousYearPendingFee: 0,
        totalFee: 0,
        paidAmount: 0,
        pendingAmount: 0,
        status: 'Paid',
        payments: []
      };
    }

    const feeStructures = this.getFeeStructures();
    const structure = feeStructures.find(
      fs => fs.class.toLowerCase().trim() === student.class.toLowerCase().trim()
    );

    // Annual Base Fee (Tuition + Activity + Transport + Exam)
    const annualFee = structure
      ? structure.tuitionFee + (structure.activityFee || 0) + (structure.transportFee || 0) + (structure.examFee || 0)
      : 15000;

    const previousYearPendingFee = Number(student.previousYearPendingFee) || 0;
    const totalFee = annualFee + previousYearPendingFee;

    const payments = this.getPayments().filter(p => p.studentId === studentId);
    const paidAmount = payments.reduce((acc, p) => acc + p.amount, 0);
    const pendingAmount = Math.max(0, totalFee - paidAmount);

    let status: FeeStatus = 'Pending';
    if (pendingAmount === 0 && paidAmount > 0) {
      status = 'Paid';
    } else if (paidAmount > 0 && pendingAmount > 0) {
      status = 'Partially Paid';
    } else if (pendingAmount > 0) {
      status = 'Pending';
    }

    return {
      annualFee,
      previousYearPendingFee,
      totalFee,
      paidAmount,
      pendingAmount,
      status,
      payments
    };
  }

  // Payroll
  static getPayroll(): PayrollRecord[] {
    return getStorage<PayrollRecord[]>(STORAGE_KEYS.PAYROLL, INITIAL_PAYROLL);
  }

  static getPayrollRecords(): PayrollRecord[] {
    return this.getPayroll();
  }

  static savePayrollRecord(record: PayrollRecord): PayrollRecord[] {
    const list = this.getPayroll();
    const idx = list.findIndex(p => p.id === record.id);
    let updated: PayrollRecord[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = record;
    } else {
      updated = [record, ...list];
    }
    setStorage(STORAGE_KEYS.PAYROLL, updated);
    this.notifyChange();
    SupabaseService.savePayrollRecord(record).catch(console.warn);
    return updated;
  }

  static generateMonthlyPayroll(monthName: string): PayrollRecord[] {
    const list = this.getPayroll();
    const staffMembers = this.getStaff().filter(s => s.status === 'active');
    
    // Check if payroll already exists for this month
    const existingForMonth = list.filter(p => p.month === monthName);
    if (existingForMonth.length > 0) {
      return list;
    }

    const workingDays = 24;
    const newRecords: PayrollRecord[] = staffMembers.map(stf => {
      // Basic calculated days
      const presentDays = 23;
      const leaveDays = 1;
      const absentDays = 0;
      const deductions = 0;
      const finalPayable = stf.monthlySalary - deductions;

      return {
        id: `pr-${Date.now()}-${stf.id}`,
        schoolId: 'bvm-nagdi-01',
        staffId: stf.id,
        staffName: stf.name,
        employeeId: stf.employeeId,
        designation: stf.department,
        month: monthName,
        monthlySalary: stf.monthlySalary,
        workingDays,
        presentDays,
        leaveDays,
        absentDays,
        deductions,
        finalPayable,
        status: 'Generated'
      };
    });

    const updated = [...newRecords, ...list];
    setStorage(STORAGE_KEYS.PAYROLL, updated);
    this.notifyChange();
    newRecords.forEach(r => SupabaseService.savePayrollRecord(r).catch(console.warn));
    return updated;
  }

  static markPayrollAsPaid(recordId: string): PayrollRecord[] {
    const list = this.getPayroll();
    let updatedRecord: PayrollRecord | undefined;
    const updated = list.map(p => {
      if (p.id === recordId) {
        updatedRecord = { ...p, status: 'Paid' as const, paymentDate: new Date().toISOString().split('T')[0] };
        return updatedRecord;
      }
      return p;
    });
    setStorage(STORAGE_KEYS.PAYROLL, updated);
    this.notifyChange();
    if (updatedRecord) {
      SupabaseService.savePayrollRecord(updatedRecord).catch(console.warn);
    }
    return updated;
  }

  // Notices
  static getNotices(): Notice[] {
    return getStorage<Notice[]>(STORAGE_KEYS.NOTICES, INITIAL_NOTICES);
  }

  static saveNotice(notice: Notice): Notice[] {
    const list = this.getNotices();
    const idx = list.findIndex(n => n.id === notice.id);
    let updated: Notice[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = notice;
    } else {
      updated = [notice, ...list];
    }
    setStorage(STORAGE_KEYS.NOTICES, updated);
    return updated;
  }

  static deleteNotice(id: string): Notice[] {
    const updated = this.getNotices().filter(n => n.id !== id);
    setStorage(STORAGE_KEYS.NOTICES, updated);
    return updated;
  }

  // CSV Import for Students
  static importStudents(newStudents: Student[]): { added: number; total: number } {
    const current = this.getStudents();
    // Prevent duplicate admission numbers
    const existingAdmissionNos = new Set(current.map(s => s.admissionNo.toLowerCase().trim()));
    const validToAdd: Student[] = [];

    newStudents.forEach(st => {
      if (!existingAdmissionNos.has(st.admissionNo.toLowerCase().trim())) {
        validToAdd.push(st);
        existingAdmissionNos.add(st.admissionNo.toLowerCase().trim());
      }
    });

    const updated = [...validToAdd, ...current];
    setStorage(STORAGE_KEYS.STUDENTS, updated);
    this.notifyChange();
    validToAdd.forEach(s => SupabaseService.saveStudent(s).catch(console.warn));
    return { added: validToAdd.length, total: updated.length };
  }

  // Refresh all state & sync with Supabase cloud database
  static async refreshData(): Promise<void> {
    await this.syncWithDatabase();
  }

  // Pull latest records from Supabase database to keep frontend in sync
  static async syncWithDatabase(): Promise<boolean> {
    try {
      const data = await SupabaseService.syncAllFromDatabase();
      if (!data) {
        this.notifyChange();
        return false;
      }

      if (Array.isArray(data.students)) {
        setStorage(STORAGE_KEYS.STUDENTS, data.students);
      }
      if (Array.isArray(data.staff)) {
        setStorage(STORAGE_KEYS.STAFF, data.staff);
      }
      if (Array.isArray(data.feePayments)) {
        setStorage(STORAGE_KEYS.PAYMENTS, data.feePayments);
      }
      if (Array.isArray(data.payroll)) {
        setStorage(STORAGE_KEYS.PAYROLL, data.payroll);
      }
      if (Array.isArray(data.studentAttendance)) {
        setStorage(STORAGE_KEYS.STUDENT_ATTENDANCE, data.studentAttendance);
      }

      this.notifyChange();
      return true;
    } catch (e) {
      console.warn('syncWithDatabase error:', e);
      this.notifyChange();
      return false;
    }
  }

  // Clear all data (0 students, 0 staff, Director & Developer only)
  // Completely resets both local browser storage AND live Supabase database tables!
  static async clearAllData(): Promise<{ success: boolean; message?: string }> {
    // 1. Instantly clear local storage
    setStorage(STORAGE_KEYS.STUDENTS, []);
    setStorage(STORAGE_KEYS.STAFF, []);
    setStorage(STORAGE_KEYS.PAYMENTS, []);
    setStorage(STORAGE_KEYS.PAYROLL, []);
    setStorage(STORAGE_KEYS.STUDENT_ATTENDANCE, []);
    setStorage(STORAGE_KEYS.STAFF_ATTENDANCE, []);
    setStorage(STORAGE_KEYS.USERS, DEMO_USERS);
    setStorage(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    setStorage(STORAGE_KEYS.ATTENDANCE_LOGS, []);
    this.notifyChange();

    // 2. Call backend to purge all records from Supabase tables
    try {
      const result = await SupabaseService.resetDatabase();
      if (!result.success) {
        console.warn('Database reset returned warning/error:', result.error);
      }
      this.notifyChange();
      return { success: result.success, message: result.message };
    } catch (e: any) {
      console.error('Failed to reset Supabase database:', e);
      return { success: false, message: e?.message || 'Database purge error' };
    }
  }
}
