import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Parser from "rss-parser";
import net from "net";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function guessModeFromFreq(freqKhz: number): string {
  // Common FT8 frequencies
  if (Math.abs(freqKhz - 1840) < 1.5) return "FT8";
  if (Math.abs(freqKhz - 3573) < 1.5) return "FT8";
  if (Math.abs(freqKhz - 7074) < 1.5) return "FT8";
  if (Math.abs(freqKhz - 10136) < 1.5) return "FT8";
  if (Math.abs(freqKhz - 14074) < 1.5) return "FT8";
  if (Math.abs(freqKhz - 18100) < 1.5) return "FT8";
  if (Math.abs(freqKhz - 21074) < 1.5) return "FT8";
  if (Math.abs(freqKhz - 21090) < 1.5) return "FT8";
  if (Math.abs(freqKhz - 21095) < 1.5) return "FT8";
  if (Math.abs(freqKhz - 24915) < 1.5) return "FT8";
  if (Math.abs(freqKhz - 28074) < 1.5) return "FT8";
  if (Math.abs(freqKhz - 50313) < 1.5) return "FT8";

  // Common FT4 frequencies
  if (Math.abs(freqKhz - 3575) < 1) return "FT4";
  if (Math.abs(freqKhz - 7047.5) < 1) return "FT4";
  if (Math.abs(freqKhz - 10140) < 1) return "FT4";
  if (Math.abs(freqKhz - 14080) < 1) return "FT4";
  if (Math.abs(freqKhz - 18104) < 1) return "FT4";
  if (Math.abs(freqKhz - 21140) < 1) return "FT4";
  if (Math.abs(freqKhz - 24919) < 1) return "FT4";
  if (Math.abs(freqKhz - 28180) < 1) return "FT4";

  // RTTY segments
  if (freqKhz >= 7040 && freqKhz <= 7050) return "RTTY";
  if (freqKhz >= 14080 && freqKhz <= 14099) return "RTTY";
  if (freqKhz >= 21080 && freqKhz <= 21110) return "RTTY";
  if (freqKhz >= 28080 && freqKhz <= 28100) return "RTTY";

  // General band plan (IARU Region 1 based)
  if (freqKhz >= 1800 && freqKhz <= 1838) return "CW";
  if (freqKhz > 1840 && freqKhz <= 2000) return "SSB";

  if (freqKhz >= 3500 && freqKhz <= 3570) return "CW";
  if (freqKhz > 3600 && freqKhz <= 3800) return "SSB";

  if (freqKhz >= 7000 && freqKhz <= 7040) return "CW";
  if (freqKhz > 7050 && freqKhz <= 7200) return "SSB";

  if (freqKhz >= 10100 && freqKhz <= 10130) return "CW";
  if (freqKhz > 10130 && freqKhz <= 10150) return "FT8";

  if (freqKhz >= 14000 && freqKhz <= 14070) return "CW";
  if (freqKhz > 14100 && freqKhz <= 14350) return "SSB";

  if (freqKhz >= 18068 && freqKhz <= 18095) return "CW";
  if (freqKhz > 18110 && freqKhz <= 18168) return "SSB";

  if (freqKhz >= 21000 && freqKhz <= 21070) return "CW";
  if (freqKhz > 21150 && freqKhz <= 21450) return "SSB";

  if (freqKhz >= 24890 && freqKhz <= 24915) return "CW";
  if (freqKhz > 24930 && freqKhz <= 24990) return "SSB";

  if (freqKhz >= 28000 && freqKhz <= 28070) return "CW";
  if (freqKhz > 28225 && freqKhz <= 29700) return "SSB";

  if (freqKhz >= 50000 && freqKhz <= 50100) return "CW";
  if (freqKhz > 50100 && freqKhz <= 50500) return "SSB";

  return "CW";
}

