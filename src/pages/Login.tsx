import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Globe, ChevronRight, Hash } from "lucide-react";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState("");

  const handleManualLink = async (urlStr: string) => {
    if (!urlStr) return;
    setLoading(true);
    try {
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      if (urlStr.startsWith('NOTIFY_SYNC:')) {
        const parts = urlStr.split(':');
        if (parts.length === 3) {
          accessToken = parts[1];
          refreshToken = parts[2];
        }
      } else {
        const getParam = (name: string) => {
          const regex = new RegExp(`[#?&]${name}=([^&]*)`);
          const match = urlStr.match(regex);
          return match ? match[1] : null;
        };
        accessToken = getParam('access_token');
        refreshToken = getParam('refresh_token');
      }

      if (!accessToken || !refreshToken) {
        toast.error("That link didn't work. Please use the 'Generate Mobile Sync Token' on your PC and paste that here.");
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        toast.error("Cloud Error: " + error.message);
      } else {
        toast.success("Ready to Sync!");
      }
    } catch (err: any) {
      toast.error(err.message || "Sync connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const isNative = Capacitor.isNativePlatform();
      const redirectUrl = isNative ? 'com.notify.app://login' : window.location.origin;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true }
      });
      if (error) throw error;
      if (data?.url) {
        if (isNative) { await Browser.open({ url: data.url }); } else { window.location.href = data.url; }
      } else { throw new Error("No login URL returned from Supabase"); }
    } catch (error: any) {
      toast.error("Google login failed: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOwner = async () => {
    if (!ownerPassword) {
      toast.error("Please enter a password");
      return;
    }

    setLoading(true);
    try {
      // User specifically requested "bvcxz" as the only owner password
      if (ownerPassword !== "bvcxz") {
        toast.error("Incorrect Password");
        setLoading(false);
        return;
      }

      // We attempt to sign in with the master account. 
      // We use the password "bvcxz" as requested by the user.
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: "naveen.salvi106@gmail.com",
        password: ownerPassword,
      });

      if (loginError) {
        console.error("Login attempt failed:", loginError);
        // Fallback for developers: if bvcxz fails, maybe the backend hasn't been updated yet.
        // We'll show a more helpful error.
        toast.error("Account Error: " + (loginError.message.includes("Invalid login") ? "Password mismatch in database (expected 'bvcxz')" : loginError.message));
      } else {
        toast.success("Identity Verified! Syncing...");
        setShowOwnerPassword(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#161617] border border-[#262627] rounded-3xl p-8 space-y-8 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
            <span className="text-white text-4xl font-bold">N</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Sync Space</h1>
          <p className="text-zinc-400">Premium Notes & Cloud Sync</p>
        </div>

        {showOwnerPassword ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold text-white">Owner Verification</h2>
              <p className="text-sm text-zinc-500 font-medium">Enter password to unlock account</p>
            </div>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="••••••"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyOwner()}
                autoFocus
                className="bg-[#1e1e1f] border-[#2d2d2f] h-16 rounded-2xl text-center text-2xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-bold"
              />
              <Button 
                onClick={handleVerifyOwner}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 h-16 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/10 transition-all active:scale-95"
              >
                {loading ? "Verifying..." : "Access Account"}
              </Button>
              <button 
                onClick={() => setShowOwnerPassword(false)}
                className="w-full text-zinc-500 text-sm hover:text-zinc-300 transition-colors font-medium"
                disabled={loading}
              >
                Go Back
              </button>
            </div>
          </div>
        ) : !showOtpInput ? (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="p-1 bg-[#1e1e1f] rounded-2xl border border-[#2d2d2f]">
                <button 
                  onClick={() => setShowOwnerPassword(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-16 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/10"
                >
                  <Shield className="w-6 h-6" />
                  Login as Owner
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#2d2d2f]"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
                <span className="bg-[#161617] px-4 text-zinc-600 font-black">Sync Options</span>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                type="button"
                onClick={() => setShowOtpInput(true)}
                className="w-full h-16 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-zinc-300 font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
              >
                <Hash className="w-5 h-5 text-blue-400 group-hover:rotate-12 transition-transform" />
                Connect via Token
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-3 text-center">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest">Connect Device</h3>
              <textarea
                placeholder="Paste your sync token here..."
                value={otp}
                onChange={(e) => {
                  const val = e.target.value;
                  setOtp(val);
                  if (val.length > 50) { handleManualLink(val); }
                }}
                className="w-full h-40 bg-[#1e1e1f] border-[#2d2d2f] rounded-2xl flex items-center justify-center text-white placeholder:text-zinc-600 focus:border-blue-500/50 transition-all text-xs p-5 outline-none resize-none border-2 border-dashed"
                autoFocus
              />
              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 italic">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                Waiting for token...
              </div>
            </div>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => { setOtp(""); setShowOtpInput(false); }}
              className="w-full border-[#2d2d2f] text-zinc-500 h-14 rounded-xl font-bold"
            >
                Back
            </Button>
          </div>
        ) }

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#2d2d2f]"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#161617] px-2 text-zinc-500 font-bold">Standard Access</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            type="button"
            variant="outline" 
            onClick={handleGoogleLogin}
            className="w-full border-[#2d2d2f] hover:bg-white hover:text-black h-14 rounded-xl text-lg font-bold transition-all active:scale-95 flex items-center justify-center gap-3"
            disabled={loading}
          >
            <Globe className="w-5 h-5" />
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
