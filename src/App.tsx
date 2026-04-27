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
      if (!isNative) return;
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
      console.log("Checking auth session...");
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (currentSession) {
          setSession(currentSession);
          console.log("Auth session established:", currentSession.user.id);
        }
      } catch (err) {
        console.warn("Auth initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    // 2. Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state change:", _event, session?.user?.id || 'none');
      setSession(session);
      setLoading(false);
      if (session) {
        localStorage.setItem('notify_last_user_id', session.user.id);
      }
    });

    // 3. Capacitor Deep link listener
    let urlListener: any = null;
    if (isNative) {
      urlListener = CapacitorApp.addListener('appUrlOpen', (event) => {
        handleUrl(event.url);
      });
    }

    // 4. Electron Deep link listener (IPC bridge)
    if (window.electron && window.electron.onAppUrlOpen) {
      window.electron.onAppUrlOpen((url: string) => {
        console.log('Electron deep link:', url);
        handleUrl(url);
      });
    }

    return () => {
      subscription.unsubscribe();
      if (urlListener) urlListener.then((l: any) => l.remove());
    };
  }, []);

  const handleUrl = async (urlStr: string) => {
    console.log('Sync processing:', urlStr);
    try {
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      if (urlStr.includes('NOTIFY_SYNC:')) {
        const parts = urlStr.split(':');
        if (parts.length >= 3) {
          accessToken = parts[1];
          refreshToken = parts[2];
        }
      }

      if (accessToken && refreshToken) {
        setLoading(true);
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          toast.error("Handshake failed: " + error.message);
        } else {
          toast.success("Identity Verified!");
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('Deep link error:', err);
      setLoading(false);
    }
  };

  const storedId = localStorage.getItem('notify_last_user_id');
  const effectiveUserId = session?.user?.id || storedId;
  const isLoggedIn = !!effectiveUserId;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm animate-pulse font-medium">Restoring Session...</p>
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
              isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
            } />
            <Route path="/dashboard" element={
              isLoggedIn ? (
                <Index 
                  userName={session?.user?.user_metadata?.full_name || (session?.user?.email) || 'Standard User'} 
                  userEmail={session?.user?.email} 
                  userId={effectiveUserId} 
                  onLogout={async () => {
                    await supabase.auth.signOut();
                    localStorage.removeItem('notify_last_user_id');
                    setSession(null);
                  }} 
                />
              ) : <Navigate to="/login" />
            } />
            <Route path="/login" element={!isLoggedIn ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
