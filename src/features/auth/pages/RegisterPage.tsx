import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, HeartPulse, Smartphone } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  registerApi,
  verifyOtpApi,
  setStoredUser,
  resendOtpApi,
  type OtpChannel,
} from '@/features/auth/api/auth';
import type ReCAPTCHA from 'react-google-recaptcha';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useRecaptchaSiteKey } from '@/shared/hooks/useRecaptchaSiteKey';
import { AuthRecaptcha } from '@/features/auth/components/AuthRecaptcha';
import { PasswordVisibilityToggle } from '@/shared/components/ui/PasswordVisibilityToggle';
import { authFieldIconClass, authFieldIconSize } from '@/features/auth/authFieldStyles';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [userId, setUserId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [otpHint, setOtpHint] = useState('');
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [otpChannel, setOtpChannel] = useState<OtpChannel>('email');

  const isOnline = useOnlineStatus();
  const recaptchaRef = React.useRef<ReCAPTCHA>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(
    !navigator.onLine ? 'OFFLINE' : null
  );
  const { siteKey: recaptchaSiteKey, loading: recaptchaLoading, ready: recaptchaReady, isConfigured: recaptchaConfigured, isTestKey } =
    useRecaptchaSiteKey();

  const handleRecaptchaToken = React.useCallback((token: string | null) => {
    setRecaptchaToken(token);
  }, []);

  const prevOnlineRef = React.useRef(isOnline);
  useEffect(() => {
    if (prevOnlineRef.current === isOnline) return;
    prevOnlineRef.current = isOnline;
    if (!isOnline) {
      recaptchaRef.current?.reset();
      setRecaptchaToken('OFFLINE');
    } else {
      setRecaptchaToken(null);
    }
  }, [isOnline]);

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);
  
  const [form, setForm] = useState({
    username: '',
    phoneNumber: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recaptchaToken) {
      toast.error('Please verify that you are human');
      return;
    }
    const email = form.email.trim();
    const phone = form.phoneNumber.trim();
    if (otpChannel === 'email' && !email) {
      toast.error('Enter your email address to receive the verification code');
      return;
    }
    if (otpChannel === 'sms' && !phone) {
      toast.error('Enter your phone number to receive the verification code');
      return;
    }
    if (!email && !phone) {
      toast.error('Enter an email or phone number for your account');
      return;
    }
    setLoading(true);
    try {
      const { user, message, otpChannel: channel, devOtpCode: devCode } = await registerApi({
        username: form.username.trim(),
        phoneNumber: phone || undefined,
        email: email || undefined,
        password: form.password,
        recaptchaToken,
        otpChannel,
      });
      setOtpChannel(channel);
      setUserId(user.id);
      setOtpHint(message);
      setDevOtpCode(devCode ?? null);
      setStep('otp');
      if (message.includes('backend terminal') || message.includes('Brevo')) {
        toast.warning(message, { duration: 12_000 });
      } else {
        toast.success(message);
      }
    } catch (err: unknown) {
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    try {
      const user = await verifyOtpApi(userId, otpCode);
      setStoredUser(user);
      // Hard redirect to clear state and trigger role-based routing
      window.location.href = '/citizen';
    } catch (err: unknown) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!userId || resendTimer > 0) return;
    setLoading(true);
    try {
      const { message, devOtpCode: devCode } = await resendOtpApi(userId, otpChannel);
      setOtpHint(message);
      setDevOtpCode(devCode ?? null);
      if (message.includes('backend terminal') || message.includes('Brevo')) {
        toast.warning(message, { duration: 12_000 });
      } else {
        toast.success(message);
      }
      setResendTimer(30);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend code');
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
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{step === 'register' ? t('registerHeading') : 'Verify Account'}</h1>
            <p className="text-white/70 text-sm">
              {step === 'register'
                ? t('registerSubtitle')
                : otpHint || 'Enter the 6-digit verification code.'}
            </p>
            {step === 'otp' && devOtpCode ? (
              <p className="mt-3 rounded-xl border border-amber-400/40 bg-amber-500/20 px-3 py-2 text-sm font-mono font-bold tracking-widest text-amber-100">
                Dev code: {devOtpCode}
              </p>
            ) : null}
          </div>

          <AnimatePresence mode="wait">
            {step === 'register' ? (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit} 
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">{t('username')}</label>
                  <div className="relative group">
                    <User className={`${authFieldIconClass} ${authFieldIconSize}`} />
                    <Input
                      required
                      className="h-12 pl-11 bg-white/5 border-white/10 text-white rounded-xl"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-white/50 uppercase ml-1">
                    Send verification code via
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpChannel('email')}
                      className={`flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-bold transition-colors ${
                        otpChannel === 'email'
                          ? 'bg-white text-[#0f6b7c] border-white'
                          : 'bg-white/5 text-white/80 border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpChannel('sms')}
                      className={`flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-bold transition-colors ${
                        otpChannel === 'sms'
                          ? 'bg-white text-[#0f6b7c] border-white'
                          : 'bg-white/5 text-white/80 border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      SMS
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">
                    {t('emailAddress')}
                    {otpChannel !== 'email' ? ' (Optional)' : ''}
                  </label>
                  <div className="relative group">
                    <Mail className={`${authFieldIconClass} ${authFieldIconSize}`} />
                    <Input
                      type="email"
                      required={otpChannel === 'email'}
                      className="h-12 pl-11 bg-white/5 border-white/10 text-white rounded-xl"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">
                    Phone Number
                    {otpChannel !== 'sms' ? ' (Optional)' : ''}
                  </label>
                  <div className="relative group">
                    <Smartphone className={`${authFieldIconClass} ${authFieldIconSize}`} />
                    <Input
                      type="tel"
                      required={otpChannel === 'sms'}
                      placeholder="+251..."
                      className="h-12 pl-11 bg-white/5 border-white/10 text-white rounded-xl"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">{t('password')}</label>
                  <div className="relative group">
                    <Lock className={`${authFieldIconClass} ${authFieldIconSize}`} />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      className="h-12 pl-11 pr-12 bg-white/5 border-white/10 text-white rounded-xl"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <PasswordVisibilityToggle
                      visible={showPassword}
                      onToggle={() => setShowPassword(!showPassword)}
                      className="right-4"
                    />
                  </div>
                </div>

                {isOnline && (
                  <div className="flex flex-col items-center justify-center mt-2 gap-2">
                    {recaptchaLoading ? (
                      <p className="text-center text-xs text-white/60 px-2">Loading security check…</p>
                    ) : recaptchaReady && recaptchaConfigured ? (
                      <AuthRecaptcha
                        ref={recaptchaRef}
                        siteKey={recaptchaSiteKey}
                        onTokenChange={handleRecaptchaToken}
                      />
                    ) : (
                      <p className="text-center text-xs text-amber-100/95 px-2 max-w-sm">
                        reCAPTCHA is not configured. In <code className="rounded bg-black/20 px-1">ethiosentinel-backend/.env</code> set{' '}
                        <code className="rounded bg-black/20 px-1">RECAPTCHA_SITE_KEY</code> and{' '}
                        <code className="rounded bg-black/20 px-1">SITESECRET</code> from Google reCAPTCHA admin, then restart the backend.
                      </p>
                    )}
                    {isTestKey ? (
                      <p className="text-center text-xs text-amber-200/90 px-2 max-w-sm">
                        Test reCAPTCHA key in use — set real keys on the backend to remove the red testing banner.
                      </p>
                    ) : null}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !recaptchaToken}
                  className="w-full h-12 bg-white text-[#0f6b7c] hover:bg-white/90 font-bold rounded-xl mt-2"
                >
                  {loading ? t('authenticating') : (
                    <span className="inline-flex items-center gap-2">
                      {t('createAccount')}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp}
                className="space-y-6"
              >
                <div className="space-y-2 text-center">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Enter Verification Code</label>
                  <div className="flex justify-center">
                    <Input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="000000"
                      className="h-16 text-center text-3xl tracking-[0.5em] font-bold bg-white/5 border-white/20 text-white rounded-2xl w-full max-w-[240px]"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="w-full h-12 bg-white text-[#0f6b7c] hover:bg-white/90 font-bold rounded-xl shadow-xl shadow-black/10"
                  >
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </Button>
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendTimer > 0 || loading}
                      className="w-full text-sm text-white/80 hover:text-white transition-colors py-1 font-medium disabled:opacity-50"
                    >
                      {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Verification Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('register')}
                      className="w-full text-xs text-white/50 hover:text-white transition-colors py-1 font-medium"
                    >
                      Change registration details
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-sm text-white/60">
            {t('haveAccount')}{' '}
            <Link to="/login" className="text-white font-bold hover:underline">
              {t('signIn')}
            </Link>
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-6">
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <HeartPulse className="w-3.5 h-3.5 text-accent-500" />
            <span className="text-[10px] uppercase tracking-widest text-white/80 font-bold">{t('securePatientData')}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
