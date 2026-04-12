import React from 'react';
import { X, CheckCircle2, Circle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  callsign: string;
  status: {
    dxccId?: string;
    dxccName?: string;
    dxccConfirmed: boolean;
    dxccWorked: boolean;
    bandMap?: {
      [band: string]: any; // Can be {w, c} or {CW: {w, c}, ...}
    };
    bandModeStatus: {
      [band_mode: string]: {
        worked: boolean;
        confirmed: boolean;
      };
    };
  };
}

const BANDS = ['160m', '80m', '40m', '30m', '20m', '17m', '15m', '12m', '10m', '6m'];
const MODES = ['CW', 'DIGI', 'SSB'];

export default function StatusModal({ isOpen, onClose, callsign, status }: StatusModalProps) {
  if (!isOpen) return null;

  const getStatus = (band: string, mode: string): 'confirmed' | 'worked' | 'needed' => {
    const checkStatus = (b: string, m: string): 'confirmed' | 'worked' | 'needed' => {
      // 1. Check specific band-mode status from recent lookup
      const bms = status.bandModeStatus[`${b}-${m}`];
      if (bms) {
        if (bms.confirmed) return 'confirmed';
        if (bms.worked) return 'worked';
      }
      
      // 2. Fallback to bandMap (mode=0 summary or nested modes)
      if (status.bandMap && status.bandMap[b]) {
        const bandData = status.bandMap[b];
        
        // If nested structure (modes)
        if (bandData.w === undefined && typeof bandData === 'object') {
          let clublogMode = "";
          if (m === "CW") clublogMode = "CW";
          else if (m === "SSB") clublogMode = "PH";
          else if (m === "DIGI" || m === "FT8" || m === "FT4") clublogMode = "DA";

          const modeData = bandData[clublogMode];
          if (modeData) {
            if (modeData.c > 0) return 'confirmed';
            if (modeData.w > 0) return 'worked';
          }
        }
      }

      return 'needed';
    };

    if (mode === 'DIGI') {
      const ft8 = checkStatus(band, 'FT8');
      const ft4 = checkStatus(band, 'FT4');
      const digi = checkStatus(band, 'DIGI');
      
      if (ft8 === 'confirmed' || ft4 === 'confirmed' || digi === 'confirmed') return 'confirmed';
      if (ft8 === 'worked' || ft4 === 'worked' || digi === 'worked') return 'worked';
      return 'needed';
    }
    return checkStatus(band, mode);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-zinc-900 border border-white/10 rounded-[1.25rem] w-full max-w-[280px] overflow-hidden shadow-2xl"
        >
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-zinc-800/50 to-transparent">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black text-white font-mono tracking-tighter uppercase italic leading-none truncate">
                {status.dxccName || callsign}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest truncate">
                  {status.dxccName ? callsign : 'Status Matrix'}
                </p>
                {!status.dxccWorked && (
                  <span className="text-[8px] font-black bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase tracking-widest border border-red-500/30 shrink-0">
                    New DXCC
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-all shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2">
            <table className="w-full border-separate border-spacing-[2px]">
              <thead>
                <tr>
                  <th className="w-10"></th>
                  {MODES.map(mode => (
                    <th key={mode} className="pb-1 text-[8px] font-black uppercase tracking-widest text-zinc-600">
                      {mode}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BANDS.map(band => (
                  <tr key={band}>
                    <td className="py-0.5 text-[9px] font-bold text-zinc-500 text-right pr-2 border-r border-white/5">
                      {band}
                    </td>
                    {MODES.map(mode => {
                      const s = getStatus(band, mode);
                      return (
                        <td key={`${band}-${mode}`} className="p-0">
                          <div className={`
                            flex items-center justify-center h-6 rounded-md border transition-all
                            ${s === 'confirmed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                              s === 'worked' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                              'bg-white/5 border-white/5 text-zinc-900'}
                          `}>
                            {s === 'confirmed' ? <CheckCircle2 className="w-3 h-3" /> : 
                             s === 'worked' ? <Circle className="w-3 h-3 fill-current opacity-40" /> : 
                             <div className="w-1 h-1 rounded-full bg-white/5" />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-white/5 bg-black/20 flex items-center justify-center">
            <div className="flex gap-4">
              <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-emerald-500/80">
                <CheckCircle2 className="w-2.5 h-2.5" /> CFM
              </div>
              <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-amber-500/80">
                <Circle className="w-2.5 h-2.5 fill-current opacity-40" /> WRK
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
