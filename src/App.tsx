import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, 
  Settings, 
  AlertCircle,
  Zap,
  Globe,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Expedition } from './types';
import SettingsModal, { Settings as AppSettings } from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import ClusterStatusBar from './components/ClusterStatusBar';
import ExpeditionTile from './components/ExpeditionTile';
import SpotsModal from './components/SpotsModal';
import StatusModal from './components/StatusModal';

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

interface ExpeditionStatus {
  dxccId?: string;
  dxccName?: string;
  dxccConfirmed: boolean;
  dxccWorked: boolean;
  bandMap?: {
    [band: string]: {
      [mode: string]: {
        w: number;
        c: number;
      };
    };
  };
  bandModeStatus: {
    [band_mode: string]: {
      worked: boolean;
      confirmed: boolean;
      isNewDxcc?: boolean;
      isNewSlot?: boolean;
    };
  };
}

const BANDS = ['160m', '80m', '40m', '30m', '20m', '17m', '15m', '12m', '10m', '6m'];
const MODES = ['CW', 'FT8', 'FT4', 'SSB'];

const getBandFromFreq = (freq: string): string => {
  const f = parseFloat(freq);
  if (f >= 1800 && f <= 2000) return '160m';
  if (f >= 3500 && f <= 4000) return '80m';
  if (f >= 7000 && f <= 7300) return '40m';
  if (f >= 10100 && f <= 10150) return '30m';
  if (f >= 14000 && f <= 14350) return '20m';
  if (f >= 18068 && f <= 18168) return '17m';
  if (f >= 21000 && f <= 21450) return '15m';
  if (f >= 24890 && f <= 24990) return '12m';
  if (f >= 28000 && f <= 29700) return '10m';
  if (f >= 50000 && f <= 54000) return '6m';
  // If it's already a band name or something else
  if (freq.toLowerCase().endsWith('m')) return freq;
  return freq;
};

