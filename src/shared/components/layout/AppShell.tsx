import React from "react";
import { Navbar } from "./Navbar";
import { Chatbot } from "@/features/advisory/components/Chatbot";
import { Outlet } from "react-router-dom";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="w-full">
        <Outlet />
      </main>
      <Chatbot />
    </div>
  );
}
