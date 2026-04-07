import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, Radio, Settings, Globe, Zap, CheckCircle2, Circle, Mail, Coffee } from 'lucide-react';

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
                <h3 className="text-emerald-500 font-bold uppercase tracking-wider text-xs">How to use</h3>
                <div className="grid gap-4">
                  <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Settings className="w-6 h-6 text-zinc-400 shrink-0" />
                    <div>
                      <h4 className="text-white font-bold mb-1">Configure Club Log</h4>
                      <p className="text-sm text-zinc-400">Enter your Club Log credentials and callsign in the Settings to enable worked/confirmed status tracking.</p>
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
                <h3 className="text-emerald-500 font-bold uppercase tracking-wider text-xs">Feedback & Support</h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Feedback is welcome! If you have any questions or suggestions, feel free to reach out.
                </p>
                <div className="flex flex-wrap gap-4">
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
                <span>DX Radar v1.0</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
