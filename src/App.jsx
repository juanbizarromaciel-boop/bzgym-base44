import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { queryClientInstance } from "@/lib/query-client";
import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import AuthenticatedApp from "@/routing/AuthenticatedApp";

function App() {
  return <AuthProvider><ThemeProvider><QueryClientProvider client={queryClientInstance}><Router><Routes><Route path="*" element={<AuthenticatedApp />} /></Routes></Router><Toaster /><Sonner richColors position="top-right" /></QueryClientProvider></ThemeProvider></AuthProvider>;
}

export default App