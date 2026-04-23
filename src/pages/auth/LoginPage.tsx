import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  Stethoscope,
  HeartPulse
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate('/citizen/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-10000 scale-110 animate-subtle-zoom"
        style={{ backgroundImage: 'url("/assets/images/auth-bg.png")' }}
      />
      <div className="absolute inset-0 z-1 bg-linear-to-br from-primary-500/90 via-primary-600/85 to-accent-500/80 backdrop-blur-[2px]" />

      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[35%] h-[35%] bg-accent-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[440px] px-4"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
          {/* Subtle Inner Glow */}
          <div className="absolute -top-[50%] -right-[50%] w-full h-full bg-white/5 rounded-full blur-3xl transform group-hover:translate-x-[-10%] group-hover:translate-y-[10%] transition-transform duration-1000" />
          
          {/* Header */}
          <div className="text-center mb-8 relative">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="inline-flex py-3 px-3 bg-white/20 rounded-2xl mb-4"
            >
              <ShieldCheck className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">EthioSentinel</h1>
            <p className="text-white/70 text-sm font-medium">Health Monitoring & Response System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5 relative">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/50 uppercase ml-1 tracking-wider">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/80 transition-colors">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <Input 
                    type="email" 
                    placeholder="name@example.com"
                    required
                    className="h-12 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10 focus:border-white/30 transition-all rounded-xl no-focus"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex-between">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1 tracking-wider">Password</label>
                  <Link to="/auth/forgot-password"  className="text-xs font-semibold text-white/60 hover:text-white transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/80 transition-colors">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    required
                    className="h-12 pl-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10 focus:border-white/30 transition-all rounded-xl no-focus"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-start gap-2 ml-1">
              <input 
                type="checkbox" 
                id="remember" 
                className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-accent-500 transition-all cursor-pointer accent-accent-500"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({...formData, rememberMe: e.target.checked})}
              />
              <label htmlFor="remember" className="text-sm font-medium text-white/60 select-none cursor-pointer">
                Keep me signed in
              </label>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 bg-white text-[#0f6b7c] hover:bg-white/90 active:scale-[0.98] transition-all font-bold text-base rounded-xl mt-4 shadow-xl"
            >
              {isLoading ? (
                <div className="flex-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#0f6b7c]/20 border-t-[#0f6b7c] rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex-center gap-2">
                  <span>Sign In</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </div>
              )}
            </Button>
          </form>

          {/* Footer info */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center relative z-10">
            <p className="text-sm text-white/50">
              Don't have an account? {' '}
              <Link to="/auth/register" className="text-white font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Dynamic Badges */}
        <div className="mt-8 flex justify-center gap-6">
          <div className="flex-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <HeartPulse className="w-3.5 h-3.5 text-accent-500" />
            <span className="text-[10px] uppercase tracking-widest text-white/80 font-bold">Secure Patient Data</span>
          </div>
          <div className="flex-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <Stethoscope className="w-3.5 h-3.5 text-accent-500" />
            <span className="text-[10px] uppercase tracking-widest text-white/80 font-bold">Ministry Approved</span>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-12 text-center flex-center gap-4 text-[11px] text-white/30 uppercase tracking-[0.2em]">
           <button className="hover:text-white transition-colors">Privacy Policy</button>
           <div className="w-1 h-1 bg-white/20 rounded-full" />
           <button className="hover:text-white transition-colors">Terms of Service</button>
        </div>
      </motion.div>

      {/* Global CSS for custom animations */}
      <style>{`
        @keyframes subtle-zoom {
          0% { transform: scale(1.1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1.1); }
        }
        .animate-subtle-zoom {
          animation: subtle-zoom 20s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
