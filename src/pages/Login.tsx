import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Globe, ChevronRight, Hash } from "lucide-react";
import { useEffect } from "react";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);


  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: Capacitor.isNativePlatform() ? 'com.notify.app://login' : window.location.origin,
        }
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email for a 6-digit code!");
        setShowOtpInput(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleManualLink = async (urlStr: string) => {
    if (!urlStr) return;
    setLoading(true);
    try {
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      // Handle the new NOTIFY_SYNC format
      if (urlStr.startsWith('NOTIFY_SYNC:')) {
        const parts = urlStr.split(':');
        if (parts.length === 3) {
          accessToken = parts[1];
          refreshToken = parts[2];
        }
      } else {
        // Standard URL Extraction logic
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
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true // We manually open it
        }
      });

      if (error) throw error;
      
      if (data?.url) {
        if (isNative) {
          await Browser.open({ url: data.url });
        } else {
          window.location.href = data.url;
        }
      } else {
        throw new Error("No login URL returned from Supabase");
      }
    } catch (error: any) {
      console.error("Google Login Error:", error);
      toast.error("Google login failed: " + (error.message || "Unknown error"));
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

        {!showOtpInput ? (
          <div className="space-y-6">
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    className="bg-[#1e1e1f] border-[#2d2d2f] focus:border-blue-500/50 h-14 pl-12 rounded-xl text-white transition-all outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <Button 
                type="submit"
                className="w-full bg-white text-black hover:bg-zinc-200 h-14 rounded-xl text-lg font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? "Sending..." : "Continue with Email"}
                <ChevronRight className="w-5 h-5" />
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#2d2d2f]"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#161617] px-2 text-zinc-500 font-bold">Fast Synchronization</span>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-center">
              <button 
                type="button"
                onClick={() => setShowOtpInput(true)}
                className="w-full h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-500/5 group"
              >
                <Hash className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                Login with Pairing Token
              </button>
              <p className="text-[10px] text-zinc-500 px-6">
                Generate a token on your PC (Profile &gt; Sync) to log in instantly without email.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-400 uppercase tracking-widest ml-1">Pairing Token</label>
              <textarea
                placeholder="Paste the 'NOTIFY_SYNC:...' token from your PC here"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value;
                  setOtp(val);
                  if (val.length > 50) {
                    handleManualLink(val);
                  }
                }}
                className="w-full h-40 bg-[#1e1e1f] border-[#2d2d2f] rounded-2xl flex items-center justify-center text-zinc-200 placeholder:text-zinc-600 focus:border-blue-500/50 transition-all text-sm p-4 outline-none resize-none border-2 border-dashed border-zinc-800"
                autoFocus
              />
              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 mt-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Auto-detecting token length...
              </div>
            </div>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                setOtp("");
                setShowOtpInput(false);
              }}
              className="w-full border-[#2d2d2f] text-zinc-400 h-14 rounded-xl"
            >
                Cancel and use Email
            </Button>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#2d2d2f]"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#161617] px-2 text-zinc-500">Or continue with</span>
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
          <p className="text-center text-[10px] text-zinc-600 px-4 leading-relaxed">
            By signing in, your notes are encrypted and backed up to Supabase Cloud for cross-device sync.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
