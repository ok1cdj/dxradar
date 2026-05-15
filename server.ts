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
  // Prefix to Continent mapping (simplified)
  const PREFIX_TO_CONTINENT: { [key: string]: string } = {
    '1A': 'EU', '1S': 'AS', '3A': 'EU', '3B': 'AF', '3C': 'AF', '3D': 'AF', '3V': 'AF', '3W': 'AS', '3X': 'AF', '3Y': 'AN',
    '4A': 'NA', '4B': 'NA', '4C': 'NA', '4D': 'AS', '4E': 'AS', '4F': 'AS', '4G': 'AS', '4H': 'AS', '4I': 'AS', '4J': 'AS',
    '4K': 'AS', '4L': 'AS', '4M': 'SA', '4N': 'EU', '4O': 'EU', '4P': 'AS', '4Q': 'AS', '4R': 'AS', '4S': 'AS', '4T': 'SA',
    '4U': 'EU', '4V': 'NA', '4W': 'OC', '4X': 'AS', '4Y': 'EU', '4Z': 'AS', '5A': 'AF', '5B': 'AS', '5C': 'AF', '5D': 'AF',
    '5E': 'AF', '5F': 'AF', '5G': 'AF', '5H': 'AF', '5I': 'AF', '5J': 'SA', '5K': 'SA', '5L': 'AF', '5M': 'AF', '5N': 'AF',
    '5O': 'AF', '5P': 'EU', '5Q': 'EU', '5R': 'AF', '5S': 'AF', '5T': 'AF', '5U': 'AF', '5V': 'AF', '5W': 'OC', '5X': 'AF',
    '5Y': 'AF', '5Z': 'AF', '6A': 'AF', '6B': 'AF', '6C': 'AF', '6D': 'NA', '6E': 'NA', '6F': 'NA', '6G': 'NA', '6H': 'NA',
    '6I': 'NA', '6J': 'NA', '6K': 'AS', '6L': 'AS', '6M': 'AS', '6N': 'AS', '6O': 'AF', '6P': 'AS', '6Q': 'AS', '6R': 'AS',
    '6S': 'AS', '6T': 'AF', '6U': 'AF', '6V': 'AF', '6W': 'AF', '6X': 'AF', '6Y': 'NA', '6Z': 'AF', '7A': 'AS', '7B': 'AS',
    '7C': 'AS', '7D': 'AS', '7E': 'AS', '7F': 'AS', '7G': 'AS', '7H': 'AS', '7I': 'AS', '7J': 'AS', '7K': 'AS', '7L': 'AS',
    '7M': 'AS', '7N': 'AS', '7O': 'AS', '7P': 'AF', '7Q': 'AF', '7R': 'AF', '7S': 'EU', '7T': 'AF', '7U': 'AF', '7V': 'AF',
    '7W': 'AF', '7X': 'AF', '7Y': 'AF', '7Z': 'AS', '8A': 'OC', '8B': 'OC', '8C': 'OC', '8D': 'OC', '8E': 'OC', '8F': 'OC',
    '8G': 'OC', '8H': 'OC', '8I': 'OC', '8J': 'AS', '8K': 'AS', '8L': 'AS', '8M': 'AS', '8N': 'AS', '8O': 'AS', '8P': 'NA',
    '8Q': 'AS', '8R': 'SA', '8S': 'EU', '8T': 'AS', '8U': 'AS', '8V': 'AS', '8W': 'AS', '8X': 'AS', '8Y': 'AN', '8Z': 'AS',
    '9A': 'EU', '9B': 'AS', '9C': 'AS', '9D': 'AS', '9E': 'AF', '9F': 'AF', '9G': 'AF', '9H': 'EU', '9I': 'AF', '9J': 'AF',
    '9K': 'AS', '9L': 'AF', '9M': 'AS', '9N': 'AS', '9O': 'AF', '9P': 'AF', '9Q': 'AF', '9R': 'AF', '9S': 'AF', '9T': 'AF',
    '9U': 'AF', '9V': 'AS', '9W': 'AS', '9X': 'AF', '9Y': 'SA', '9Z': 'SA', 'A2': 'AF', 'A3': 'OC', 'A4': 'AS', 'A5': 'AS',
    'A6': 'AS', 'A7': 'AS', 'A9': 'AS', 'B': 'AS', 'C2': 'OC', 'C3': 'EU', 'C4': 'AS', 'C5': 'AF', 'C6': 'NA', 'C9': 'AF',
    'CA': 'SA', 'CB': 'SA', 'CC': 'SA', 'CD': 'SA', 'CE': 'SA', 'CF': 'NA', 'CG': 'NA', 'CH': 'NA', 'CI': 'NA', 'CJ': 'NA',
    'CK': 'NA', 'CL': 'NA', 'CM': 'NA', 'CN': 'AF', 'CO': 'NA', 'CP': 'SA', 'CQ': 'EU', 'CR': 'EU', 'CS': 'EU', 'CT': 'EU',
    'CU': 'EU', 'CV': 'SA', 'CW': 'SA', 'CX': 'SA', 'CY': 'NA', 'CZ': 'NA', 'D2': 'AF', 'D3': 'AF', 'D4': 'AF', 'D6': 'AF',
    'DA': 'EU', 'DB': 'EU', 'DC': 'EU', 'DD': 'EU', 'DE': 'EU', 'DF': 'EU', 'DG': 'EU', 'DH': 'EU', 'DI': 'EU', 'DJ': 'EU',
    'DK': 'EU', 'DL': 'EU', 'DM': 'EU', 'DN': 'EU', 'DO': 'EU', 'DP': 'EU', 'DQ': 'EU', 'DR': 'EU', 'DS': 'AS', 'DT': 'AS',
    'DU': 'OC', 'DV': 'OC', 'DW': 'OC', 'DX': 'OC', 'DY': 'OC', 'DZ': 'OC', 'E2': 'AS', 'E3': 'AF', 'E4': 'AS', 'E5': 'OC',
    'E7': 'EU', 'EA': 'EU', 'EB': 'EU', 'EC': 'EU', 'ED': 'EU', 'EE': 'EU', 'EF': 'EU', 'EG': 'EU', 'EH': 'EU', 'EI': 'EU',
    'EJ': 'EU', 'EK': 'AS', 'EL': 'AF', 'EM': 'EU', 'EN': 'EU', 'EO': 'EU', 'EP': 'AS', 'EQ': 'AS', 'ER': 'EU', 'ES': 'EU',
    'ET': 'AF', 'EU': 'EU', 'EV': 'EU', 'EW': 'EU', 'EX': 'AS', 'EY': 'AS', 'EZ': 'AS', 'F': 'EU', 'G': 'EU', 'H2': 'AS',
    'H3': 'NA', 'H4': 'OC', 'H6': 'NA', 'H7': 'NA', 'H8': 'NA', 'H9': 'NA', 'HA': 'EU', 'HB': 'EU', 'HC': 'SA', 'HD': 'SA',
    'HE': 'EU', 'HF': 'EU', 'HG': 'EU', 'HH': 'NA', 'HI': 'NA', 'HJ': 'SA', 'HK': 'SA', 'HL': 'AS', 'HM': 'AS', 'HN': 'AS',
    'HO': 'NA', 'HP': 'NA', 'HQ': 'NA', 'HR': 'NA', 'HS': 'AS', 'HT': 'NA', 'HU': 'NA', 'HV': 'EU', 'HW': 'EU', 'HX': 'EU',
    'HY': 'EU', 'HZ': 'AS', 'I': 'EU', 'J2': 'AF', 'J3': 'NA', 'J4': 'EU', 'J5': 'AF', 'J6': 'NA', 'J7': 'NA', 'J8': 'NA',
    'JA': 'AS', 'JB': 'AS', 'JC': 'AS', 'JD': 'AS', 'JE': 'AS', 'JF': 'AS', 'JG': 'AS', 'JH': 'AS', 'JI': 'AS', 'JJ': 'AS',
    'JK': 'AS', 'JL': 'AS', 'JM': 'AS', 'JN': 'AS', 'JO': 'AS', 'JP': 'AS', 'JQ': 'AS', 'JR': 'AS', 'JS': 'AS', 'JT': 'AS',
    'JU': 'AS', 'JV': 'AS', 'JW': 'EU', 'JX': 'EU', 'JY': 'AS', 'K': 'NA', 'L': 'SA', 'LA': 'EU', 'LB': 'EU', 'LC': 'EU',
    'LD': 'EU', 'LE': 'EU', 'LF': 'EU', 'LG': 'EU', 'LH': 'EU', 'LI': 'EU', 'LJ': 'EU', 'LK': 'EU', 'LL': 'EU', 'LM': 'EU',
    'LN': 'EU', 'LO': 'SA', 'LP': 'SA', 'LQ': 'SA', 'LR': 'SA', 'LS': 'SA', 'LT': 'SA', 'LU': 'SA', 'LV': 'SA', 'LW': 'SA',
    'LX': 'EU', 'LY': 'EU', 'LZ': 'EU', 'M': 'EU', 'N': 'NA', 'OA': 'SA', 'OB': 'SA', 'OC': 'SA', 'OD': 'AS', 'OE': 'EU',
    'OF': 'EU', 'OG': 'EU', 'OH': 'EU', 'OI': 'EU', 'OJ': 'EU', 'OK': 'EU', 'OL': 'EU', 'OM': 'EU', 'ON': 'EU', 'OO': 'EU',
    'OP': 'AS', 'OQ': 'AS', 'OR': 'EU', 'OS': 'EU', 'OT': 'EU', 'OU': 'EU', 'OV': 'EU', 'OW': 'EU', 'OX': 'NA', 'OY': 'EU',
    'OZ': 'EU', 'P2': 'OC', 'P4': 'SA', 'P5': 'AS', 'PA': 'EU', 'PB': 'EU', 'PC': 'EU', 'PD': 'EU', 'PE': 'EU', 'PF': 'EU',
    'PG': 'EU', 'PH': 'EU', 'PI': 'EU', 'PJ': 'SA', 'PK': 'OC', 'PL': 'OC', 'PM': 'OC', 'PN': 'OC', 'PO': 'OC', 'PP': 'SA',
    'PQ': 'SA', 'PR': 'SA', 'PS': 'SA', 'PT': 'SA', 'PU': 'SA', 'PV': 'SA', 'PW': 'SA', 'PX': 'SA', 'PY': 'SA', 'PZ': 'SA',
    'R': 'EU', 'S': 'EU', 'T': 'EU', 'U': 'AS', 'V': 'NA', 'W': 'NA', 'X': 'NA', 'Y': 'SA', 'Z': 'EU',
    'UA': 'EU', 'UB': 'EU', 'UC': 'EU', 'UD': 'AS', 'UE': 'AS', 'UF': 'AS', 'UG': 'AS', 'UH': 'AS', 'UI': 'AS', 'UJ': 'AS',
    'XE': 'NA', 'XF': 'NA', 'XG': 'NA', 'XH': 'NA', 'XI': 'NA', 'XJ': 'NA', 'XK': 'NA', 'XL': 'NA', 'XM': 'NA', 'XN': 'NA',
    'XO': 'NA', 'XP': 'NA', 'XQ': 'SA', 'XR': 'SA', 'XS': 'AS', 'XT': 'AF', 'XU': 'AS', 'XV': 'AS', 'XW': 'AS', 'XX': 'AS',
    'XY': 'AS', 'XZ': 'AS', 'YA': 'AS', 'YB': 'OC', 'YC': 'OC', 'YD': 'OC', 'YE': 'OC', 'YF': 'OC', 'YG': 'OC', 'YH': 'OC',
    'YI': 'AS', 'YJ': 'OC', 'YK': 'AS', 'YL': 'EU', 'YM': 'AS', 'YN': 'NA', 'YO': 'EU', 'YP': 'EU', 'YQ': 'EU', 'YR': 'EU',
    'YS': 'NA', 'YT': 'EU', 'YU': 'EU', 'YV': 'SA', 'YW': 'SA', 'YX': 'SA', 'YY': 'SA', 'YZ': 'SA', 'Z2': 'AF', 'Z3': 'EU',
    'Z6': 'EU', 'Z8': 'AF', 'ZA': 'EU', 'ZB': 'EU', 'ZC': 'AS', 'ZD': 'AF', 'ZE': 'AF', 'ZF': 'NA', 'ZG': 'EU', 'ZH': 'EU',
    'ZI': 'EU', 'ZJ': 'EU', 'ZK': 'OC', 'ZL': 'OC', 'ZM': 'OC', 'ZN': 'OC', 'ZO': 'OC', 'ZP': 'SA', 'ZQ': 'OC', 'ZR': 'AF',
    'ZS': 'AF', 'ZT': 'AF', 'ZU': 'AF', 'ZV': 'SA', 'ZW': 'SA', 'ZX': 'SA', 'ZY': 'SA', 'ZZ': 'SA'
  };

  function getContinentFromCallsign(callsign: string): string {
    if (!callsign) return "Unknown";
    const call = callsign.toUpperCase();
    
    // Try 2-char prefix
    const p2 = call.substring(0, 2);
    if (PREFIX_TO_CONTINENT[p2]) return PREFIX_TO_CONTINENT[p2];
    
    // Try 1-char prefix
    const p1 = call.substring(0, 1);
    if (PREFIX_TO_CONTINENT[p1]) return PREFIX_TO_CONTINENT[p1];
    
    // Special case for USA (K, W, N, A)
    if (['K', 'W', 'N'].includes(p1)) return "NA";
    if (p1 === 'A' && call.length > 1 && call[1] >= 'A' && call[1] <= 'L') return "NA";
    
    return "Unknown";
  }

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
  let propagationData: any = null;

  async function fetchPropagationData() {
    try {
      console.log("Fetching propagation data...");
      const response = await fetch("https://wspr.hb9vqq.ch/api/dx.json", {
        headers: {
          'User-Agent': 'DX-Radar-App/1.1'
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      // Transform data based on dx.py rules
      const transformed: any = {
        sfi: data.solar?.sfi || 0,
        kp: data.solar?.kp || 0,
        storm: data.storm || null,
        bands: {}
      };

      const bands = ["160m", "80m", "60m", "40m", "30m", "20m", "17m", "15m", "12m", "10m"];
      bands.forEach(band => {
        const bandData = data.bands?.[band];
        if (bandData && bandData.index !== undefined) {
          const val = bandData.index;
          const forecast = bandData.forecast;
          const forecastRating = bandData.forecast_rating;
          
          let status = "Poor";
          let color = "#ef4444";
          
          if (val >= 70) {
            status = "Excellent";
            color = "#3b82f6";
          } else if (val >= 50) {
            status = "Good";
            color = "#10b981";
          } else if (val >= 35) {
            status = "Fair";
            color = "#f59e0b";
          }

          let forecastColor = "#ef4444";
          if (forecast >= 70) forecastColor = "#3b82f6";
          else if (forecast >= 50) forecastColor = "#10b981";
          else if (forecast >= 35) forecastColor = "#f59e0b";
          
          transformed.bands[band] = { 
            val, 
            status, 
            color,
            forecast,
            forecastRating,
            forecastColor
          };
        }
      });

      propagationData = transformed;
      broadcastPropagationData();
      console.log("Propagation data updated.");
    } catch (err) {
      console.error("Failed to fetch propagation data:", err);
    }
  }

  function broadcastPropagationData() {
    if (!propagationData) return;
    const message = JSON.stringify({ type: "propagation", data: propagationData });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Fetch propagation data every 5 minutes
  setInterval(fetchPropagationData, 5 * 60 * 1000);
  fetchPropagationData(); // Initial fetch

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
      console.log("Updating active callsigns and expeditions list...");
      const now_date = new Date();
      const fourteenDaysFromNow = new Date();
      fourteenDaysFromNow.setDate(now_date.getDate() + 14);
      const parsedExpeditions: any[] = [];
      const calls: Set<string> = new Set();
      let idCounter = 1;

      // 1. Fetch NG3K RSS
      try {
        console.log("Fetching NG3K RSS feed...");
        const feed = await rssParser.parseURL("http://www.ng3k.com/adxo.xml");
        const ng3kStartCount = parsedExpeditions.length;
        
        for (const item of feed.items) {
          try {
            const title = item.title || "";
            const description = item.content || item.contentSnippet || "";
            const parts = title.split(':');
            if (parts.length < 2) continue;

            const location = parts[0].trim();
            const rest = parts[1].trim();
            const subParts = rest.split('--').map(p => p.trim());
            
            let dates = subParts[0] || "Unknown Dates";
            let callsign = subParts[1] || "";
            if (!callsign) continue;

            if (callsign.length < 4 || callsign.includes('/')) {
              const asMatch = description.match(/ as\s+([A-Z0-9\/]+)/i);
              if (asMatch) {
                callsign = asMatch[1].trim();
              }
            }

            const websiteUrl = item.link;
            let status: 'Active' | 'Upcoming' | 'Past' = "Upcoming";
            let isWithin14Days = false;
            let parsedStartDate: string | undefined;
            let parsedEndDate: string | undefined;

            try {
              const yearMatch = dates.match(/(\d{4})/);
              const year = yearMatch ? parseInt(yearMatch[1]) : now_date.getFullYear();
              
              const singleMonthRange = dates.match(/([A-Z][a-z]{2})\s+(\d+)-(\d+)/i);
              const multiMonthRange = dates.match(/([A-Z][a-z]{2})\s+(\d+)-([A-Z][a-z]{2})\s+(\d+)/i);
              
              if (singleMonthRange) {
                const monthStr = singleMonthRange[1];
                const startDay = parseInt(singleMonthRange[2]);
                const endDay = parseInt(singleMonthRange[3]);
                const startDate = new Date(`${monthStr} ${startDay}, ${year}`);
                const endDate = new Date(`${monthStr} ${endDay}, ${year}`);
                endDate.setHours(23, 59, 59);
                parsedStartDate = startDate.toISOString();
                parsedEndDate = endDate.toISOString();

                if (now_date >= startDate && now_date <= endDate) {
                  status = "Active";
                  isWithin14Days = true;
                } else if (startDate > now_date && startDate <= fourteenDaysFromNow) {
                  status = "Upcoming";
                  isWithin14Days = true;
                } else if (endDate < now_date) {
                  status = "Past";
                }
              } else if (multiMonthRange) {
                const startMonth = multiMonthRange[1];
                const startDay = parseInt(multiMonthRange[2]);
                const endMonth = multiMonthRange[3];
                const endDay = parseInt(multiMonthRange[4]);
                const startDate = new Date(`${startMonth} ${startDay}, ${year}`);
                const endDate = new Date(`${endMonth} ${endDay}, ${year}`);
                endDate.setHours(23, 59, 59);
                parsedStartDate = startDate.toISOString();
                parsedEndDate = endDate.toISOString();

                if (now_date >= startDate && now_date <= endDate) {
                  status = "Active";
                  isWithin14Days = true;
                } else if (startDate > now_date && startDate <= fourteenDaysFromNow) {
                  status = "Upcoming";
                  isWithin14Days = true;
                } else if (endDate < now_date) {
                  status = "Past";
                }
              }
            } catch (dateErr) {
              // Ignore date parsing errors
            }

            if (status === 'Active' || (status === 'Upcoming' && isWithin14Days)) {
              parsedExpeditions.push({
                id: String(idCounter++),
                callsign,
                location,
                dates,
                status: status as 'Active' | 'Upcoming',
                websiteUrl,
                source: 'NG3K ADXO',
                startDate: parsedStartDate,
                endDate: parsedEndDate
              });
            }
          } catch (e) {
            console.error("Error parsing RSS item:", e);
          }
        }
        console.log(`NG3K: Parsed ${parsedExpeditions.length - ng3kStartCount} items.`);
      } catch (ng3kErr) {
        console.error("Failed to fetch NG3K:", ng3kErr);
      }

      // 2. Fetch HamRadioTimeline
      try {
        console.log("Fetching HamRadioTimeline...");
        const timelineStartCount = parsedExpeditions.length;
        const timelineRes = await fetch("https://www.hamradiotimeline.com/timeline/dxw_timeline_1_1.php", {
           headers: {
             "User-Agent": "Mozilla/5.0 (Node.js)"
           }
        });
        if (timelineRes.ok) {
          const html = await timelineRes.text();
          const labelsMatch = html.match(/var\s+labels\s*=\s*\[(.*?)\];/);
          const dataMatch = html.match(/data\s*=\s*\[([\s\S]*?)\];/);
          const tooltipsMatch = html.match(/\.set\('tooltips',\s*\[([\s\S]*?)\]\)/);

          if (labelsMatch && dataMatch) {
            const rawLabels = labelsMatch[1].split(',').map(l => l.replace(/['"]/g, '').trim());
            
            let rawTooltips: string[] = [];
            if (tooltipsMatch) {
              rawTooltips = Array.from(tooltipsMatch[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)).map(m => m[1]);
            }

            const rows = Array.from(dataMatch[1].matchAll(/\[\[([\s\S]*?)\]\]/g)).map(m => m[1]);
            const currentMonthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const monthStr = currentMonthNames[now_date.getMonth()];
            
            // Log for debugging
            console.log(`Timeline: labels=${rawLabels.length}, rows=${rows.length}`);

            for (let i = 0; i < rawLabels.length; i++) {
              const labelCombo = rawLabels[i];
              if (!labelCombo) continue;
              
              const rowStr = rows[i] || "";
              // match each pair: [startDay, duration, ...]
              const pairs = Array.from(rowStr.matchAll(/(\d+)\s*,\s*(\d+)/g));
              const callsigns = labelCombo.split('&').map(c => c.trim().toUpperCase());
              
              let location = "DX-World Timeline";
              let websiteUrl = "https://www.dx-world.net/";
              const tt = rawTooltips[i] || "";
              const locMatch = tt.match(/<b>(.*?)<\/b>/i);
              if (locMatch && locMatch[1]) location = locMatch[1].trim();
              
              // Extract href safely from escaped string
              // e.g. <a href=\"https://www.dx-world.net/...\" target=\"_blank\">
              const urlMatch = tt.match(/href=\\?["'](.*?)\\?["']/i);
              if (urlMatch && urlMatch[1]) websiteUrl = urlMatch[1].trim();

              for (const call of callsigns) {
                if (!call) continue;
                
                for (const pair of pairs) {
                  const startDay = parseInt(pair[1]);
                  const duration = parseInt(pair[2]);
                  
                  const startDate = new Date(now_date.getFullYear(), now_date.getMonth(), startDay);
                  const endDate = new Date(now_date.getFullYear(), now_date.getMonth(), startDay + duration - 1);
                  endDate.setHours(23, 59, 59);
                  
                  let status: 'Active' | 'Upcoming' | 'Past' = "Upcoming";
                  let isWithin14Days = false;
                  
                  if (now_date >= startDate && now_date <= endDate) {
                    status = "Active";
                    isWithin14Days = true;
                  } else if (startDate > now_date && startDate <= fourteenDaysFromNow) {
                    status = "Upcoming";
                    isWithin14Days = true;
                  } else if (endDate < now_date) {
                     status = "Past";
                  }
                  
                  if (status === 'Active' || (status === 'Upcoming' && isWithin14Days)) {
                    parsedExpeditions.push({
                      id: String(idCounter++),
                      callsign: call,
                      location: location,
                      dates: `${monthStr} ${startDay}-${startDay + duration - 1}, ${startDate.getFullYear()}`,
                      status: status as 'Active' | 'Upcoming',
                      websiteUrl,
                      source: "Timeline",
                      startDate: startDate.toISOString(),
                      endDate: endDate.toISOString(),
                    });
                  }
                }
              }
            }
          }
          console.log(`Timeline: Parsed ${parsedExpeditions.length - timelineStartCount} items.`);
        } else {
           console.error(`HamRadioTimeline gave status ${timelineRes.status}`);
        }
      } catch (timelineErr) {
        console.error("Failed to fetch HamRadioTimeline:", timelineErr);
      }

      // 3. Add manual callsigns
      if (currentSettings.manualCallsigns) {
        const manual = currentSettings.manualCallsigns.split(",")
          .map(c => c.trim().toUpperCase())
          .filter(c => c.length > 0);
        for (const m of manual) {
          calls.add(m);
        }
      }

      // Merge and deduplicate parsedExpeditions (prefer tracking all, but unify tags)
      const uniqueExpeditions = [];
      const seen = new Set();
      for (const e of parsedExpeditions) {
        if (!seen.has(e.callsign)) {
          seen.add(e.callsign);
          uniqueExpeditions.push(e);
        } else {
           // update source to indicate both if needed
           const existing = uniqueExpeditions.find(ex => ex.callsign === e.callsign);
           if (existing) {
             if (existing.source !== e.source && existing.source && !existing.source.includes('&')) {
                existing.source = existing.source + ' & ' + e.source;
             }
             // Prefer Timeline's link (DX-World) and dates/location over NG3K if available
             if (e.source === "Timeline") {
               if (e.websiteUrl) existing.websiteUrl = e.websiteUrl;
               if (e.startDate) existing.startDate = e.startDate;
               if (e.endDate) existing.endDate = e.endDate;
               if (e.dates) existing.dates = e.dates;
               if (e.location && e.location !== "DX-World Timeline") existing.location = e.location;
             }
           }
        }
        if (e.status === 'Active') {
          calls.add(e.callsign);
        }
      }

      // Sort expeditions: Upcoming correctly by date start
      uniqueExpeditions.sort((a, b) => {
         // rough sort
         if (a.status !== b.status) return a.status === 'Active' ? -1 : 1;
         return a.callsign.localeCompare(b.callsign);
      });

      expeditionsCache = uniqueExpeditions;
      lastFetchTime = Date.now();
      
      activeCallsigns = Array.from(calls);
      console.log(`Updated expeditions cache: ${expeditionsCache.length} found. Active callsigns for validation: ${activeCallsigns.length}`);
      broadcastLog(`Found ${activeCallsigns.length} active expedition callsigns.`);
    } catch (err) {
      console.error("Error heavily updating active callsigns:", err);
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
            const spotterCont = getContinentFromCallsign(spotter);

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
              spotterCont,
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
  app.get("/api/propagation", (req, res) => {
    res.json(propagationData || { error: "Data not available yet" });
  });

  app.get("/api/expeditions", async (req, res) => {
    // Return from cache, populated by updateActiveCallsigns
    if (expeditionsCache.length === 0) {
      // Force initial fetch if somehow empty
      await updateActiveCallsigns();
    }
    
    if (expeditionsCache.length > 0) {
      res.json(expeditionsCache);
    } else {
      res.status(500).json({ error: "No expeditions found from any source" });
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
