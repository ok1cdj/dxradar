import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Radio, User, Zap } from 'lucide-react';

interface Spot {
  id: string;
  spotter: string;
  freq: string;
  dxCall: string;
  mode: string;
  comment?: string;
  time: string;
  isSkimmer: boolean;
  timestamp: string;
}

interface SpotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  callsign: string;
  band: string;
  mode: string;
  spots: Spot[];
}

export default function SpotsModal({ isOpen, onClose, callsign, band, mode, spots }: SpotsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
            className="relative w-full max-w-3xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{callsign}</h2>
                  <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase tracking-wider border border-emerald-500/20">
                    Last 10 Spots
                  </div>
                </div>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
                  {band} • {mode}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
              {spots.length > 0 ? (
                <div className="space-y-1 min-w-[600px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-[100px_120px_1fr_80px_40px] gap-4 px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5">
                    <div>Frequency</div>
                    <div>Spotter</div>
                    <div>Comment</div>
                    <div className="text-right">Time</div>
                    <div className="w-4"></div>
                  </div>
                  
                  {spots.map((spot, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      key={spot.id}
                      className="grid grid-cols-[100px_120px_1fr_80px_40px] gap-4 px-4 py-2.5 items-center hover:bg-white/5 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-white">{spot.freq}</span>
                        <span className={`text-[9px] font-black px-1 rounded uppercase ${
                          spot.mode === 'FT8' ? 'text-purple-400' :
                          spot.mode === 'CW' ? 'text-blue-400' :
                          'text-zinc-500'
                        }`}>
                          {spot.mode}
                        </span>
                      </div>
                      
                      <div className="text-xs text-zinc-400 font-medium">
                        <span className="opacity-40 mr-1 text-[10px]">by</span>
                        <span className="text-zinc-200 font-bold group-hover:text-emerald-400 transition-colors">{spot.spotter}</span>
                      </div>

                      <div className="text-xs text-zinc-500 font-medium truncate italic" title={spot.comment}>
                        {spot.comment || '-'}
                      </div>
                      
                      <div className="text-xs text-zinc-500 font-mono text-right">
                        {spot.time}
                      </div>

                      <div className="flex justify-center">
                        {spot.isSkimmer ? (
                          <Zap className="w-3 h-3 text-purple-500/50" title="RBN Spot" />
                        ) : (
                          <div className="w-3 h-3" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-zinc-600">
                  <p className="text-sm font-medium">No spots found for this combination</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-black/20 border-t border-white/5 text-center">
              <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">
                Real-time DX Cluster Data
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
