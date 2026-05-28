import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Smartphone, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  forgotPasswordApi,
  resetPasswordApi,
  type OtpChannel,
} from '@/features/auth/api/auth';
import { PasswordVisibilityToggle } from '@/shared/components/ui/PasswordVisibilityToggle';
import { authFieldIconClass, authFieldIconSize } from '@/features/auth/authFieldStyles';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [identifier, setIdentifier] = useState('');
  const [otpChannel, setOtpChannel] = useState<OtpChannel>('email');
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [hint, setHint] = useState('');

  const [form, setForm] = useState({
    otpCode: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = identifier.trim();
    if (!id) {
      toast.error('Enter your email or phone number');
      return;
    }
    if (otpChannel === 'email' && !id.includes('@')) {
      toast.error('Enter a valid email address, or switch to SMS');
      return;
    }

    setLoading(true);
    try {
      const { message, devOtpCode: devCode } = await forgotPasswordApi({
        identifier: id,
        otpChannel,
      });
      setHint(message);
      setDevOtpCode(devCode ?? null);
      setStep('reset');
      if (devCode) {
        toast.warning(message, { duration: 12_000 });
      } else if (message.includes('backend terminal') || message.includes('Brevo')) {
        toast.warning(message, { duration: 12_000 });
      } else {
        toast.success(message);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (form.otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi(identifier.trim(), form.otpCode, form.newPassword);
      toast.success('Password has been successfully reset. You can now log in.');
      navigate('/login');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid reset code or error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: 'url("/assets/images/auth-bg.png")' }}
      />
      <div className="absolute inset-0 z-1 bg-linear-to-br from-primary-500/90 via-primary-600/85 to-accent-500/80 backdrop-blur-[2px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[440px] px-4"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex py-3 px-3 bg-white/20 rounded-2xl mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {step === 'request' ? 'Reset Password' : 'Set New Password'}
            </h1>
            <p className="text-white/70 text-sm">
              {step === 'request'
                ? 'Choose email or SMS, then enter the contact on your account.'
                : hint || 'Enter the 6-digit code and choose a new password.'}
            </p>
            {step === 'reset' && devOtpCode ? (
              <p className="mt-3 rounded-xl border border-amber-400/40 bg-amber-500/20 px-3 py-2 text-sm font-mono font-bold tracking-widest text-amber-100">
                Dev code: {devOtpCode}
              </p>
            ) : null}
          </div>

          <AnimatePresence mode="wait">
            {step === 'request' ? (
              <motion.form
                key="request-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRequestReset}
                className="space-y-4"
              >
                <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setOtpChannel('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                      otpChannel === 'email'
                        ? 'bg-white text-[#0f6b7c]'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpChannel('sms')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                      otpChannel === 'sms'
                        ? 'bg-white text-[#0f6b7c]'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    SMS
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">
                    {otpChannel === 'email' ? 'Email address' : 'Phone number'}
                  </label>
                  <div className="relative group">
                    {otpChannel === 'email' ? (
                      <Mail className={`${authFieldIconClass} ${authFieldIconSize}`} />
                    ) : (
                      <Smartphone className={`${authFieldIconClass} ${authFieldIconSize}`} />
                    )}
                    <Input
                      type={otpChannel === 'email' ? 'email' : 'tel'}
                      required
                      placeholder={otpChannel === 'email' ? 'you@example.com' : '+251...'}
                      className="h-12 pl-11 bg-white/5 border-white/10 text-white rounded-xl"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-white text-[#0f6b7c] hover:bg-white/90 font-bold rounded-xl mt-2"
                >
                  {loading ? 'Sending...' : (
                    <span className="inline-flex items-center gap-2">
                      Send Reset Code
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="reset-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleResetPassword}
                className="space-y-4"
              >
                <div className="space-y-2 text-center mb-6">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                    Verification Code
                  </label>
                  <div className="flex justify-center">
                    <Input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="000000"
                      className="h-16 text-center text-3xl tracking-[0.5em] font-bold bg-white/5 border-white/20 text-white rounded-2xl w-full max-w-[240px]"
                      value={form.otpCode}
                      onChange={(e) =>
                        setForm({ ...form, otpCode: e.target.value.replace(/\D/g, '') })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">New Password</label>
                  <div className="relative group">
                    <Lock className={`${authFieldIconClass} ${authFieldIconSize}`} />
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      className="h-12 pl-11 pr-12 bg-white/5 border-white/10 text-white rounded-xl"
                      value={form.newPassword}
                      onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    />
                    <PasswordVisibilityToggle
                      visible={showNewPassword}
                      onToggle={() => setShowNewPassword(!showNewPassword)}
                      className="right-4"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">Confirm New Password</label>
                  <div className="relative group">
                    <Lock className={`${authFieldIconClass} ${authFieldIconSize}`} />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      className="h-12 pl-11 pr-12 bg-white/5 border-white/10 text-white rounded-xl"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    />
                    <PasswordVisibilityToggle
                      visible={showConfirmPassword}
                      onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="right-4"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    disabled={loading || form.otpCode.length !== 6}
                    className="w-full h-12 bg-white text-[#0f6b7c] hover:bg-white/90 font-bold rounded-xl shadow-xl shadow-black/10"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="w-full text-xs text-white/50 hover:text-white transition-colors py-2 font-medium"
                  >
                    Wrong contact? Go back
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-6 border-t border-white/10 text-center relative z-10 flex justify-center">
            <Link
              to="/login"
              className="text-sm text-white/50 font-bold hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
