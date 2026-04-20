import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Zap, Shield, Globe, Cpu, Cloud, Smartphone, Laptop, Sparkles } from 'lucide-react';
import notifyLogo from '@/assets/notify-logo.jpeg';
import mockupImg from '@/assets/mockup.png';

const NeoHome = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="sticky top-0 z-[100] backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
              <img src={notifyLogo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent italic">NOTIFY</span>
          </div>
          <div className="hidden md:flex items-center gap-8 mr-12">
            <a href="#features" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#sync" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">Sync</a>
            <a href="#desktop" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">Desktop</a>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
          >
            Launch App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-start text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-8">
              <Sparkles size={12} className="fill-current" />
              Intelligence in every note
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 italic">
              Your thoughts, <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">Amplified.</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-xl font-medium leading-relaxed mb-10">
              Notify is the bridge between your ideas and action. Experience a seamless notes engine that lives on your phone, web, and desktop.
            </p>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="group relative px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-2xl"
              >
                Start Writing Now
              </button>
              <button className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg transition-all hover:bg-white/10">
                Learn More
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative perspective-1000"
          >
            <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/20">
              <img src={mockupImg} alt="App Mockup" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sync Section */}
      <section id="sync" className="relative z-10 max-w-7xl mx-auto px-8 py-32 border-y border-white/5">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 italic">Perfect Synchronization</h2>
          <p className="text-zinc-500 max-w-xl mx-auto font-medium">Never lose a thought. Every word you type is instantly available across all your devices.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-blue-600/10 flex items-center justify-center text-blue-500 mx-auto border border-blue-500/20">
              <Smartphone size={32} />
            </div>
            <h3 className="text-xl font-bold italic">Mobile</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">Swift on-the-go capture with full offline support and instant native notifications.</p>
          </div>
          <div className="relative space-y-6">
            <div className="absolute top-8 left-[-20%] right-[-20%] h-[2px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent hidden md:block" />
            <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 flex items-center justify-center text-indigo-500 mx-auto border border-indigo-500/20 relative z-10">
              <Cloud size={32} />
            </div>
            <h3 className="text-xl font-bold italic">Cloud Auth</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">Secure, encrypted synchronization powered by Supabase. Your data is yours alone.</p>
          </div>
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-purple-600/10 flex items-center justify-center text-purple-500 mx-auto border border-purple-500/20">
              <Laptop size={32} />
            </div>
            <h3 className="text-xl font-bold italic">Desktop & Web</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">Full premium experience on any browser. Optimized for high-productivity writing.</p>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-8 py-32">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <motion.div variants={itemVariants} className="p-8 rounded-[2.5rem] bg-[#0c0c0d] border border-white/5 text-left group hover:border-blue-500/20 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <Cpu size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 italic">Fast as thought</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">Optimized for extreme speed. Search, create, and organize without a millisecond of lag.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="p-8 rounded-[2.5rem] bg-[#0c0c0d] border border-white/5 text-left group hover:border-indigo-500/20 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 italic">Clean Energy</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">A distraction-free interface designed to help you focus on what truly matters.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="p-8 rounded-[2.5rem] bg-[#0c0c0d] border border-white/5 text-left group hover:border-purple-500/20 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 italic">Global Workspace</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">Access your workspace from any machine. No installations required, just excellence.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shadow-2xl">
              <img src={notifyLogo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tighter italic">NOTIFY</span>
          </div>
          <p className="text-zinc-600 text-sm font-bold">© 2026 Notify. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Privacy</a>
            <a href="#" className="text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Terms</a>
            <a href="#" className="text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NeoHome;

