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
