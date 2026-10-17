export interface AthleteProfile {
  name: string;
  age: number;
  weightKg: number;
  bikeFtp: number; // Watts, e.g. 360
  bikeModel: string; // e.g. Marin Stelvio
  run5kTime: string; // "22:31"
  runFtp: number; // rFTP running power, e.g. 380W
  targetCadence: number; // SPM, e.g. 175
  swolf: number; // Swolf score, e.g. 38
  maxHr: number;
  restingHr: number;
  targetRace: string;
  targetDate: string; // 2027-08-29
  weeklyAvailability: string;
}

export type SportType = 'run' | 'bike' | 'swim' | 'strength' | 'rest';

export interface PlanSession {
  day: string;
  sport: SportType;
  main: string;
  sec: string;
  durationMin: number;
  targetZone: string; // 'GA1', 'GA2', 'Z3 Tempo', 'Z4 Schwelle', 'K3 Kraft', 'Regeneration'
  plannedTss: number;
  completed: boolean;
  actualDuration?: number;
  actualTss?: number;
  actualNotes?: string;
}

export interface WeeklyPlan {
  A: PlanSession[];
  B: PlanSession[];
}

export interface ActivityTelemetryPoint {
  timeOffsetSec: number;
  watts?: number;
  heartRate?: number;
  speedKmh?: number;
  cadence?: number;
  altitudeM?: number;
}

export interface SportActivity {
  id: string;
  title: string;
  sport: 'bike' | 'run' | 'swim';
  date: string; // YYYY-MM-DD
  timeFormatted: string; // e.g. "17:30 Uhr" or "Heute, 06:45 Uhr"
  distanceKm: number;
  durationMin: number;
  elevationGainM: number;
  avgWatts?: number | null;
  normalizedPower?: number | null; // NP
  maxWatts?: number | null;
  avgHr: number;
  maxHr: number;
  avgCadence: number; // rpm for bike, spm for run
  paceFormatted: string; // e.g. "4:30 min/km", "33.8 km/h", "1:44 /100m"
  swolf?: number | null;
  tss: number;
  intensityFactor: number; // IF
  aerobicDecouplingPwHr?: number | null; // e.g. +3.2%
  source: 'strava' | 'garmin' | 'file_upload' | 'manual';
  telemetry: ActivityTelemetryPoint[];
  tags: string[];
  notes?: string;
}

export interface GarminDailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  bodyBattery: number; // 0 - 100
  sleepScore: number; // 0 - 100
  sleepHours: number;
  hrvValueMs: number;
  hrvStatus: 'Ausgeglichen' | 'Niedrig' | 'Erhöht' | 'Ermüdet';
  restingHr: number;
  recoveryHours: number;
  steps?: number;
  stressLevel?: number;
  vo2Max?: number;
  note?: string;
}

export interface GarminBiometrics {
  steps?: number;
  sleepScore: number;
  sleepHours: number;
  deepSleepMin: number;
  remSleepMin: number;
  bodyBattery: number; // 0 - 100
  bodyBatteryTrend: 'rising' | 'draining' | 'steady';
  hrvStatus: 'Ausgeglichen' | 'Niedrig' | 'Erhöht' | 'Ermüdet';
  hrvValueMs: number;
  hrvBaselineMs: number;
  restingHr: number;
  recoveryHours: number;
  vo2Max: number;
  trainingLoad7Day: number;
  trainingStatus: 'Produktiv' | 'Aufrechterhaltend' | 'Erholung' | 'Überlastet';
  lastSyncTime: string;
}

export interface PmcDataPoint {
  date: string;
  dayLabel: string;
  ctl: number; // Fitness (Chronic Training Load)
  atl: number; // Fatigue (Acute Training Load)
  tsb: number; // Form = CTL - ATL
  tssToday: number;
}
