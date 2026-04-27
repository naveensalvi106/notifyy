import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, X, Settings, MessageSquare, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  notesContext: string;
  userName: string;
}

export const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, notesContext, userName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('notify_openai_key') || '');
  const [model, setModel] = useState(localStorage.getItem('notify_ai_model') || 'gpt-4o-mini');
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (!apiKey) {
      toast.error("Please add your OpenAI API Key in settings first.");
      setShowSettings(true);
      return;
    }

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: `You are Notify AI, a deeply personal and intuitive digital companion for ${userName}.
              
              YOUR PERSONALITY:
              - Do NOT act like a robotic AI assistant. 
              - Be warm, conversational, and "normal". Speak like a highly intelligent, supportive friend.
              - Be concise but insightful.
              - Never say "As an AI language model".
              - Use the user's name naturally.
              
              YOUR KNOWLEDGE BASE:
              Below is the user's entire knowledge base (notes, checklists, mindmaps). 
              Use this to provide deeply personalized answers. If they ask about projects, ideas, or their past thoughts, refer to this data.
              
              PERSONAL DATA:
              ${notesContext}
              
              If they talk about things outside their notes, be a general companion and chat freely.`
            },
            ...newMessages
          ],
          temperature: 0.8,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const aiMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content,
      };
      setMessages([...newMessages, aiMessage]);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong talking to AI");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('notify_openai_key', apiKey);
    localStorage.setItem('notify_ai_model', model);
    setShowSettings(false);
    toast.success("AI Preferences Saved");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-background/95 backdrop-blur-xl border-l border-white/10 z-[100] flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Notify AI</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Live Companion</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground"
              >
                <Settings size={18} />
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!showSettings ? (
            <>
              {/* Chat Content */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 pt-10">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                    <div className="p-4 rounded-full bg-white/5">
                      <MessageSquare size={32} />
                    </div>
                    <div>
                      <p className="font-medium">Hey {userName}, I'm ready.</p>
                      <p className="text-sm">Ask me anything about your notes or just chat.</p>
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-4 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' 
                        : 'bg-white/5 border border-white/10 rounded-tl-none'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 w-16 flex justify-center items-center gap-1">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 bg-muted/30 border-t border-white/10">
                <div className="relative flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={`Ask Notify AI...`}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 shadow-inner"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="w-11 h-11 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <p className="text-[9px] text-center mt-2 text-muted-foreground/50 uppercase tracking-tighter">
                  Powered by {model.toUpperCase()} • Deep Note Context Active
                </p>
              </div>
            </>
          ) : (
            /* Settings View */
            <div className="flex-1 p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">OpenAI API Key</label>
                <input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[10px] text-muted-foreground">Your key is stored only on this device.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Brains (Model)</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Fast & Lightweight (Recommended)', color: 'text-blue-400' },
                    { id: 'gpt-4o', name: 'GPT-4o', desc: 'Smartest & Most Human', color: 'text-purple-400' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        model === m.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${m.color}`}>{m.name}</span>
                        {model === m.id && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button 
                  onClick={saveSettings}
                  className="flex-1 bg-blue-600 py-3 rounded-xl font-bold text-sm hover:bg-blue-500 transition-colors shadow-lg"
                >
                  Save Configuration
                </button>
                <button 
                  onClick={() => {
                    setMessages([]);
                    toast.success("Chat history cleared locally");
                  }}
                  className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
