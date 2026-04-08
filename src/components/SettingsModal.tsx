import React, { useState, useEffect } from 'react';
import { X, Save, Server, Radio, Key, Globe, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Settings {
  clublogEmail: string;
  clublogPassword: string;
  myCallsign: string;
  spotLifetime: number;
  manualCallsigns: string;
  hideConfirmed: boolean;
  onlyMyContinent: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  clublogEmail: '',
  clublogPassword: '',
  myCallsign: '',
  spotLifetime: 30,
  manualCallsigns: '',
  hideConfirmed: false,
  onlyMyContinent: false
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Settings) => void;
}

export default function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [testCallsign, setTestCallsign] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingCallsign, setIsTestingCallsign] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dx_expedition_settings');
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('dx_expedition_settings', JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  const handleTestConnection = async () => {
    if (!settings.clublogEmail || !settings.clublogPassword || !settings.myCallsign) {
      setTestStatus('error');
      setTestMessage('Please fill in all Club Log fields');
      return;
    }

    setTestStatus('loading');
    setTestMessage('Testing connection...');

    try {
      const response = await fetch('/api/test_clublog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clublogEmail: settings.clublogEmail,
          clublogPassword: settings.clublogPassword,
          myCallsign: settings.myCallsign
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTestStatus('success');
        setTestMessage(data.message || 'Connection successful!');
      } else {
        setTestStatus('error');
        setTestMessage(data.error || 'Connection failed');
        if (data.details) {
          console.error('Club Log Test Details:', data.details);
        }
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage('Failed to connect to server');
    }
  };

  const handleTestCallsign = async () => {
    if (!testCallsign) return;
    setIsTestingCallsign(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test_clublog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clublogEmail: settings.clublogEmail,
          clublogPassword: settings.clublogPassword,
          myCallsign: settings.myCallsign,
          targetCallsign: testCallsign
        })
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: 'Failed to connect to server' });
    } finally {
      setIsTestingCallsign(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-500" />
              Settings
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Spot Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Radio className="w-3 h-3" /> Spots
                </h3>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 ml-1">Spot Lifetime (minutes)</label>
                <input 
                  type="number" 
                  value={settings.spotLifetime}
                  onChange={e => setSettings({...settings, spotLifetime: parseInt(e.target.value) || 30})}
                  placeholder="30"
                  min="1"
                  max="1440"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 ml-1">Manual Callsigns (comma separated)</label>
                <input 
                  type="text" 
                  value={settings.manualCallsigns}
                  onChange={e => setSettings({...settings, manualCallsigns: e.target.value})}
                  placeholder="e.g. PJ2/K8ND, 3B8/G0XYZ"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <label htmlFor="hideConfirmed" className="text-sm font-medium text-zinc-300 cursor-pointer select-none">
                  Hide confirmed bands/modes from tiles
                </label>
                <button
                  type="button"
                  id="hideConfirmed"
                  onClick={() => setSettings({...settings, hideConfirmed: !settings.hideConfirmed})}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    settings.hideConfirmed ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                >
                  <motion.span
                    animate={{ x: settings.hideConfirmed ? 18 : 2 }}
                    className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <label htmlFor="onlyMyContinent" className="text-sm font-medium text-zinc-300 cursor-pointer select-none">
                  Show spots from my continent only
                </label>
                <button
                  type="button"
                  id="onlyMyContinent"
                  onClick={() => setSettings({...settings, onlyMyContinent: !settings.onlyMyContinent})}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    settings.onlyMyContinent ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                >
                  <motion.span
                    animate={{ x: settings.onlyMyContinent ? 18 : 2 }}
                    className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>
            </div>

            {/* Club Log Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Club Log
                </h3>
                <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-tighter">Local Storage</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 ml-1">My Callsign</label>
                  <input 
                    type="text" 
                    value={settings.myCallsign}
                    onChange={e => setSettings({...settings, myCallsign: e.target.value.toUpperCase()})}
                    placeholder="e.g. OK1CDJ"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 ml-1">Email</label>
                  <input 
                    type="email" 
                    value={settings.clublogEmail}
                    onChange={e => setSettings({...settings, clublogEmail: e.target.value})}
                    placeholder="Enter your Club Log email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 ml-1">Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={settings.clublogPassword}
                      onChange={e => setSettings({...settings, clublogPassword: e.target.value})}
                      placeholder="Enter your Club Log password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 pl-10 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                    <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                
                <div className="pt-2 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testCallsign}
                      onChange={(e) => setTestCallsign(e.target.value.toUpperCase())}
                      placeholder="Test Callsign (e.g. XX9W)"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                    />
                    <button
                      onClick={handleTestCallsign}
                      disabled={isTestingCallsign || !testCallsign}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white transition-all border border-white/10"
                    >
                      {isTestingCallsign ? '...' : 'Test'}
                    </button>
                  </div>

                  {testResult && (
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[9px] overflow-auto max-h-[150px] text-zinc-400">
                      <pre>{JSON.stringify(testResult, null, 2)}</pre>
                    </div>
                  )}

                  <button
                    onClick={handleTestConnection}
                    disabled={testStatus === 'loading'}
                    className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      testStatus === 'loading' ? 'bg-white/5 text-zinc-500 cursor-not-allowed' :
                      testStatus === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                      testStatus === 'error' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                      'bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {testStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> :
                     testStatus === 'success' ? <CheckCircle2 className="w-3 h-3" /> :
                     testStatus === 'error' ? <AlertCircle className="w-3 h-3" /> :
                     <Globe className="w-3 h-3" />}
                    {testStatus === 'idle' ? 'Test Credentials' : testMessage}
                  </button>
                  
                  {testStatus !== 'idle' && testStatus !== 'loading' && (
                    <p className={`mt-2 text-[10px] text-center ${
                      testStatus === 'success' ? 'text-emerald-500/70' : 'text-rose-500/70'
                    }`}>
                      {testStatus === 'success' ? 'Your credentials are valid.' : testMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-white/5 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-sm font-bold text-zinc-400 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-bold text-zinc-900 flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
