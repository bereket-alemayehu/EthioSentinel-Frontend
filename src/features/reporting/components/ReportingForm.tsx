import React from "react";
import { motion } from "framer-motion";
import { PlusCircle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { SearchableSelect } from "@/shared/components/ui/SearchableSelect";

interface ReportingFormProps {
  t: any;
  form: any;
  setForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  diseaseOptions: any[];
  isOnline: boolean;
  reportMutationPending: boolean;
}

export const ReportingForm: React.FC<ReportingFormProps> = ({
  t,
  form,
  setForm,
  onSubmit,
  diseaseOptions,
  isOnline,
  reportMutationPending
}) => {
  const today = new Date().toLocaleDateString("en-CA");

  return (
    <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="card-wrapper p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/25 dark:border-white/5 shadow-2xl shadow-slate-900/10 relative z-20"
    >
        {/* Background decoration container with localized overflow-hidden */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2rem] sm:rounded-[2.5rem]">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                <PlusCircle className="w-48 h-48" />
            </div>
        </div>

        <div className="relative flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-accent-500 text-white flex items-center justify-center shadow-lg shadow-accent-500/30">
                <PlusCircle className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-3xl font-black text-dark-300 dark:text-white tracking-tighter uppercase">New Field Report</h2>
                <p className="text-xs text-light-500 font-black uppercase tracking-[.2em] mt-1">Surveillance Log Alpha-01</p>
            </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-8 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-light-500 dark:text-light-700 uppercase tracking-widest ml-1">Pathogen/Disease Identification</label>
                    <SearchableSelect 
                        options={diseaseOptions}
                        value={form.diseaseType}
                        onChange={(label, id) => setForm({ ...form, diseaseType: label, diseaseId: id as number })}
                        placeholder="Search or Select Disease..."
                        className="z-40"
                    />
                </div>



                <div className="space-y-3">
                    <label className="text-[10px] font-black text-light-500 dark:text-light-700 uppercase tracking-widest ml-1">Observation Date</label>
                    <div className="relative">
                        <Input 
                            type="date"
                            value={form.date}
                            max={today}
                            onChange={e => setForm({...form, date: e.target.value})}
                            required
                            className="h-14 bg-light-700/40 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black p-6 text-lg shadow-inner"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-light-500 dark:text-light-700 uppercase tracking-widest ml-1">Case Count</label>
                        <Input 
                            type="number"
                            min="0"
                            value={form.cases}
                            onChange={e => setForm({...form, cases: Number(e.target.value)})}
                            required
                            className="h-14 bg-light-700/40 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black text-center text-xl shadow-inner"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-light-500 dark:text-light-700 uppercase tracking-widest ml-1">Mortality</label>
                        <Input 
                            type="number"
                            min="0"
                            value={form.deaths}
                            onChange={e => setForm({...form, deaths: Number(e.target.value)})}
                            required
                            className={`h-14 bg-light-700/40 dark:bg-white/5 rounded-2xl focus:ring-4 transition-all font-black text-center text-xl shadow-inner ${
                                form.deaths > form.cases 
                                    ? 'border-red-500 focus:ring-red-500/20 text-red-600' 
                                    : 'border-slate-200 dark:border-white/10 focus:ring-primary-500/10 focus:border-primary-500 text-red-500'
                            }`}
                        />
                        {form.deaths > form.cases && (
                            <motion.p 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[10px] font-black text-red-500 uppercase tracking-tighter ml-1"
                            >
                                Mortality cannot exceed case count
                            </motion.p>
                        )}
                    </div>
                </div>
            </div>

            <Button 
                type="submit" 
                disabled={reportMutationPending || form.deaths > form.cases}
                className={`w-full h-16 text-white font-black text-xl rounded-[1.5rem] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 group ${
                    form.deaths > form.cases 
                        ? 'bg-slate-300 dark:bg-white/10 cursor-not-allowed shadow-none' 
                        : 'primary-gradient shadow-primary-500/30'
                }`}
            >
                {reportMutationPending ? (
                    <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
                        <span className="tracking-tighter">SECURE SUBMISSION</span>
                    </>
                )}
            </Button>
        </form>
    </motion.div>
  );
};
