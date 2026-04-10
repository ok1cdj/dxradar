import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Radio, User, Zap, Sparkles, Loader2, BrainCircuit, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { AIAnalysis } from '../types';
import { generateAIAnalysis } from '../services/aiService';

interface Spot {
  id: string;
  spotter: string;
  freq: string;
  dxCall: string;
  mode: string;
  comment?: string;
  time: string;
  isSkimmer: boolean;
  spotterCont?: string;
  timestamp: string;
}

interface SpotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  callsign: string;
  band: string;
  mode: string;
  spots: Spot[];
  userContinent?: string;
  geminiApiKey?: string;
  cachedAnalysis?: AIAnalysis;
  onAnalysisUpdate?: (analysis: AIAnalysis) => void;
}

export default function SpotsModal({ 
  isOpen, 
  onClose, 
  callsign, 
  band, 
  mode, 
  spots, 
  userContinent, 
  geminiApiKey,
  cachedAnalysis,
  onAnalysisUpdate
}: SpotsModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeWithAI = async () => {
    if (spots.length === 0 || !geminiApiKey) return;
    setIsAnalyzing(true);
    try {
      const summary = await generateAIAnalysis(
        geminiApiKey,
        callsign,
        band,
        mode,
        spots,
        userContinent || 'Unknown'
      );
      
      if (onAnalysisUpdate) {
        onAnalysisUpdate({
          summary,
          timestamp: Date.now(),
          spotCount: spots.length
        });
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

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

            {/* AI Summary Section */}
            {spots.length > 0 && (
              <div className="px-6 py-4 bg-zinc-800/50 border-b border-white/5">
                {!cachedAnalysis && !isAnalyzing ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={analyzeWithAI}
                      disabled={!geminiApiKey}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all group ${
                        geminiApiKey 
                          ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20' 
                          : 'bg-zinc-500/5 text-zinc-600 border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className={`w-4 h-4 ${geminiApiKey ? 'group-hover:rotate-12 transition-transform' : ''}`} />
                      Analyze with Gemini AI
                    </button>
                    {!geminiApiKey && (
                      <span className="text-[10px] text-zinc-600 font-medium italic">
                        Set Gemini API Key in Settings to enable
                      </span>
                    )}
                  </div>
                ) : isAnalyzing ? (
                  <div className="flex items-center gap-3 text-blue-400 text-xs font-bold animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gemini is analyzing spots...
                  </div>
                ) : cachedAnalysis ? (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                        <BrainCircuit className="w-4 h-4" />
                        AI Insight
                        <span className="ml-2 text-[8px] text-zinc-500 font-normal normal-case tracking-normal">
                          {new Date(cachedAnalysis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button 
                        onClick={analyzeWithAI}
                        disabled={isAnalyzing}
                        className="text-[10px] text-zinc-500 hover:text-blue-400 uppercase font-bold flex items-center gap-1 transition-colors"
                        title="Refresh analysis"
                      >
                        <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>
                    <div className="text-xs text-zinc-300 leading-relaxed max-w-none">
                      <Markdown components={{
                        strong: ({node, ...props}) => <span className="font-black text-blue-400" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc ml-4 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="marker:text-blue-500/50" {...props} />
                      }}>
                        {cachedAnalysis.summary}
                      </Markdown>
                    </div>
                  </motion.div>
                ) : null}
              </div>
            )}

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
                          <span title="RBN Spot">
                            <Zap className="w-3 h-3 text-purple-500/50" />
                          </span>
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
