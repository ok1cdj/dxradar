import React, { useState, useEffect } from 'react';
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

interface ClusterStatusBarProps {
  lastSpot: Spot | null;
  clusterStatus: 'Connected' | 'Connecting' | 'Disconnected';
  wsConnected: boolean;
}

export default function ClusterStatusBar({ lastSpot, clusterStatus, wsConnected }: ClusterStatusBarProps) {

  return (
    <div className="flex items-center justify-between gap-4 py-3 px-6 bg-black/40 border-t border-white/5 backdrop-blur-md">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2">
          {clusterStatus === 'Connected' ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Cluster Connected</span>
            </div>
          ) : clusterStatus === 'Connecting' ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-zinc-700 rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Cluster Offline</span>
            </div>
          )}
          {!wsConnected && (
            <span className="text-[8px] text-red-500/50 uppercase font-black tracking-tighter ml-1">WS Lost</span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {lastSpot && (
            <motion.div 
              key={lastSpot.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 text-xs truncate"
            >
              <span className="text-zinc-500 font-medium uppercase tracking-wider">Last Spot:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-white text-sm tracking-tighter">{lastSpot.dxCall}</span>
                <span className="font-mono text-zinc-400">{lastSpot.freq}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                  lastSpot.mode === 'FT8' ? 'bg-purple-500/20 text-purple-400' : 
                  lastSpot.mode === 'FT4' ? 'bg-indigo-500/20 text-indigo-400' :
                  lastSpot.mode === 'CW' ? 'bg-blue-500/20 text-blue-400' : 
                  'bg-zinc-500/20 text-zinc-400'
                }`}>
                  {lastSpot.mode}
                </span>
                <span className="text-zinc-600 flex items-center gap-1">
                  de {lastSpot.spotter}
                  {lastSpot.isSkimmer && <Zap className="w-2.5 h-2.5 text-amber-500" />}
                </span>
                {lastSpot.comment && (
                  <span className="text-zinc-700 italic text-[10px] truncate max-w-[100px]">
                    {lastSpot.comment}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 whitespace-nowrap">
        <Clock className="w-3 h-3" />
        {lastSpot ? lastSpot.time : '--:--Z'}
      </div>
    </div>
  );
}
