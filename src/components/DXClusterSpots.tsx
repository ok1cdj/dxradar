import React, { useState, useEffect, useRef } from 'react';
import { Radio, Zap, Clock, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

interface DXClusterSpotsProps {
  filterCallsign?: string;
  filterCallsigns?: string[];
}

export default function DXClusterSpots({ filterCallsign, filterCallsigns }: DXClusterSpotsProps) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Fetch initial spots
    fetch('/api/spots')
      .then(res => res.json())
      .then(data => setSpots(data))
      .catch(err => console.error('Failed to fetch initial spots', err));

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const socket = new WebSocket(`${protocol}//${host}`);

    socket.onopen = () => {
      console.log('Connected to DX Cluster WebSocket');
      setConnected(true);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'spot') {
        setSpots(prev => [message.data, ...prev].slice(0, 100));
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from DX Cluster WebSocket');
      setConnected(false);
    };

    ws.current = socket;

    return () => {
      socket.close();
    };
  }, []);

  const filteredSpots = filterCallsign 
    ? spots.filter(s => s.dxCall.toUpperCase().includes(filterCallsign.toUpperCase()))
    : filterCallsigns && filterCallsigns.length > 0
    ? spots.filter(s => filterCallsigns.some(c => s.dxCall.toUpperCase().includes(c.toUpperCase())))
    : spots;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <Radio className="w-4 h-4" />
          Live DX Cluster Spots
          {connected ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold ml-2">
              <Wifi className="w-3 h-3" /> LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-zinc-600 font-bold ml-2">
              <WifiOff className="w-3 h-3" /> OFFLINE
            </span>
          )}
        </h3>
        {filterCallsign && (
          <div className="text-[10px] font-bold uppercase text-emerald-500/70 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Filtering: {filterCallsign}
          </div>
        )}
        {!filterCallsign && filterCallsigns && filterCallsigns.length > 0 && (
          <div className="text-[10px] font-bold uppercase text-emerald-500/70 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Filtering: Expeditions Only
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-900/90 backdrop-blur-sm z-10">
              <tr className="border-b border-white/5">
                <th className="p-4 text-xs font-bold uppercase text-zinc-500">DX</th>
                <th className="p-4 text-xs font-bold uppercase text-zinc-500">Freq</th>
                <th className="p-4 text-xs font-bold uppercase text-zinc-500">Mode</th>
                <th className="p-4 text-xs font-bold uppercase text-zinc-500">De</th>
                <th className="p-4 text-xs font-bold uppercase text-zinc-500">Comment</th>
                <th className="p-4 text-xs font-bold uppercase text-zinc-500 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filteredSpots.length > 0 ? (
                  filteredSpots.map((spot) => (
                    <motion.tr 
                      key={spot.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group"
                    >
                      <td className="p-4">
                        <span className="font-mono font-black text-white text-lg tracking-tighter group-hover:text-emerald-400 transition-colors">
                          {spot.dxCall}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-zinc-400">{spot.freq}</span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          spot.mode === 'FT8' ? 'bg-purple-500/20 text-purple-400' : 
                          spot.mode === 'FT4' ? 'bg-indigo-500/20 text-indigo-400' :
                          spot.mode === 'CW' ? 'bg-blue-500/20 text-blue-400' : 
                          'bg-zinc-500/20 text-zinc-400'
                        }`}>
                          {spot.mode}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          {spot.isSkimmer && <Zap className="w-3 h-3 text-amber-500" title="Skimmer Spot" />}
                          {spot.spotter}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-zinc-500 italic truncate max-w-[150px] block">
                          {spot.comment}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-xs text-zinc-600">
                          <Clock className="w-3 h-3" />
                          {spot.time}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-zinc-600 italic text-sm">
                      Waiting for spots...
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
