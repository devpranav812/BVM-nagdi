import { User, Student, Staff, StudentAttendanceSheet, PaymentReceipt, PayrollRecord, AttendanceAuditLog } from '../types';

/**
 * Backend Service for secure school data persistence.
 * All database operations and API credentials are kept strictly on the server backend (/api/*).
 * Zero database URLs or API keys are exposed to the client browser.
 */
export class SupabaseService {
  private static isConnected: boolean | null = null;

  /**
   * Tests connection to the backend server and database
   */
  static async checkConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        this.isConnected = false;
        return { connected: false, message: 'Server health check returned non-200 status' };
      }
      const data = await res.json();
      this.isConnected = Boolean(data.databaseConnected);
      return {
        connected: this.isConnected,
        message: this.isConnected
          ? 'Successfully connected to school database via secure backend.'
          : 'Backend operational, database initializing...'
      };
    } catch (err: any) {
      this.isConnected = false;
      return { connected: false, message: err?.message || 'Server connection failed' };
    }
  }

  /**
   * Authenticate user securely through the backend server
   * - Director logs in using Gmail: bvmnagdi@gmail.com
   * - Developer logs in using email/username: p4pranav9610@gmail.com / Pranav@812
   * - Staff / Teachers / Computer Operators log in using registered 10-digit mobile number
   */
  static async login(identifier: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      if (!res.ok) {
        const errText = await res.text();
        try {
          const parsed = JSON.parse(errText);
          return { success: false, error: parsed.error || 'Login failed' };
        } catch {
          return { success: false, error: 'Login server error' };
        }
      }

      const data = await res.json();
      return data;
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error while contacting server' };
    }
  }

  /**
   * Log out session
   */
  static async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Non-fatal
    }
  }

  /**
   * Save user account via secure backend
   */
  static async saveUser(user: User): Promise<void> {
    try {
      await fetch('/api/users/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user })
      });
    } catch (e) {
      console.warn('Backend saveUser warning:', e);
    }
  }

  /**
   * Auto-migrates plaintext passwords on backend
   */
  static async autoMigratePlaintextPasswords(): Promise<void> {
    // Automatically handled server-side
  }

  /**
   * Save Attendance Audit Log to backend
   */
  static async saveAttendanceLog(log: AttendanceAuditLog): Promise<void> {
    try {
      await fetch('/api/attendance/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log })
      });
    } catch (e) {
      console.warn('Backend saveAttendanceLog warning:', e);
    }
  }

  /**
   * Get Attendance Audit Logs from backend
   */
  static async getAttendanceLogs(): Promise<AttendanceAuditLog[]> {
    try {
      const res = await fetch('/api/attendance/logs');
      if (!res.ok) return [];
      const data = await res.json();
      return data.logs || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Upsert student to backend
   */
  static async saveStudent(student: Student): Promise<void> {
    try {
      await fetch('/api/students/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student })
      });
    } catch (e) {
      console.warn('Backend saveStudent warning:', e);
    }
  }

  /**
   * Delete student via backend
   */
  static async deleteStudent(id: string): Promise<void> {
    try {
      await fetch('/api/students/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (e) {
      console.warn('Backend deleteStudent warning:', e);
    }
  }

  /**
   * Upsert staff member to backend
   */
  static async saveStaff(staff: Staff): Promise<void> {
    try {
      await fetch('/api/staff/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff })
      });
    } catch (e) {
      console.warn('Backend saveStaff warning:', e);
    }
  }

  /**
   * Delete staff member and invalidate login credentials via backend
   */
  static async deleteStaff(id: string, phone?: string, email?: string): Promise<void> {
    try {
      await fetch('/api/staff/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, phone, email })
      });
    } catch (e) {
      console.warn('Backend deleteStaff warning:', e);
    }
  }

  /**
   * Save student daily attendance sheet to backend
   */
  static async saveStudentAttendance(sheet: StudentAttendanceSheet): Promise<void> {
    try {
      await fetch('/api/attendance/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet })
      });
    } catch (e) {
      console.warn('Backend saveStudentAttendance warning:', e);
    }
  }

  /**
   * Save fee payment receipt to backend
   */
  static async saveFeePayment(payment: PaymentReceipt): Promise<void> {
    try {
      await fetch('/api/fees/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment })
      });
    } catch (e) {
      console.warn('Backend saveFeePayment warning:', e);
    }
  }

  /**
   * Save payroll record to backend
   */
  static async savePayrollRecord(record: PayrollRecord): Promise<void> {
    try {
      await fetch('/api/payroll/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record })
      });
    } catch (e) {
      console.warn('Backend savePayrollRecord warning:', e);
    }
  }

  /**
   * Fetch all students from backend
   */
  static async fetchStudents(): Promise<Student[] | null> {
    try {
      const res = await fetch('/api/students');
      if (!res.ok) return null;
      const data = await res.json();
      return data.students || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Fetch all staff members from backend
   */
  static async fetchStaff(): Promise<Staff[] | null> {
    try {
      const res = await fetch('/api/staff');
      if (!res.ok) return null;
      const data = await res.json();
      return data.staff || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Fetch all fee payments from backend
   */
  static async fetchFeePayments(): Promise<PaymentReceipt[] | null> {
    try {
      const res = await fetch('/api/fees');
      if (!res.ok) return null;
      const data = await res.json();
      return data.payments || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Fetch all payroll records from backend
   */
  static async fetchPayroll(): Promise<PayrollRecord[] | null> {
    try {
      const res = await fetch('/api/payroll');
      if (!res.ok) return null;
      const data = await res.json();
      return data.records || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Fetch all student attendance sheets from backend
   */
  static async fetchStudentAttendance(): Promise<StudentAttendanceSheet[] | null> {
    try {
      const res = await fetch('/api/attendance/student');
      if (!res.ok) return null;
      const data = await res.json();
      return data.sheets || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Synchronize all data from Supabase backend
   */
  static async syncAllFromDatabase(): Promise<{
    students?: Student[];
    staff?: Staff[];
    feePayments?: PaymentReceipt[];
    payroll?: PayrollRecord[];
    studentAttendance?: StudentAttendanceSheet[];
  } | null> {
    try {
      const res = await fetch('/api/system/sync-all');
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.success) return null;
      return {
        students: data.students,
        staff: data.staff,
        feePayments: data.feePayments,
        payroll: data.payroll,
        studentAttendance: data.studentAttendance
      };
    } catch (e) {
      console.warn('Backend syncAllFromDatabase failed:', e);
      return null;
    }
  }

  /**
   * Wipe all school records in Supabase to clean state (0 students, 0 staff, Director & Developer only)
   */
  static async resetDatabase(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/system/reset-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to reset database on backend' };
      }
      return { success: true, message: data.message };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error while resetting database' };
    }
  }
}
