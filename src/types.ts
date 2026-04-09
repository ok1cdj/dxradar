export interface Expedition {
  id: string;
  callsign: string;
  location: string;
  dates: string;
  status: 'Active' | 'Upcoming';
  websiteUrl?: string;
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
