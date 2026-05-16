import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Calendar, ExternalLink, Info, AlertCircle } from 'lucide-react';
import { Expedition } from '../types';
import { getExpeditionUrgency } from '../utils/dateUtils';

interface ExpeditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expeditions: Expedition[];
}

export default function ExpeditionsModal({ isOpen, onClose, expeditions }: ExpeditionsModalProps) {
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
            className="relative w-full max-w-3xl bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-bold text-white tracking-tight">Active & Upcoming Expeditions</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid gap-3">
                {expeditions.length === 0 ? (
                  <div className="p-12 text-center">
                    <Info className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium">No expeditions found.</p>
                  </div>
                ) : (
                  expeditions.map((exp) => {
                    const urgency = getExpeditionUrgency(exp.dates);
                    return (
                      <div 
                        key={exp.id}
                        className="group p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/10 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-bold text-white font-mono tracking-tight group-hover:text-emerald-400 transition-colors">
                                {exp.callsign}
                              </h3>
                              {urgency !== 'none' && (
                                <motion.div
                                  animate={urgency === 'last-day' ? { opacity: [1, 0, 1] } : {}}
                                  transition={urgency === 'last-day' ? { repeat: Infinity, duration: 0.8, ease: "linear" } : {}}
                                  className="text-amber-500"
                                  title={urgency === 'last-day' ? "Last day!" : "Last 2 days!"}
                                >
                                  <AlertCircle className="w-4 h-4 fill-current bg-black rounded-full" />
                                </motion.div>
                              )}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                                exp.status === 'Active' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              }`}>
                                {exp.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-y-1 gap-x-4 text-sm text-zinc-400">
                            <div className="flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-zinc-500" />
                              <span className="truncate">{exp.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                              <span>{exp.dates}</span>
                            </div>
                            {exp.source && (
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-400 border border-zinc-700">
                                  {exp.source}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {exp.websiteUrl && (
                            <a 
                              href={exp.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-white/5 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400 rounded-xl transition-all border border-white/5 hover:border-emerald-500/30"
                              title="Expedition Website"
                            >
                              <Globe className="w-4 h-4" />
                            </a>
                          )}
                          <a 
                            href={`https://www.qrz.com/db/${exp.callsign}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/5 hover:bg-blue-500/20 text-zinc-400 hover:text-blue-400 rounded-xl transition-all border border-white/5 hover:border-blue-500/30"
                            title="View on QRZ.com"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      
                      {/* Mini Gantt Chart */}
                      {exp.startDate && exp.endDate && (
                        <div className="flex w-full h-[3px] gap-[1px] mt-4 opacity-70" title="Timeline for the current month">
                          {Array.from({ length: 31 }).map((_, i) => {
                            const d = i + 1;
                            const now = new Date();
                            const today = now.getDate();
                            const currentMonth = now.getMonth();
                            const currentYear = now.getFullYear();
                            
                            const cellDate = new Date(currentYear, currentMonth, d);
                            const cellEndDate = new Date(currentYear, currentMonth, d, 23, 59, 59);
                            const start = new Date(exp.startDate!);
                            const end = new Date(exp.endDate!);
                            
                            const isActive = cellEndDate >= start && cellDate <= end;
                            
                            if (!isActive) {
                              return <div key={i} className="flex-1 bg-white/5 rounded-full" />;
                            }
                            
                            if (d < today) {
                              // Passed
                              return <div key={i} className="flex-1 bg-emerald-500/20 rounded-full" />;
                            } else if (d === today) {
                              // Today
                              return <div key={i} className="flex-1 bg-emerald-400 rounded-full shadow-[0_0_4px_rgba(52,211,153,1)]" />;
                            } else {
                              // Future
                              return <div key={i} className="flex-1 bg-emerald-500/70 rounded-full" />;
                            }
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              </div>
            </div>

            <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              <span>Total: {expeditions.length} expeditions</span>
              <span className="flex items-center gap-1">
                Data from <span className="text-zinc-400">NG3K & DXWorld</span>
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
