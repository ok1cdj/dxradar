import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sun, Activity, TrendingUp, Info } from 'lucide-react';

interface BandStatus {
  val: number;
  status: string;
  color: string;
  forecast: number;
  forecastRating: string;
  forecastColor: string;
}

interface PropagationData {
  sfi: number;
  kp: number;
  bands: {
    [key: string]: BandStatus;
  };
}

interface PropagationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PropagationData | null;
}

export default function PropagationModal({ isOpen, onClose, data }: PropagationModalProps) {
  if (!isOpen || !data) return null;

  const bands = ["160m", "80m", "60m", "40m", "30m", "20m", "17m", "15m", "12m", "10m"];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Propagation Details
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {/* Solar Indices */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                <Sun className="w-8 h-8 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Solar Flux Index</span>
                <span className="text-3xl font-black text-white">{data.sfi}</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                <Activity className="w-8 h-8 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Kp Index</span>
                <span className={`text-3xl font-black ${data.kp >= 4 ? 'text-rose-500' : 'text-white'}`}>{data.kp}</span>
              </div>
            </div>

            {/* Band Table */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 px-2">
                <Info className="w-4 h-4" /> Band Conditions & Forecast
              </h3>
              <div className="overflow-hidden border border-white/5 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                      <th className="px-4 py-3">Band</th>
                      <th className="px-4 py-3 text-center">Current Index</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Forecast</th>
                      <th className="px-4 py-3 text-center">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {bands.map(band => {
                      const status = data.bands[band];
                      if (!status) return null;
                      const trend = status.forecast > status.val ? 'up' : status.forecast < status.val ? 'down' : 'stable';
                      
                      return (
                        <tr key={band} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 font-bold text-white">{band}</td>
                          <td className="px-4 py-4 text-center font-mono text-zinc-300">{status.val.toFixed(1)}</td>
                          <td className="px-4 py-4 text-center">
                            <span 
                              className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                              style={{ backgroundColor: `${status.color}20`, color: status.color }}
                            >
                              {status.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center font-mono text-zinc-300">{status.forecast.toFixed(1)}</td>
                          <td className="px-4 py-4 text-center">
                            <span 
                              className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                              style={{ backgroundColor: `${status.forecastColor}20`, color: status.forecastColor }}
                            >
                              {status.forecastRating}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-xs text-blue-200/70 leading-relaxed">
                The WSPR Propagation Index is calculated based on real-time WSPR spots globally. 
                Values above 50 indicate good conditions, while values above 70 are considered excellent.
                Forecast is based on recent trends and solar activity.
              </p>
            </div>
          </div>

          <div className="p-4 bg-black/40 border-t border-white/5 flex justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Data provided by HB9VQQ Propagation Service
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
