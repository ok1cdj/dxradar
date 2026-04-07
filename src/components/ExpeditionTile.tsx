import React from 'react';
import { motion } from 'motion/react';
import { Zap, MapPin, Clock } from 'lucide-react';
import { Expedition } from '../types';

interface ActiveBandMode {
  freq: string;
  band: string;
  mode: string;
  status: 'confirmed' | 'worked' | 'needed';
  lastSeen: string;
}

interface ExpeditionTileProps {
  expedition: Expedition;
  activeBands: ActiveBandMode[];
  dxccConfirmed: boolean;
  dxccWorked: boolean;
  onBandModeClick: (band: string, mode: string) => void;
  onCallsignClick: () => void;
  key?: React.Key;
}

export default function ExpeditionTile({ expedition, activeBands, dxccConfirmed, dxccWorked, onBandModeClick, onCallsignClick }: ExpeditionTileProps) {
  // Determine overall tile color
  // Red: DXCC not confirmed at all
  // Default: All others (including new band/mode) use neutral background for readability
  
  const hasUnconfirmedActiveBand = activeBands.some(b => b.status !== 'confirmed');
  
  const bgColor = 'bg-zinc-900/40';
  const borderColor = 'border-white/5';
  const textColor = 'text-zinc-100';
  const accentColor = 'text-zinc-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden p-6 rounded-3xl border ${bgColor} ${borderColor} transition-all duration-300 text-left flex flex-col h-full group hover:border-white/10 shadow-lg`}
    >
      <div className="flex justify-between items-start mb-4">
        <button 
          onClick={onCallsignClick}
          className="text-left group/callsign"
        >
          <h3 className={`text-3xl font-black font-mono tracking-tighter ${textColor} transition-transform origin-left group-hover/callsign:scale-105 group-hover/callsign:text-emerald-500`}>
            {expedition.callsign}
          </h3>
          <div className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wider mt-1 ${accentColor} opacity-80`}>
            <MapPin className="w-3 h-3" />
            {expedition.location}
          </div>
        </button>
        <div className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
          !dxccWorked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
          hasUnconfirmedActiveBand ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 
          'bg-zinc-800 text-zinc-500'
        }`}>
          {!dxccWorked ? 'NEW DXCC' : hasUnconfirmedActiveBand ? 'NEW SLOT' : 'CONFIRMED'}
        </div>
      </div>

      <div className="flex-grow">
        <div className="grid grid-cols-2 gap-2">
          {activeBands.map((ab, idx) => (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onBandModeClick(ab.band, ab.mode)}
              key={`${ab.freq}-${ab.mode}-${idx}`}
              className={`flex flex-col p-2 rounded-xl border transition-all cursor-pointer ${
                ab.status === 'confirmed' ? 'bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10' :
                ab.status === 'worked' ? 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10' :
                'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-sm font-bold ${ab.status === 'confirmed' ? 'text-emerald-500/70' : 'text-white/90'}`}>{ab.freq}</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                  ab.mode === 'FT8' ? 'bg-purple-500/10 text-purple-400/70' :
                  ab.mode === 'CW' ? 'bg-blue-500/10 text-blue-400/70' :
                  'bg-zinc-500/10 text-zinc-500'
                }`}>
                  {ab.mode}
                </span>
              </div>
              <div className="text-[8px] text-zinc-600 mt-1 flex items-center gap-1">
                <Clock className="w-2 h-2" />
                {ab.lastSeen}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-end opacity-40">
        <div className="text-[10px] font-mono text-zinc-500">
          {expedition.dates}
        </div>
      </div>
    </motion.div>
  );
}
