import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('easynotes_user');
      if (raw) {
        const data = JSON.parse(raw);
        setUser(data.name);
      }
    } catch {}
  }, []);

  const handleLogin = (name: string) => setUser(name);

  const handleLogout = () => {
    localStorage.removeItem('easynotes_user');
    setUser(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  <Index userName={user} onLogout={handleLogout} />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