function getBandFromFreq(freqKhz: number): string {
  if (freqKhz >= 1800 && freqKhz <= 2000) return "160m";
  if (freqKhz >= 3500 && freqKhz <= 4000) return "80m";
  if (freqKhz >= 5330 && freqKhz <= 5405) return "60m";
  if (freqKhz >= 7000 && freqKhz <= 7300) return "40m";
  if (freqKhz >= 10100 && freqKhz <= 10150) return "30m";
  if (freqKhz >= 14000 && freqKhz <= 14350) return "20m";
  if (freqKhz >= 18068 && freqKhz <= 18168) return "17m";
  if (freqKhz >= 21000 && freqKhz <= 21450) return "15m";
  if (freqKhz >= 24890 && freqKhz <= 24990) return "12m";
  if (freqKhz >= 28000 && freqKhz <= 29700) return "10m";
  if (freqKhz >= 50000 && freqKhz <= 54000) return "6m";
  if (freqKhz >= 70000 && freqKhz <= 70500) return "4m";
  if (freqKhz >= 144000 && freqKhz <= 148000) return "2m";
  if (freqKhz >= 430000 && freqKhz <= 440000) return "70cm";
  return "Unknown";
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const PORT = process.env.PORT || 3000;
  const rssParser = new Parser();

  // Robust fetch with retry and timeout
  async function fetchWithRetry(url: string, options: any = {}, retries = 3, backoff = 1000) {
    const timeout = options.timeout || 15000;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (retries > 0) {
        console.log(`Fetch failed for ${url}, retrying in ${backoff}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw error;
    }
  }

  // DX Cluster Logic
  const spotsCache: any[] = [];
  const MAX_SPOTS = 2000;
  let activeCallsigns: string[] = [];

  let currentSettings = {
    dxClusterHost: process.env.DX_CLUSTER_HOST || "ve7cc.net",
    dxClusterPort: parseInt(process.env.DX_CLUSTER_PORT || "23"),
    dxClusterCallsign: process.env.DX_CLUSTER_CALLSIGN || "GUEST",
    spotLifetime: 30,
    manualCallsigns: ""
  };

  console.log("Initial DX Cluster Settings:", {
    host: currentSettings.dxClusterHost,
    port: currentSettings.dxClusterPort,
    callsign: currentSettings.dxClusterCallsign
  });

  let clusterStatus = "Disconnected";

  wss.on("connection", (ws: any) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Send current status to new client
    ws.send(JSON.stringify({ type: "status", data: { status: clusterStatus, host: currentSettings.dxClusterHost } }));
    
    // Send last few spots if any
    if (spotsCache.length > 0) {
      // Send the most recent spot to initialize the status bar
      ws.send(JSON.stringify({ type: "spot", data: spotsCache[0] }));
    }
  });

  // Keep-alive interval for WebSockets
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  app.use(express.json());

  async function updateActiveCallsigns() {
    try {
      console.log("Updating active callsigns list...");
      const feed = await rssParser.parseURL("http://www.ng3k.com/adxo.xml");
      const calls: string[] = [];
      const now_date = new Date();

      for (const item of feed.items) {
        const title = item.title || "";
        const parts = title.split(':');
        if (parts.length < 2) continue;

        const rest = parts[1].trim();
        const subParts = rest.split('--').map(p => p.trim());
        let callsign = subParts[1] || "";
        
        if (!callsign) continue;

        // Basic date check to see if it's active
        let isActive = false;
        const dates = subParts[0] || "";
        const yearMatch = dates.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1]) : now_date.getFullYear();
        
        const singleMonthRange = dates.match(/([A-Z][a-z]{2})\s+(\d+)-(\d+)/i);
        if (singleMonthRange) {
          const monthStr = singleMonthRange[1];
          const startDay = parseInt(singleMonthRange[2]);
          const endDay = parseInt(singleMonthRange[3]);
          const startDate = new Date(`${monthStr} ${startDay}, ${year}`);
          const endDate = new Date(`${monthStr} ${endDay}, ${year}`);
          endDate.setHours(23, 59, 59);
          if (now_date >= startDate && now_date <= endDate) isActive = true;
        }
        
        const multiMonthRange = dates.match(/([A-Z][a-z]{2})\s+(\d+)-([A-Z][a-z]{2})\s+(\d+)/i);
        if (multiMonthRange) {
          const startMonth = multiMonthRange[1];
          const startDay = parseInt(multiMonthRange[2]);
          const endMonth = multiMonthRange[3];
          const endDay = parseInt(multiMonthRange[4]);
          const startDate = new Date(`${startMonth} ${startDay}, ${year}`);
          const endDate = new Date(`${endMonth} ${endDay}, ${year}`);
          endDate.setHours(23, 59, 59);
          if (now_date >= startDate && now_date <= endDate) isActive = true;
        }

        if (isActive) {
          calls.push(callsign.toUpperCase());
        }
      }

      // Add manual callsigns
      if (currentSettings.manualCallsigns) {
        const manual = currentSettings.manualCallsigns.split(",").map(c => c.trim().toUpperCase()).filter(c => c.length > 0);
        calls.push(...manual);
      }

      activeCallsigns = Array.from(new Set(calls));
      console.log(`Found ${activeCallsigns.length} active expedition callsigns.`);
      broadcastLog(`Found ${activeCallsigns.length} active expedition callsigns.`);
      console.log(`Updated active callsigns: ${activeCallsigns.length} found.`);
    } catch (err) {
      console.error("Failed to update active callsigns:", err);
    }
  }

  // Update callsigns every hour
  setInterval(updateActiveCallsigns, 60 * 60 * 1000);
  updateActiveCallsigns(); // Initial update

  let clusterSocket: net.Socket | null = null;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let isConnecting = false;
  let isLoggedIn = false;
  let hasSentConfig = false;

  function broadcastSpot(spot: any) {
    const message = JSON.stringify({ type: "spot", data: spot });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  function broadcastStatus() {
    const statusMsg = JSON.stringify({ 
      type: "status", 
      data: { 
        status: clusterStatus, 
        host: currentSettings.dxClusterHost 
      } 
    });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(statusMsg);
      }
    });
  }

  function broadcastLog(message: string) {
    const msg = JSON.stringify({ type: "log", data: message });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }

  function connectToCluster() {
    if (isConnecting) {
      clusterStatus = "Connecting";
      broadcastStatus();
      return;
    }
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    if (clusterSocket) {
      clusterSocket.removeAllListeners();
      clusterSocket.destroy();
      clusterSocket = null;
    }

    isConnecting = true;
    isLoggedIn = false;
    hasSentConfig = false;
    clusterStatus = "Connecting";
    broadcastStatus();

    const logMsg = `Connecting to DX Cluster ${currentSettings.dxClusterHost}:${currentSettings.dxClusterPort}...`;
    console.log(logMsg);
    broadcastLog(logMsg);

    clusterSocket = net.connect(currentSettings.dxClusterPort, currentSettings.dxClusterHost, () => {
      isConnecting = false;
      clusterStatus = "Connected";
      broadcastStatus();
      const connectedMsg = "Connected to DX Cluster";
      console.log(connectedMsg);
      broadcastLog(connectedMsg);
    });

    // Set a connection timeout
    clusterSocket.setTimeout(30000); // 30 seconds timeout
    clusterSocket.on("timeout", () => {
      console.log("Cluster connection timed out, destroying socket...");
      broadcastLog("Cluster connection timed out, retrying...");
      clusterSocket?.destroy();
    });

    clusterSocket.on("data", (data) => {
      const msg = data.toString();
      const msgLower = msg.toLowerCase();
      console.log("Cluster Data:", msg.trim()); // Log incoming data for debugging
      broadcastLog(`Cluster Data: ${msg.trim()}`);

      // Login logic
      if (!hasSentConfig && (msgLower.includes("login:") || msgLower.includes("callsign:") || msgLower.includes("enter your call:"))) {
        console.log(`Sending callsign: ${currentSettings.dxClusterCallsign}`);
        broadcastLog(`Sending callsign: ${currentSettings.dxClusterCallsign}`);
        // Small delay to ensure the cluster is ready to receive
        setTimeout(() => {
          if (clusterSocket && !clusterSocket.destroyed) {
            clusterSocket.write(currentSettings.dxClusterCallsign + "\r\n");
          }
        }, 500);
        isLoggedIn = true;
        // Don't return, let it check for config trigger in same packet
      } 
      
      // Handle password prompt if it appears (rare for guest)
      if (msgLower.includes("password:")) {
        console.log("Password prompt detected, sending empty password...");
        broadcastLog("Password prompt detected, sending empty password...");
        clusterSocket?.write("\r\n");
        return;
      }

      // Config logic - trigger on welcome message or prompt after login
      if (isLoggedIn && !hasSentConfig && (msg.includes("Welcome") || msg.includes("logged in") || msg.includes("CCC >") || msg.includes(currentSettings.dxClusterCallsign) || msg.includes("DX de"))) {
        console.log("Login detected, sending configuration commands...");
        broadcastLog("Login detected, sending configuration commands...");
        hasSentConfig = true;
        
        const commands = (process.env.DX_CLUSTER_COMMANDS || "SET/SKIMMER,SET/FT8,SET/FT4").split(",");
        
        commands.forEach((cmd, index) => {
          setTimeout(() => {
            const trimmedCmd = cmd.trim();
            console.log(`Sending: ${trimmedCmd}`);
            broadcastLog(`Sending: ${trimmedCmd}`);
            clusterSocket?.write(`${trimmedCmd}\r\n`);
          }, (index + 1) * 1000);
        });
      }

      const lines = msg.split("\n");
      for (const line of lines) {
        // More robust regex for various cluster formats including skimmers
        // Example: DX de K1TTT-#:    14025.0  K1ABC          CW 20 dB 25 WPM CQ             1234Z
        if (line.includes("DX de")) {
          const match = line.match(/DX de\s+([\w\-\#]+):\s+([\d\.]+)\s+([\w\/]+)\s+(.*?)\s+(\d{4}Z)/i);
          if (match) {
            const spotter = match[1];
            const freq = match[2];
            const dxCall = match[3];
            const comment = match[4].trim();
            const time = match[5];
            const isSkimmer = spotter.includes("#") || comment.includes("dB") || comment.includes("WPM");

            // Try to extract mode from comment if not obvious
            let mode = "";
            if (comment.toUpperCase().includes("FT8")) mode = "FT8";
            else if (comment.toUpperCase().includes("FT4")) mode = "FT4";
            else if (comment.toUpperCase().includes("RTTY")) mode = "RTTY";
            else if (comment.toUpperCase().includes("PSK")) mode = "PSK";
            else if (comment.toUpperCase().includes("SSB") || comment.toUpperCase().includes("USB") || comment.toUpperCase().includes("LSB")) mode = "SSB";
            else {
              // Try to get the first word of the comment as mode
              const firstWord = comment.split(/\s+/)[0];
              if (["CW", "FT8", "FT4", "SSB", "RTTY", "PSK", "FM", "AM"].includes(firstWord.toUpperCase())) {
                mode = firstWord.toUpperCase();
              }
            }

            // If mode still not determined, guess from frequency
            if (!mode) {
              mode = guessModeFromFreq(parseFloat(freq));
            }

            const spot = {
              id: Date.now() + Math.random().toString(36).substr(2, 9),
              spotter,
              freq,
              dxCall,
              mode,
              comment,
              time,
              isSkimmer,
              timestamp: new Date().toISOString()
            };

            // Only cache and broadcast if it matches an active expedition
            const isInteresting = activeCallsigns.some(call => 
              dxCall.toUpperCase() === call || 
              dxCall.toUpperCase().startsWith(call + "/") || 
              dxCall.toUpperCase().endsWith("/" + call)
            );

            if (isInteresting) {
              console.log(`Interesting spot found: ${dxCall} on ${freq}`);
              spotsCache.unshift(spot);
              if (spotsCache.length > MAX_SPOTS) spotsCache.pop();
              broadcastSpot(spot);
            }
          }
        }
      }
    });

    clusterSocket.on("error", (err) => {
      isConnecting = false;
      clusterStatus = "Disconnected";
      broadcastStatus();
      const errMsg = `Cluster socket error: ${err.message}`;
      console.error(errMsg);
      broadcastLog(errMsg);
      clusterSocket?.destroy();
      clusterSocket = null;
      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(connectToCluster, 5000);
      }
    });

    clusterSocket.on("close", () => {
      isConnecting = false;
      clusterStatus = "Disconnected";
      broadcastStatus();
      const closeMsg = "Cluster connection closed, reconnecting...";
      console.log(closeMsg);
      broadcastLog(closeMsg);
      clusterSocket = null;
      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(connectToCluster, 5000);
      }
    });
  }

  connectToCluster();

  // API Routes
  app.post("/api/settings", (req, res) => {
    const { spotLifetime, manualCallsigns } = req.body;
    
    currentSettings.spotLifetime = parseInt(spotLifetime) || currentSettings.spotLifetime;
    currentSettings.manualCallsigns = manualCallsigns !== undefined ? manualCallsigns : currentSettings.manualCallsigns;

    console.log("Settings updated");
    updateActiveCallsigns(); // Refresh the list immediately
    broadcastStatus();
    
    res.json({ status: "ok", settings: currentSettings });
  });

  app.get("/api/spots", (req, res) => {
    res.json(spotsCache);
  });
  
  // Cache for expeditions
  let expeditionsCache: any[] = [];
  let lastFetchTime = 0;
  const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  // Fetch DX Expeditions from NG3K RSS
  app.get("/api/expeditions", async (req, res) => {
    const now = Date.now();
    
    if (expeditionsCache.length > 0 && (now - lastFetchTime < CACHE_DURATION)) {
      return res.json(expeditionsCache);
    }

    try {
      console.log("Fetching NG3K RSS feed...");
      const feed = await rssParser.parseURL("http://www.ng3k.com/adxo.xml");
      
      const parsedExpeditions: any[] = [];
      let idCounter = 1;

      for (const item of feed.items) {
        try {
          const title = item.title || "";
          const description = item.content || item.contentSnippet || "";
          
          // Title format: "Location: Dates -- Callsign -- QSL via: ..."
          // Example: "Curacao: Jan 22-Mar 31, 2026 -- PJ2 -- QSL via: LoTW"
          const parts = title.split(':');
          if (parts.length < 2) continue;

          const location = parts[0].trim();
          const rest = parts[1].trim();
          const subParts = rest.split('--').map(p => p.trim());
          
          let dates = subParts[0] || "Unknown Dates";
          let callsign = subParts[1] || "";

          if (!callsign) continue;

          // Handle short callsigns using description
          // Example: "By UR9IDX as FH/UR9IDX"
          if (callsign.length < 4 || callsign.includes('/')) {
            const asMatch = description.match(/ as\s+([A-Z0-9\/]+)/i);
            if (asMatch) {
              callsign = asMatch[1].trim();
            }
          }

          // If it's still just a prefix (like PJ2), try to find a better one or keep it
          // But usually 'as' handles it.

          const websiteUrl = item.link;

          // Determine status
          const now_date = new Date();
          let status: 'Active' | 'Upcoming' = "Upcoming";

          try {
            // Dates format: "Jan 22-Mar 31, 2026" or "Feb 26-Mar 20, 2026"
            const yearMatch = dates.match(/(\d{4})/);
            const year = yearMatch ? parseInt(yearMatch[1]) : now_date.getFullYear();
            
            // Handle format: "Mar 3-20, 2026"
            const singleMonthRange = dates.match(/([A-Z][a-z]{2})\s+(\d+)-(\d+)/i);
            if (singleMonthRange) {
              const monthStr = singleMonthRange[1];
              const startDay = parseInt(singleMonthRange[2]);
              const endDay = parseInt(singleMonthRange[3]);
              
              const startDate = new Date(`${monthStr} ${startDay}, ${year}`);
              const endDate = new Date(`${monthStr} ${endDay}, ${year}`);
              endDate.setHours(23, 59, 59);

              if (now_date >= startDate && now_date <= endDate) {
                status = "Active";
              }
            }
            
            // Handle format: "Feb 26-Mar 20, 2026"
            const multiMonthRange = dates.match(/([A-Z][a-z]{2})\s+(\d+)-([A-Z][a-z]{2})\s+(\d+)/i);
            if (multiMonthRange) {
              const startMonth = multiMonthRange[1];
              const startDay = parseInt(multiMonthRange[2]);
              const endMonth = multiMonthRange[3];
              const endDay = parseInt(multiMonthRange[4]);
              
              const startDate = new Date(`${startMonth} ${startDay}, ${year}`);
              const endDate = new Date(`${endMonth} ${endDay}, ${year}`);
              endDate.setHours(23, 59, 59);

              if (now_date >= startDate && now_date <= endDate) {
                status = "Active";
              }
            }
          } catch (dateErr) {
            // Ignore date parsing errors
          }

          parsedExpeditions.push({
            id: String(idCounter++),
            callsign,
            location,
            dates,
            status,
            websiteUrl
          });
        } catch (e) {
          console.error("Error parsing RSS item:", e);
        }
      }

      if (parsedExpeditions.length > 0) {
        expeditionsCache = parsedExpeditions;
        lastFetchTime = now;
        res.json(parsedExpeditions);
      } else {
        throw new Error("No expeditions found in RSS feed");
      }
    } catch (error) {
      console.error("Failed to fetch NG3K RSS:", error);
      res.status(500).json({ error: "Failed to fetch expeditions" });
    }
  });

  // Caching for Club Log
  const dxccCache = new Map<string, { id: string, name: string, timestamp: number }>();
  const statusCache = new Map<string, { data: any, timestamp: number }>();
  const dxccChartCaches = new Map<string, { data: any, timestamp: number }>();
  const dxccChartPromises = new Map<string, Promise<any>>();
  const DXCC_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  const STATUS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  const CHART_CACHE_TTL = 60 * 60 * 1000; // 1 hour

  async function getDxccChart(email: string, password: string, myCall: string) {
    const now = Date.now();
    const cached = dxccChartCaches.get(myCall);
    if (cached && (now - cached.timestamp < CHART_CACHE_TTL)) {
      return cached.data;
    }

    // Deduplicate concurrent requests
    if (dxccChartPromises.has(myCall)) {
      return dxccChartPromises.get(myCall);
    }

    const fetchPromise = (async () => {
      try {
        const clublogApiKey = process.env.CLUBLOG_API_KEY;
        if (!clublogApiKey) throw new Error("Club Log API Key missing");

        console.log(`Fetching Club Log DXCC charts for CW(1), PH(2), DA(3) for ${myCall}...`);
        
        const modes = [
          { id: 1, name: 'CW' },
          { id: 2, name: 'PH' },
          { id: 3, name: 'DA' }
        ];

        const normalizedChart: any = {};

        // Fetch all 3 modes in parallel
        const fetchResults = await Promise.all(modes.map(async (m) => {
          const url = `https://clublog.org/json_dxccchart.php?api=${encodeURIComponent(clublogApiKey)}&call=${encodeURIComponent(myCall)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&mode=${m.id}`;
          const res = await fetchWithRetry(url);
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Club Log Chart API (mode=${m.id}) failed: ${res.status} ${text}`);
          }
          const chart = await res.json();
          return { name: m.name, chart };
        }));

        fetchResults.forEach(({ name, chart }) => {
          if (chart && typeof chart === 'object') {
            Object.entries(chart).forEach(([dxccId, dxccData]: [string, any]) => {
              if (!normalizedChart[dxccId]) normalizedChart[dxccId] = {};
              if (dxccData && typeof dxccData === 'object') {
                Object.entries(dxccData).forEach(([band, status]: [string, any]) => {
                  // Normalize band name: "20" -> "20m", "20m" -> "20m"
                  let normalizedBand = band.toLowerCase();
                  if (!normalizedBand.endsWith('m') && !isNaN(Number(normalizedBand))) {
                    normalizedBand = `${normalizedBand}m`;
                  }
                  
                  if (!normalizedChart[dxccId][normalizedBand]) {
                    normalizedChart[dxccId][normalizedBand] = {};
                  }

                  // Map status: 1=Confirmed, 2=Worked, 3=Verified
                  // We store it as {w: boolean, c: boolean} for consistency
                  const worked = status === 1 || status === 2 || status === 3;
                  const confirmed = status === 1 || status === 3;
                  
                  normalizedChart[dxccId][normalizedBand][name] = { w: worked ? 1 : 0, c: confirmed ? 1 : 0 };
                });
              }
            });
          }
        });

        console.log(`Successfully fetched and merged charts for ${myCall}. Total DXCCs: ${Object.keys(normalizedChart).length}`);
        
        dxccChartCaches.set(myCall, { data: normalizedChart, timestamp: Date.now() });
        return normalizedChart;
      } catch (error) {
        console.error(`Error fetching DXCC chart for ${myCall}:`, error);
        dxccChartPromises.delete(myCall); // Clear on error so next request can retry
        throw error;
      } finally {
        dxccChartPromises.delete(myCall);
      }
    })();

    dxccChartPromises.set(myCall, fetchPromise);
    return fetchPromise;
  }

  // Proxy for Club Log API
  app.post("/api/private_lookup", async (req, res) => {
    const { 
      clublogEmail, 
      clublogPassword, 
      myCallsign, 
      callsign, 
      band, 
      mode,
      freq
    } = req.body;
    
    const clublogApiKey = process.env.CLUBLOG_API_KEY;

    if (!clublogApiKey) {
      return res.status(500).json({ error: "Server configuration error: Club Log API Key missing" });
    }

    if (!clublogEmail || !clublogPassword || !myCallsign) {
      return res.status(401).json({ error: "Club Log credentials missing" });
    }

    if (!callsign) {
      return res.status(400).json({ error: "Missing callsign" });
    }

    // Check status cache first
    const statusCacheKey = `${myCallsign}-${callsign}-${band || 'ALL'}-${mode || 'ALL'}`;
    const cachedStatus = statusCache.get(statusCacheKey);
    if (cachedStatus && (Date.now() - cachedStatus.timestamp < STATUS_CACHE_TTL)) {
      return res.json(cachedStatus.data);
    }

    try {
      // 1. Get DXCC ID for the callsign (with cache)
      let dxccId: string;
      let dxccName: string = "Unknown";
      const cachedDxcc = dxccCache.get(callsign);
      
      if (cachedDxcc && (Date.now() - cachedDxcc.timestamp < DXCC_CACHE_TTL)) {
        dxccId = cachedDxcc.id;
        dxccName = cachedDxcc.name || "Unknown";
      } else {
        const dxccRes = await fetchWithRetry(`https://clublog.org/dxcc?call=${encodeURIComponent(callsign)}&api=${encodeURIComponent(clublogApiKey)}&full=1`);
        const dxccText = await dxccRes.text();
        
        try {
          const data = JSON.parse(dxccText);
          dxccId = data.DXCC?.toString() || "";
          dxccName = data.Name || "Unknown";
          if (dxccId) {
            dxccCache.set(callsign, { id: dxccId, name: dxccName, timestamp: Date.now() });
          }
        } catch (e) {
          // Fallback to old behavior if not JSON
          if (dxccText && dxccText.includes(',')) {
            const parts = dxccText.split(',');
            dxccId = parts[0];
            dxccName = parts[1] || "Unknown";
            dxccCache.set(callsign, { id: dxccId, name: dxccName, timestamp: Date.now() });
          } else if (dxccText && !isNaN(Number(dxccText))) {
            dxccId = dxccText;
            dxccCache.set(callsign, { id: dxccId, name: "Unknown", timestamp: Date.now() });
          } else {
            dxccId = "";
          }
        }
      }
      
      if (!dxccId || isNaN(Number(dxccId))) {
        return res.status(404).json({ error: "Could not identify DXCC for callsign" });
      }

      // 2. Get the user's DXCC chart
      const chart = await getDxccChart(clublogEmail, clublogPassword, myCallsign);
      
      const dxccData = chart[dxccId];
      
      let dxccWorked = false;
      let dxccConfirmed = false;
      let slotWorked = false;
      let slotConfirmed = false;

      if (dxccData) {
        // Check if worked on ANY band
        for (const b in dxccData) {
          const bandData = dxccData[b];
          if (bandData && typeof bandData === 'object') {
            for (const m in bandData) {
              if (bandData[m].w > 0) dxccWorked = true;
              if (bandData[m].c > 0) dxccConfirmed = true;
            }
          }
        }

        // Check specific band
        const targetBand = band || (freq ? getBandFromFreq(parseFloat(freq)) : null);
        if (targetBand && dxccData[targetBand]) {
          const bandData = dxccData[targetBand];
          
          if (typeof bandData === 'object') {
            // Merged structure (modes)
            let clublogMode = "";
            if (mode === "CW") clublogMode = "CW";
            else if (mode === "SSB" || mode === "USB" || mode === "LSB") clublogMode = "PH";
            else clublogMode = "DA"; // DIGI/FT8/FT4/etc.

            if (bandData[clublogMode]) {
              slotWorked = bandData[clublogMode].w > 0;
              slotConfirmed = bandData[clublogMode].c > 0;
            } else {
              // Check if worked on ANY mode on this band if specific mode not found
              for (const m in bandData) {
                if (bandData[m].w > 0) slotWorked = true;
                if (bandData[m].c > 0) slotConfirmed = true;
              }
            }
          }
        }
      }

      const responseData = {
        dxccId,
        dxccName,
        dxccWorked,
        dxccConfirmed,
        worked: slotWorked, // Map slot status to worked/confirmed for compatibility
        confirmed: slotConfirmed,
        isNewDxcc: !dxccWorked,
        isNewSlot: dxccWorked && !slotWorked,
        bandMap: dxccData || {} // Include the full band map from Club Log
      };

      console.log(`Club Log Lookup for ${callsign}: DXCC=${dxccId}, Worked=${dxccWorked}, Confirmed=${dxccConfirmed}, SlotWorked=${slotWorked}, SlotConfirmed=${slotConfirmed}`);
      if (dxccData) {
        console.log(`BandMap for DXCC ${dxccId} found with ${Object.keys(dxccData).length} bands. TargetBand=${band || (freq ? getBandFromFreq(parseFloat(freq)) : 'N/A')}`);
        // Log a sample of the data to see the structure
        const sampleBand = Object.keys(dxccData)[0];
        console.log(`Sample Band Data (${sampleBand}):`, JSON.stringify(dxccData[sampleBand]));
      } else {
        console.log(`No BandMap data found in chart for DXCC ${dxccId}. Chart size: ${Object.keys(chart).length}`);
      }

      // Cache the result
      statusCache.set(statusCacheKey, { data: responseData, timestamp: Date.now() });

      res.json(responseData);
    } catch (error) {
      console.error("Club Log lookup failed:", error);
      res.status(500).json({ 
        error: "Club Log lookup failed",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint to get the full DXCC chart
  app.post("/api/dxcc_chart", async (req, res) => {
    const { clublogEmail, clublogPassword, myCallsign } = req.body;
    
    if (!clublogEmail || !clublogPassword || !myCallsign) {
      return res.status(401).json({ error: "Club Log credentials missing" });
    }

    try {
      const chart = await getDxccChart(clublogEmail, clublogPassword, myCallsign);
      res.json(chart);
    } catch (error) {
      console.error("Failed to fetch DXCC chart:", error);
      res.status(500).json({ error: "Failed to fetch DXCC chart" });
    }
  });

  // Test endpoint for Club Log data
  app.post("/api/test_clublog", async (req, res) => {
    const { clublogEmail, clublogPassword, myCallsign, targetCallsign } = req.body;
    const clublogApiKey = process.env.CLUBLOG_API_KEY;

    const testCall = targetCallsign || myCallsign;

    if (!clublogApiKey || !clublogEmail || !clublogPassword || !myCallsign || !testCall) {
      const missing = [];
      if (!clublogApiKey) missing.push("CLUBLOG_API_KEY (Server Env)");
      if (!clublogEmail) missing.push("Email");
      if (!clublogPassword) missing.push("Password");
      if (!myCallsign) missing.push("My Callsign");
      if (!testCall) missing.push("Target Callsign");
      
      return res.status(400).json({ 
        error: "Missing parameters", 
        details: `Missing: ${missing.join(", ")}`,
        received: { email: !!clublogEmail, pass: !!clublogPassword, myCall: !!myCallsign, target: !!testCall } 
      });
    }

    try {
      console.log(`Testing Club Log connection for ${myCallsign} using call ${testCall}...`);
      // Get DXCC ID
      const dxccRes = await fetchWithRetry(`https://clublog.org/dxcc?call=${encodeURIComponent(testCall)}&api=${encodeURIComponent(clublogApiKey)}&full=1`);
      const dxccText = await dxccRes.text();
      console.log(`DXCC lookup for ${testCall} returned: ${dxccText}`);
      
      let dxccId = "";
      let dxccName = "Unknown";
      
      try {
        const data = JSON.parse(dxccText);
        dxccId = data.DXCC?.toString() || "";
        dxccName = data.Name || "Unknown";
      } catch (e) {
        if (dxccText && dxccText.includes(',')) {
          const parts = dxccText.split(',');
          dxccId = parts[0];
          dxccName = parts[1] || "Unknown";
        } else {
          dxccId = dxccText.split(',')[0] || "";
        }
      }

      if (!dxccId || isNaN(Number(dxccId))) {
        throw new Error(`Could not identify DXCC for callsign ${testCall}. Response: ${dxccText}`);
      }

      // Get Chart
      const chart = await getDxccChart(clublogEmail, clublogPassword, myCallsign);
      const dxccData = chart[dxccId];

      res.json({
        message: "Connection successful!",
        targetCallsign: testCall,
        dxccId,
        dxccName,
        dxccData: dxccData || "No data found for this DXCC in your chart",
        rawChartSize: Object.keys(chart).length
      });
    } catch (error) {
      console.error("Club Log test failed:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Test failed" });
    }
  });

  // Test Club Log connection (renamed to avoid duplicate)
  app.post("/api/test_clublog_connection", async (req, res) => {
    const { clublogEmail, clublogPassword, myCallsign } = req.body;
    const clublogApiKey = process.env.CLUBLOG_API_KEY;

    if (!clublogApiKey) {
      return res.status(500).json({ error: "Club Log API Key missing in server environment" });
    }

    if (!clublogEmail || !clublogPassword || !myCallsign) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    try {
      // Use json_dxccchart.php to test credentials as it requires them and is a valid endpoint
      const testUrl = `https://clublog.org/json_dxccchart.php?api=${encodeURIComponent(clublogApiKey)}&call=${encodeURIComponent(myCallsign)}&email=${encodeURIComponent(clublogEmail)}&password=${encodeURIComponent(clublogPassword)}&mode=0`;
      
      console.log(`Testing Club Log connection for ${myCallsign} (${clublogEmail})...`);
      const response = await fetchWithRetry(testUrl);
      
      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          // If it's a valid JSON object (the chart), credentials are good
          if (typeof data === 'object' && data !== null) {
            console.log("Club Log connection successful (received valid JSON chart)");
            res.json({ status: "ok", message: "Connection successful!" });
          } else {
            res.status(401).json({ error: "Invalid response from Club Log. Check your credentials." });
          }
        } catch (e) {
          // If it's not JSON, it might be an error message in plain text
          if (text.toLowerCase().includes("invalid") || text.toLowerCase().includes("error") || text.toLowerCase().includes("failed")) {
            res.status(401).json({ error: text.substring(0, 200) });
          } else {
            res.status(401).json({ error: "Invalid response from Club Log. Check your credentials." });
          }
        }
      } else {
        const text = await response.text();
        console.error(`Club Log test failed with status ${response.status}: ${text}`);
        res.status(response.status).json({ error: text || "Failed to connect to Club Log" });
      }
    } catch (error) {
      console.error("Club Log test failed with exception:", error);
      res.status(500).json({ 
        error: "Failed to connect to Club Log",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.on('upgrade', (request, socket, head) => {
    console.log(`Upgrade request for ${request.url}`);
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