export default function App() {
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [liveSpots, setLiveSpots] = useState<Spot[]>([]);
  const [expeditionStatus, setExpeditionStatus] = useState<{ [callsign: string]: ExpeditionStatus }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [lastClubLogCheck, setLastClubLogCheck] = useState<{ [key: string]: number }>({});
  const [clusterStatus, setClusterStatus] = useState<'Connected' | 'Connecting' | 'Disconnected'>('Disconnected');
  const [wsConnected, setWsConnected] = useState(false);
  
  // Spots Modal State
  const [isSpotsModalOpen, setIsSpotsModalOpen] = useState(false);
  const [selectedExpedition, setSelectedExpedition] = useState<string>('');
  const [selectedBand, setSelectedBand] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('');

  // Status Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatusCallsign, setSelectedStatusCallsign] = useState<string>('');

  const [settings, setSettings] = useState<AppSettings>({
    clublogEmail: '',
    clublogPassword: '',
    myCallsign: '',
    spotLifetime: 30,
    manualCallsigns: '',
    hideConfirmed: false
  });

  const [isChartLoading, setIsChartLoading] = useState(false);

  // Load and sync settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('dx_expedition_settings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
        // Sync only spotLifetime and manualCallsigns to server
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            spotLifetime: parsedSettings.spotLifetime,
            manualCallsigns: parsedSettings.manualCallsigns
          })
        });
      } catch (e) {
        console.error('Failed to sync settings', e);
      }
    }
  }, []);

  // Fetch initial DXCC chart if credentials are available
  useEffect(() => {
    if (settings.clublogEmail && settings.clublogPassword && settings.myCallsign) {
      fetchInitialChart();
    }
  }, [settings.clublogEmail, settings.clublogPassword, settings.myCallsign]);

  const fetchInitialChart = async () => {
    if (isChartLoading) return;
    setIsChartLoading(true);
    try {
      // We use a dummy callsign lookup to trigger chart fetch and get it back
      const res = await fetch('/api/private_lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          callsign: settings.myCallsign, // Just a dummy lookup to get the chart
          clublogEmail: settings.clublogEmail,
          clublogPassword: settings.clublogPassword,
          myCallsign: settings.myCallsign
        })
      });
      const data = await res.json();
      if (res.ok && data.bandMap) {
        // We don't need to store the dummy lookup result, just the chart is enough
        // But actually the server returns the chart in bandMap
      }
    } catch (e) {
      console.error('Failed to fetch initial chart', e);
    } finally {
      setIsChartLoading(false);
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('dx_expedition_settings', JSON.stringify(newSettings));
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          spotLifetime: newSettings.spotLifetime,
          manualCallsigns: newSettings.manualCallsigns
        })
      });
      // Clear status cache to re-check
      setExpeditionStatus({});
      setLastClubLogCheck({});
    } catch (e) {
      console.error('Failed to save settings to server', e);
    }
  };

  const handleBandModeClick = (callsign: string, band: string, mode: string) => {
    setSelectedExpedition(callsign);
    setSelectedBand(band);
    setSelectedMode(mode);
    setIsSpotsModalOpen(true);
  };

  const filteredSpotsForModal = useMemo(() => {
    if (!selectedExpedition || !selectedBand || !selectedMode) return [];
    
    // Find spots for this callsign
    const expeditionSpots = liveSpots.filter(s => s.dxCall.toUpperCase().includes(selectedExpedition.toUpperCase()));
    
    // Filter by band and mode, sort by time, take top 10
    return expeditionSpots
      .filter(s => getBandFromFreq(s.freq) === selectedBand && s.mode === selectedMode)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [liveSpots, selectedExpedition, selectedBand, selectedMode]);

  useEffect(() => {
    initializeApp();
    const cleanup = setupWebSocket();
    return cleanup;
  }, []);

  const initializeApp = async () => {
    setLoading(true);
    await Promise.all([
      fetchExpeditions(),
      fetchInitialSpots()
    ]);
    setLoading(false);
  };

  const fetchExpeditions = async () => {
    try {
      const res = await fetch('/api/expeditions');
      const data = await res.json();
      setExpeditions(data.filter((e: Expedition) => e.status === 'Active'));
    } catch (err) {
      setError('Failed to load expeditions');
    }
  };

  const fetchInitialSpots = async () => {
    try {
      const res = await fetch('/api/spots');
      const data = await res.json();
      setLiveSpots(data);
    } catch (err) {
      console.error('Failed to load initial spots', err);
    }
  };

  const setupWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    let socket: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isClosing = false;

    const connect = () => {
      if (isClosing) return;

      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onclose = null;
        socket.onerror = null;
        try {
          socket.close();
        } catch (e) {
          console.error('Error closing socket:', e);
        }
      }

      console.log(`Connecting to WebSocket: ${protocol}//${host}`);
      socket = new WebSocket(`${protocol}//${host}`);

      socket.onopen = () => {
        console.log('WebSocket connected to server');
        setWsConnected(true);
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        // Refresh spots on reconnect to ensure we didn't miss anything
        fetchInitialSpots();
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'spot') {
            const spot = message.data;
            setLiveSpots(prev => {
              // Avoid duplicates
              if (prev.some(s => s.id === spot.id)) return prev;
              return [spot, ...prev].slice(0, 2000);
            });
          } else if (message.type === 'status') {
            setClusterStatus(message.data.status);
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      socket.onclose = (event) => {
        if (isClosing) return;
        console.log('WebSocket disconnected:', event.code, event.reason);
        setWsConnected(false);
        setClusterStatus('Disconnected');
        
        // Don't reconnect immediately if it was an abnormal closure (1006)
        // to avoid spamming the server
        const delay = event.code === 1006 ? 5000 : 3000;
        
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(connect, delay);
        }
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        setWsConnected(false);
      };
    };

    connect();

    return () => {
      isClosing = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  };

  const checkClubLog = async (callsign: string, band?: string, mode?: string, freq?: string) => {
    const cacheKey = `${callsign}-${band || 'ALL'}-${mode || 'ALL'}`;
    const now = Date.now();
    
    // Don't check more than once every 5 minutes for the same combination
    if (lastClubLogCheck[cacheKey] && (now - lastClubLogCheck[cacheKey] < 300000)) {
      return;
    }

    setLastClubLogCheck(prev => ({ ...prev, [cacheKey]: now }));

    try {
      const res = await fetch('/api/private_lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          callsign, 
          band, 
          mode,
          freq,
          clublogEmail: settings.clublogEmail,
          clublogPassword: settings.clublogPassword,
          myCallsign: settings.myCallsign
        })
      });
      const data = await res.json();

      if (res.ok && data && typeof data === 'object') {
        setExpeditionStatus(prev => {
          const current = prev[callsign] || { dxccConfirmed: false, dxccWorked: false, bandModeStatus: {} };
          
          // Use dxccConfirmed from Club Log to determine if it's a new DXCC overall
          const dxccConfirmed = data.dxccConfirmed !== undefined ? !!data.dxccConfirmed : current.dxccConfirmed;
          const dxccWorked = data.dxccWorked !== undefined ? !!data.dxccWorked : current.dxccWorked;
          const dxccId = data.dxccId || current.dxccId;
          const dxccName = data.dxccName || current.dxccName;

          // If we have a bandMap, populate all bands
          const bandModeStatus = { ...current.bandModeStatus };
          
          // If we checked a specific band/mode
          if (band && mode) {
            const status = {
              confirmed: !!data.confirmed,
              worked: !!data.worked,
              isNewDxcc: !!data.isNewDxcc,
              isNewSlot: !!data.isNewSlot
            };
            bandModeStatus[`${band}-${mode}`] = status;
          }
          
          return {
            ...prev,
            [callsign]: {
              ...current,
              dxccId,
              dxccName,
              dxccConfirmed,
              dxccWorked,
              bandMap: data.bandMap || current.bandMap || {},
              bandModeStatus
            }
          };
        });
      }
    } catch (err) {
      console.error('Club Log check failed', err);
    }
  };

  const manualExpeditions = useMemo(() => {
    return (settings.manualCallsigns || '')
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(c => c.length > 0)
      .map(c => {
        const status = expeditionStatus[c];
        return {
          id: `manual-${c}`,
          callsign: c,
          location: (status?.dxccName && status.dxccName !== 'Unknown') ? status.dxccName : 'Manual Watch',
          dates: 'Always',
          status: 'Active' as const,
          websiteUrl: ''
        };
      });
  }, [settings.manualCallsigns, expeditionStatus]);

  const allExpeditions = useMemo(() => {
    const combined = [...expeditions, ...manualExpeditions];
    const unique = Array.from(new Map(combined.map(e => [e.callsign, e])).values());
    return unique.map(e => {
      const status = expeditionStatus[e.callsign];
      if (status?.dxccName && status.dxccName !== 'Unknown') {
        return { ...e, location: status.dxccName };
      }
      return e;
    });
  }, [expeditions, manualExpeditions, expeditionStatus]);

  // Group spots by expedition
  const activeExpeditionsData = useMemo<{ [callsign: string]: { band: string, freq: string, mode: string, time: string }[] }>(() => {
    const grouped: { [callsign: string]: { band: string, freq: string, mode: string, time: string }[] } = {};
    
    // Use spotLifetime from settings (default to 30 minutes if not set)
    const lifetimeMs = (settings.spotLifetime || 30) * 60 * 1000;
    const cutoffTime = Date.now() - lifetimeMs;
    
    liveSpots.forEach(spot => {
      const spotTime = new Date(spot.timestamp).getTime();
      if (spotTime < cutoffTime) return;

      // Find if this spot belongs to an expedition
      const exp = allExpeditions.find(e => spot.dxCall.toUpperCase().includes(e.callsign.toUpperCase()));
      if (exp) {
        if (!grouped[exp.callsign]) grouped[exp.callsign] = [];
        
        const band = getBandFromFreq(spot.freq);
        
        // Only add unique band/mode pairs (we keep the most recent frequency for that band/mode)
        const existingIdx = grouped[exp.callsign].findIndex(s => s.band === band && s.mode === spot.mode);
        if (existingIdx === -1) {
          grouped[exp.callsign].push({
            band: band,
            freq: spot.freq,
            mode: spot.mode,
            time: spot.time
          });
        }
      }
    });

    return grouped;
  }, [liveSpots, allExpeditions, settings.spotLifetime]);

  // Trigger Club Log checks in a separate effect
  useEffect(() => {
    // 1. Check all expeditions (including manual) to get DXCC names and overall status
    allExpeditions.forEach(exp => {
      const fullCheckKey = `${exp.callsign}-ALL-ALL`;
      if (!lastClubLogCheck[fullCheckKey] || (Date.now() - lastClubLogCheck[fullCheckKey] > 300000)) {
        checkClubLog(exp.callsign);
      }
    });

    // 2. Check specific band/mode for active spots
    Object.keys(activeExpeditionsData).forEach(callsign => {
      const data = activeExpeditionsData[callsign];
      data.forEach(ad => {
        checkClubLog(callsign, ad.band, ad.mode, ad.freq);
      });
    });
  }, [activeExpeditionsData, allExpeditions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Radio className="w-12 h-12 text-emerald-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Radio className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">DX Radar</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white"
              title="Help & Info"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button 
              onClick={fetchExpeditions}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white"
              title="Refresh Expeditions"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleSaveSettings} 
      />

      <HelpModal 
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <StatusModal 
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        callsign={selectedStatusCallsign}
        status={expeditionStatus[selectedStatusCallsign] || { dxccConfirmed: false, dxccWorked: false, bandModeStatus: {} }}
      />

      <main className="w-full px-6 py-12 pb-32">
        {error && (
          <div className="w-full mb-8 bg-amber-500/10 border border-amber-500/50 p-4 rounded-2xl flex items-center gap-3 text-amber-200">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {allExpeditions
            .filter(exp => activeExpeditionsData[exp.callsign] && activeExpeditionsData[exp.callsign].length > 0)
            .map((exp) => {
              const activeData = activeExpeditionsData[exp.callsign] || [];
              const status = expeditionStatus[exp.callsign] || { dxccConfirmed: false, dxccWorked: false, bandModeStatus: {} };
              
              // Map active data to the format ExpeditionTile expects
              let activeBands = activeData.map(ad => {
                const bms = status.bandModeStatus[`${ad.band}-${ad.mode}`];
                let displayStatus: 'confirmed' | 'worked' | 'needed' = 'needed';
                
                if (bms) {
                  if (bms.confirmed) displayStatus = 'confirmed';
                  else if (bms.worked) displayStatus = 'worked';
                }

                return {
                  freq: ad.freq,
                  band: ad.band,
                  mode: ad.mode,
                  status: displayStatus,
                  lastSeen: ad.time
                };
              });

              // Filter out bands if setting is enabled and THIS slot is confirmed
              if (settings.hideConfirmed) {
                activeBands = activeBands.filter(ab => ab.status !== 'confirmed');
              }

              if (activeBands.length === 0) return null;

              return (
                <ExpeditionTile 
                  key={exp.id}
                  expedition={exp}
                  activeBands={activeBands}
                  dxccConfirmed={status.dxccConfirmed}
                  dxccWorked={status.dxccWorked}
                  onBandModeClick={(band, mode) => handleBandModeClick(exp.callsign, band, mode)}
                  onCallsignClick={() => {
                    setSelectedStatusCallsign(exp.callsign);
                    setIsStatusModalOpen(true);
                    // Fetch full status if not already present or if we want to refresh
                    checkClubLog(exp.callsign);
                  }}
                />
              );
            })}
        </div>

        <SpotsModal 
          isOpen={isSpotsModalOpen}
          onClose={() => setIsSpotsModalOpen(false)}
          callsign={selectedExpedition}
          band={selectedBand}
          mode={selectedMode}
          spots={filteredSpotsForModal}
        />

        {Object.keys(activeExpeditionsData).length === 0 && !loading && (
          <div className="text-center py-32 text-zinc-600">
            <Radio className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="text-lg font-medium">No live expedition spots detected</p>
            <p className="text-sm opacity-50">Waiting for DX Cluster data...</p>
          </div>
        )}
      </main>

      {/* Minimal Footer with Cluster Status */}
      <footer className="fixed bottom-0 left-0 right-0 z-40">
        <ClusterStatusBar 
          lastSpot={liveSpots.length > 0 ? liveSpots[0] : null}
          clusterStatus={clusterStatus}
          wsConnected={wsConnected}
        />
      </footer>
    </div>
  );
}
