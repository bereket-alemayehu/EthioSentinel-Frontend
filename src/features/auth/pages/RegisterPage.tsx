import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, HeartPulse, Smartphone } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { registerApi, verifyOtpApi, setStoredUser, resendOtpApi } from '@/features/auth/api/auth';
import ReCAPTCHA from 'react-google-recaptcha';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [userId, setUserId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const isOnline = useOnlineStatus();
  const recaptchaRef = React.useRef<ReCAPTCHA>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(
    !navigator.onLine ? 'OFFLINE' : null
  );

  // Sync token when connectivity changes
  useEffect(() => {
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
    setLoading(true);
    try {
      const user = await registerApi({
        username: form.username.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
        recaptchaToken,
      });
      setUserId(user.id);
      setStep('otp');
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
      await resendOtpApi(userId);
      toast.success('A new verification code has been sent');
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
                : `Enter the 6-digit code sent to ${form.email || form.phoneNumber}`
              }
            </p>
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
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                    <Input
                      required
                      className="h-12 pl-11 bg-white/5 border-white/10 text-white rounded-xl"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">Phone Number</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                    <Input
                      type="tel"
                      required
                      placeholder="+251..."
                      className="h-12 pl-11 bg-white/5 border-white/10 text-white rounded-xl"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">{t('emailAddress')} (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                    <Input
                      type="email"
                      className="h-12 pl-11 bg-white/5 border-white/10 text-white rounded-xl"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">{t('password')}</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                    <Input
                      type="password"
                      required
                      minLength={8}
                      className="h-12 pl-11 bg-white/5 border-white/10 text-white rounded-xl"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                </div>

                {isOnline && (
                  <div className="flex justify-center mt-2">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                      onChange={(token) => setRecaptchaToken(token)}
                      onExpired={() => setRecaptchaToken(null)}
                      onErrored={() => setRecaptchaToken('OFFLINE')} // Google unreachable → bypass
                      theme="light"
                    />
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
                      Change Phone Number
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
