import React from "react";
import { CheckCircle2, AlertTriangle, Activity, XCircle } from "lucide-react";
import type { AlertItem } from "@/features/admin/types";

export function getSeverityLevel(level: AlertItem["severity"]) {
  if (level === "CRITICAL") return { variant: "destructive", color: "text-red-700", bg: "bg-red-50", icon: React.createElement(XCircle, { className: "w-3.5 h-3.5" }) };
  if (level === "HIGH")     return { variant: "warning", color: "text-orange-700", bg: "bg-orange-50", icon: React.createElement(AlertTriangle, { className: "w-3.5 h-3.5" }) };
  if (level === "MEDIUM")   return { variant: "default", color: "text-amber-700", bg: "bg-amber-50", icon: React.createElement(Activity, { className: "w-3.5 h-3.5" }) };
  return { variant: "success", color: "text-emerald-700", bg: "bg-emerald-50", icon: React.createElement(CheckCircle2, { className: "w-3.5 h-3.5" }) };
}
