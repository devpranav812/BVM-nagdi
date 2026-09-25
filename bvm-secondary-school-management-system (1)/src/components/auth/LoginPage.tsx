import React, { useState, useEffect } from 'react';
import { School, User, Lock, Phone, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { User as UserType } from '../../types';
import { StorageService } from '../../services/storageService';
import { SupabaseService } from '../../services/supabaseService';
import { CryptoService } from '../../services/cryptoService';

interface LoginPageProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const schoolInfo = StorageService.getSchoolInfo();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Auto encrypt and hash any legacy plain text passwords in Supabase users table
    SupabaseService.autoMigratePlaintextPasswords().catch(console.warn);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setError('Please enter your registered mobile number or email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const lower = cleanIdentifier.toLowerCase();
      const isEmail = cleanIdentifier.includes('@');
      const cleanDigits = cleanIdentifier.replace(/[^0-9]/g, '');

      // Immediate check: If this credential was revoked after removal by Director
      if (
        StorageService.isCredentialRevoked(cleanIdentifier) ||
        (cleanDigits.length >= 8 && StorageService.isCredentialRevoked(cleanDigits))
      ) {
        setError('Access Revoked: This staff account has been permanently removed by School Director Ashish Joshi. Login credentials are no longer valid.');
        setIsLoading(false);
        return;
      }

      // Strict Email Rule: Only Director and Developer can use email
      if (isEmail) {
        if (lower !== 'bvmnagdi@gmail.com' && lower !== 'p4pranav9610@gmail.com') {
          setError('Email login is restricted to authorized administrative accounts. All faculty and staff must log in using their registered 10-digit mobile number.');
          setIsLoading(false);
          return;
        }
      }

      // 1. Authenticate via Supabase Auth / Supabase Cloud Database
      const supabaseResult = await SupabaseService.login(cleanIdentifier, password);
      if (supabaseResult.success && supabaseResult.user) {
        // Double check revocation before permitting session
        if (supabaseResult.user.role !== 'director' && supabaseResult.user.role !== 'admin') {
          const activeStaffList = StorageService.getStaff();
          const activeMem = activeStaffList.find(
            s => (supabaseResult.user?.staffId && s.id === supabaseResult.user.staffId) ||
                 (s.phone && s.phone.replace(/[^0-9]/g, '') === cleanDigits)
          );
          if (activeStaffList.length > 0 && !activeMem) {
            setError('Access Denied: This faculty member has been removed by School Director Ashish Joshi. Login access is permanently revoked.');
            setIsLoading(false);
            return;
          }
        }

        StorageService.saveUser(supabaseResult.user);
        onLoginSuccess(supabaseResult.user);
        setIsLoading(false);
        return;
      }

      // If Supabase returned an explicit revocation or suspension error, display it immediately
      if (
        supabaseResult.error &&
        (supabaseResult.error.includes('Access Denied') ||
         supabaseResult.error.includes('Account Suspended') ||
         supabaseResult.error.includes('revoked') ||
         supabaseResult.error.includes('not registered'))
      ) {
        setError(supabaseResult.error);
        setIsLoading(false);
        return;
      }

      // 2. Local Synchronized User Registry Check (matches Director email or Staff phone)
      const currentUsers = StorageService.getUsers();
      const matched = currentUsers.find(u => {
        if (isEmail) {
          return u.email && u.email.toLowerCase() === lower;
        }
        // Match by phone number or username
        const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');
        const uUserDigits = (u.username || '').replace(/[^0-9]/g, '');
        return (
          (cleanDigits.length >= 8 && (uPhoneDigits.includes(cleanDigits) || uUserDigits === cleanDigits)) ||
          (u.username && u.username.toLowerCase() === cleanIdentifier.toLowerCase())
        );
      });

      if (matched) {
        // Enforce: Teacher/staff must exist in active staff list
        if (matched.role !== 'director' && matched.role !== 'admin') {
          const activeStaffList = StorageService.getStaff();
          const activeMem = activeStaffList.find(
            s => (matched.staffId && s.id === matched.staffId) ||
                 (s.phone && (s.phone === cleanIdentifier || s.phone.replace(/[^0-9]/g, '') === cleanDigits))
          );

          if (!activeMem) {
            setError('Access Revoked: This staff member has been removed by School Director Ashish Joshi. Login access is permanently revoked.');
            setIsLoading(false);
            return;
          }

          if (activeMem.status !== 'active') {
            setError('Account Suspended: This faculty account has been deactivated by School Director Ashish Joshi.');
            setIsLoading(false);
            return;
          }
        }

        // If Director, Developer or staff has no password initialized yet, hash and save securely
        if (!matched.password && (matched.role === 'director' || matched.role === 'admin' || matched.username === 'Pranav@812')) {
          matched.password = await CryptoService.hashPassword(password);
          StorageService.saveUser(matched);
        } else if (matched.password) {
          const isValid = await CryptoService.verifyPassword(password, matched.password);
          if (!isValid) {
            setError('Incorrect password. Please verify your credentials or contact the School Director.');
            setIsLoading(false);
            return;
          }
          // If stored password was plain text, upgrade automatically to salted SHA-256 hash
          if (!CryptoService.isHash(matched.password)) {
            matched.password = await CryptoService.hashPassword(password);
            StorageService.saveUser(matched);
          }
        }

        // Sync valid user to Supabase
        SupabaseService.saveUser(matched).catch(console.warn);
        onLoginSuccess(matched);
        setIsLoading(false);
        return;
      }

      if (isEmail) {
        setError('Invalid password for director/developer account.');
      } else {
        setError(`Mobile number "${cleanIdentifier}" is not registered in the school system. Only faculty and staff assigned by the School Director or Developer can log in.`);
      }
    } catch (err: any) {
      setError(err?.message || 'Login verification failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-100 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* School Crest / Branding */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
          <School className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          {schoolInfo.name}
        </h2>
        <p className="mt-1 text-center text-xs font-medium text-slate-600">
          Nagdi, Arnod, Pratapgarh, Rajasthan
        </p>
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Phone className="h-3.5 w-3.5 text-indigo-600" />
          <span>Office Helpdesk: <strong>{schoolInfo.contactNumber}</strong></span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Sign In to School Portal</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Enter your registered mobile number or authorized account credentials.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200 leading-relaxed font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number or Email
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="login-username-input"
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  placeholder="Enter registered mobile number or email"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Teachers and staff log in with their registered 10-digit mobile number.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="ml-2">Remember me</span>
              </label>
              <span className="text-[11px] text-slate-400">Secure Encrypted Session</span>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to School Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-[11px] text-slate-400">
              Accounts and staff provisioning are managed by the School Administration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
