import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import NeoHome from "./pages/NeoHome";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { Capacitor } from "@capacitor/core";

const queryClient = new QueryClient();

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // 0. Request Notifications Permission instantly
    const requestPerms = async () => {
      try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      } catch (err) {
        console.warn('Notification permission request failed:', err);
      }
    };
    requestPerms();

    // 1. Check session
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
      } catch (err) {
        console.error("Auth init failed:", err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    // Safety timeout to prevent permanent black screen
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // 2. Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // 3. Capacitor Deep link listener
    const urlListener = CapacitorApp.addListener('appUrlOpen', (event) => {
      handleUrl(event.url);
    });

    return () => {
      subscription.unsubscribe();
      urlListener.then(l => l.remove());
      clearTimeout(safetyTimeout);
    };
  }, []);

  const handleUrl = async (urlStr: string) => {
    console.log('Mobile redirect:', urlStr);
    try {
      const url = new URL(urlStr.replace('com.notify.app://', 'https://notify.app/'));
      
      // Try hash first (Supabase default)
      let hash = url.hash.substring(1);
      if (!hash && url.search) {
        // Fallback to query params
        hash = url.search.substring(1);
      }
      
      if (!hash) return;

      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        setLoading(true);
        toast.info("Connecting your account...");
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Session error:', error);
          toast.error("Sync failed: " + error.message);
        } else {
          toast.success("Sync complete!");
          // Force a small delay to ensure session is stored
          setTimeout(() => window.location.href = '#/dashboard', 500);
        }
      }
    } catch (err) {
      console.error('Deep link error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm animate-pulse">Initializing Notify...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HashRouter>
          <Toaster />
          <Sonner position="top-center" />
          <Routes>
            <Route path="/" element={
              session ? <Navigate to="/dashboard" /> : 
              (isNative ? <Navigate to="/login" /> : <NeoHome />)
            } />
            <Route path="/dashboard" element={
              session ? <Index userName={session.user.user_metadata.full_name || 'User'} userEmail={session.user.email} userId={session.user.id} onLogout={() => supabase.auth.signOut()} /> : <Navigate to="/login" />
            } />
            <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/home" element={<NeoHome />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
