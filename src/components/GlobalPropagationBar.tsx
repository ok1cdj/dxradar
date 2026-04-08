import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Activity } from 'lucide-react';
import PropagationModal from './PropagationModal';

interface BandStatus {
  val: number;
  status: string;
  color: string;
}

interface PropagationData {
  sfi: number;
  kp: number;
  bands: {
    [key: string]: BandStatus;
  };
}

export default function GlobalPropagationBar() {
  const [data, setData] = useState<PropagationData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetch('/api/propagation')
      .then(res => res.json())
      .then(json => {
        console.log('Initial propagation data:', json);
        if (!json.error) setData(json);
      })
      .catch(err => console.error('Failed to fetch propagation data', err));

    // WebSocket listener
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const socket = new WebSocket(`${protocol}//${host}`);

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'propagation') {
          console.log('WS propagation update:', message.data);
          setData(message.data);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    };

    return () => socket.close();
  }, []);

  if (!data) return null;

  const bands = ["160m", "80m", "60m", "40m", "30m", "20m", "17m", "15m", "12m", "10m"];

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-zinc-900/80 backdrop-blur-md border-b border-white/5 px-6 py-2 flex items-center justify-between overflow-x-auto custom-scrollbar gap-8 cursor-pointer hover:bg-zinc-800/80 transition-colors group/bar"
      >
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">SFI</span>
            <span className="text-xs font-mono font-bold text-white">{data.sfi}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Kp</span>
            <span className={`text-xs font-mono font-bold ${data.kp >= 4 ? 'text-rose-500' : 'text-white'}`}>{data.kp}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {bands.map(band => {
            const status = data.bands[band];
            if (!status) return null;
            return (
              <div key={band} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors group">
                <div 
                  className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                  style={{ backgroundColor: status.color, boxShadow: `0 0 8px ${status.color}40` }}
                  title={`${band}: ${status.status} (${status.val})`}
                />
                <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">{band}</span>
              </div>
            );
          })}
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-700 group-hover/bar:text-zinc-500 transition-colors">WSPR Index by HB9VQQ</span>
          <div className="w-1 h-1 rounded-full bg-zinc-800 group-hover/bar:bg-blue-500 transition-colors" />
        </div>
      </div>

      <PropagationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={data} 
      />
    </>
  );
}
