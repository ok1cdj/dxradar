import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, Radio, Settings, Globe, Zap, CheckCircle2, Circle, Mail, Coffee, Github, ShieldCheck, Sparkles, AlertCircle, Calendar } from 'lucide-react';
import { APP_VERSION } from '../version';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-bold text-white tracking-tight">About DX Radar</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[70vh] space-y-8 custom-scrollbar">
              <section className="space-y-3">
                <h3 className="text-emerald-500 font-bold uppercase tracking-wider text-xs">Description</h3>
                <p className="text-zinc-300 leading-relaxed">
                  DX Radar is a real-time dashboard for radio amateurs to track active DX expeditions and manual callsigns. 
                  It integrates live spots from DX Cluster and RBN with your Club Log data to show what you've worked and what you still need.
                </p>
              </section>

              <section className="space-y-4">
                <h3 className="text-emerald-500 font-bold uppercase tracking-wider text-xs">Privacy & Security</h3>
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-3">
                  <div className="flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <p className="text-sm text-zinc-300">
                      <strong>Local Storage:</strong> All your passwords, API keys, and settings are stored <strong>only in your browser</strong>. They are never saved on our server.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Settings className="w-5 h-5 text-emerald-500 shrink-0" />
                    <p className="text-sm text-zinc-300">
                      <strong>Club Log Password:</strong> Do not use your main account password. You must use an <strong>Application Password</strong> generated in your Club Log settings.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-emerald-500 font-bold uppercase tracking-wider text-xs">Key Features</h3>
                <div className="grid gap-4">
                  <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Sparkles className="w-6 h-6 text-blue-400 shrink-0" />
                    <div>
                      <h4 className="text-white font-bold mb-1">AI Spot Analysis</h4>
                      <p className="text-sm text-zinc-400">Intelligent background analysis of DX spots using Gemini AI. It automatically identifies split frequency, signal strength, and operator behavior before you even click.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Settings className="w-6 h-6 text-zinc-400 shrink-0" />
                    <div>
                      <h4 className="text-white font-bold mb-1">Configure Club Log</h4>
                      <p className="text-sm text-zinc-400">Enter your credentials to enable worked/confirmed status tracking. Requires an Application Password.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Zap className="w-6 h-6 text-zinc-400 shrink-0" />
                    <div>
                      <h4 className="text-white font-bold mb-1">Add Manual Callsigns</h4>
                      <p className="text-sm text-zinc-400">You can add specific callsigns to track in the Settings (comma-separated).</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Globe className="w-6 h-6 text-zinc-400 shrink-0" />
                    <div>
                      <h4 className="text-white font-bold mb-1">Monitor Spots</h4>
                      <p className="text-sm text-zinc-400">The dashboard automatically shows active expeditions with live spots from the cluster.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Calendar className="w-6 h-6 text-blue-400 shrink-0" />
                    <div>
                      <h4 className="text-white font-bold mb-1">Upcoming Expeditions</h4>
                      <p className="text-sm text-zinc-400">The expedition list (globe icon) also shows stations starting within the next 14 days, marked with a blue "Upcoming" badge.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-emerald-500 font-bold uppercase tracking-wider text-xs">Status & Urgency</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                    <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                    <div>
                      <h4 className="text-white text-sm font-bold mb-1">Ending Soon</h4>
                      <p className="text-xs text-zinc-400">An orange icon appears when an expedition is in its last 2 days. If it's the <strong>last day</strong>, the icon will blink to alert you.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div>
                      <h4 className="text-white text-sm font-bold mb-1">QSO Status</h4>
                      <p className="text-xs text-zinc-400">Colors indicate your progress: Green for confirmed, Amber for worked, and Grey for needed slots.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-emerald-500 font-bold uppercase tracking-wider text-xs">Status Indicators</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-200">Confirmed</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <Circle className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                    <span className="text-sm font-medium text-amber-200">Worked</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-zinc-500/10 border border-zinc-500/20 rounded-xl">
                    <Circle className="w-5 h-5 text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-400">Needed</span>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-emerald-500 font-bold uppercase tracking-wider text-xs">Interactions</h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Click on a <strong>Band/Mode slot</strong> to see the most recent spots for that specific combination.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Click on the <strong>Callsign</strong> to see your full DXCC matrix for that station.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Use the <strong>Refresh</strong> button in the header to manually reload the expedition list.</span>
                  </li>
                </ul>
              </section>

              <section className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-emerald-500 font-bold uppercase tracking-wider text-xs">Feedback & Issues</h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Found a bug or have a suggestion? Please report it on GitHub or reach out via email.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a 
                    href="https://github.com/ok1cdj/dxradar/issues" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors text-zinc-300 hover:text-white text-sm"
                  >
                    <Github className="w-4 h-4 text-emerald-500" />
                    Report Issue
                  </a>
                  <a 
                    href="mailto:ondra@ok1cdj.com" 
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors text-zinc-300 hover:text-white text-sm"
                  >
                    <Mail className="w-4 h-4 text-emerald-500" />
                    ondra@ok1cdj.com
                  </a>
                  <a 
                    href="https://buymeacoffee.com/ok1cdj" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[#FFDD00]/10 hover:bg-[#FFDD00]/20 border border-[#FFDD00]/20 rounded-xl transition-colors text-[#FFDD00] text-sm font-bold"
                  >
                    <Coffee className="w-4 h-4" />
                    Buy Me a Coffee
                  </a>
                </div>
              </section>
            </div>

            <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-center">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium uppercase tracking-widest">
                <Radio className="w-4 h-4" />
                <span>DX Radar v{APP_VERSION}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
