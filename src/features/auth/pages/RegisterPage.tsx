import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, MapPin, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { registerApi } from '@/features/auth/api/auth';
import { getRegions } from '@/features/advisory/api';
import type { Region } from '@/features/advisory/types';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    regionName: '',
    districtName: '',
  });

  useEffect(() => {
    let cancel = false;
    void (async () => {
      try {
        const r = await getRegions();
        if (!cancel) setRegions(r);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const selectedRegion = useMemo(
    () => regions.find((r) => r.name === form.regionName),
    [regions, form.regionName],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.regionName) {
      toast.error(t('selectRegion'));
      return;
    }
    setLoading(true);
    try {
      await registerApi({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        region: form.regionName,
        assignedDistrict: form.districtName.trim() || undefined,
      });
      toast.success(t('registerSuccess'));
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('registerFailed'));
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
            <h1 className="text-2xl font-bold text-white mb-2">{t('registerHeading')}</h1>
            <p className="text-white/70 text-sm">{t('registerSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="text-xs font-semibold text-white/50 uppercase ml-1">{t('emailAddress')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                <Input
                  type="email"
                  required
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

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/50 uppercase ml-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {t('supervisoryRegion')}
              </label>
              <select
                required
                value={form.regionName}
                onChange={(e) =>
                  setForm({ ...form, regionName: e.target.value, districtName: '' })
                }
                className="w-full h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-white"
              >
                <option value="">{t('selectRegion')}</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.name} className="bg-slate-900">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedRegion?.districts && selectedRegion.districts.length > 0 ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/50 uppercase ml-1">
                  {t('operationalDistrict')}
                </label>
                <select
                  value={form.districtName}
                  onChange={(e) => setForm({ ...form, districtName: e.target.value })}
                  className="w-full h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-white"
                >
                  <option value="">{t('notAssigned')}</option>
                  {selectedRegion.districts.map((d) => (
                    <option key={d.id} value={d.name} className="bg-slate-900">
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-white text-[#0f6b7c] hover:bg-white/90 font-bold rounded-xl mt-2"
            >
              {loading ? t('authenticating') : (
                <span className="inline-flex items-center gap-2">
                  {t('createAccount')}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

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
