import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/shared/utils/cn";

type AdminDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function AdminDetailModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  className,
}: AdminDetailModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className={cn(
              "relative flex w-full max-w-3xl max-h-[min(92vh,900px)] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900",
              className,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-teal-100 bg-gradient-to-r from-teal-50 via-white to-emerald-50/80 px-6 py-5 dark:border-slate-800 dark:from-teal-950/40 dark:via-slate-900 dark:to-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  {icon ? (
                    <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/25">
                      {icon}
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
                      {title}
                    </h2>
                    {subtitle ? (
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">
              {children}
            </div>

            {footer ? (
              <div className="shrink-0 border-t border-slate-100 bg-slate-50/90 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/60">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
