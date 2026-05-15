export interface Expedition {
  id: string;
  callsign: string;
  location: string;
  dates: string;
  startDate?: string;
  endDate?: string;
  status: 'Active' | 'Upcoming';
  websiteUrl?: string;
  source?: string;
}

export interface AIAnalysis {
  summary: string;
  timestamp: number;
  spotCount: number;
}

export interface BandModeStatus {
  [band: string]: {
    [mode: string]: 'worked' | 'confirmed' | 'needed';
  };
}

export interface BandStatus {
  val: number;
  status: string;
  color: string;
  forecast: number;
  forecastRating: string;
  forecastColor: string;
}

export interface PropagationData {
  sfi: number;
  kp: number;
  storm?: {
    probability: number;
    predicted_kp: number;
  };
  bands: {
    [key: string]: BandStatus;
  };
}
