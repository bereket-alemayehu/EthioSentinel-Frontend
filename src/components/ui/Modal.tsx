import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white p-6 sm:p-8 shadow-2xl dark:bg-dark-400 border border-white/20 dark:border-white/5",
              className
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-dark-300 dark:text-white tracking-tighter uppercase">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6 text-light-500" />
              </button>
            </div>
            
            <div className="relative z-10">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
