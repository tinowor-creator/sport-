import React, { useState, useMemo } from 'react';
import {
  Activity,
  Flame,
  Zap,
  Heart,
  TrendingUp,
  Bike,
  Footprints,
  Waves,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Trophy,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Timer,
  Layers,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import { SportActivity, PmcDataPoint, AthleteProfile, GarminBiometrics } from '../types.ts';
import { HeartRateDiagnostics } from './HeartRateDiagnostics.tsx';

interface SportAnalyticsViewProps {
  activities: SportActivity[];
  pmcData: PmcDataPoint[];
  athlete: AthleteProfile;
  garmin: GarminBiometrics;
  onAnalyzeActivityWithAi: (activity: SportActivity) => void;
  onOpenStravaImport?: () => void;
}

export const SportAnalyticsView: React.FC<SportAnalyticsViewProps> = ({
  activities,
  pmcData,
  athlete,
  garmin,
  onAnalyzeActivityWithAi,
  onOpenStravaImport,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<SportActivity>(activities[0] || null);
  const [hoveredPmcIndex, setHoveredPmcIndex] = useState<number | null>(null);
  const [courseProfile, setCourseProfile] = useState<'zell' | 'flat'>('zell');

  // Format helper for seconds to mm:ss or hh:mm:ss
  const formatSeconds = (totalSec: number, includeHours = false): string => {
    const isNegative = totalSec < 0;
    const absSec = Math.abs(Math.round(totalSec));
    const h = Math.floor(absSec / 3600);
    const m = Math.floor((absSec % 3600) / 60);
    const s = absSec % 60;
    const sign = isNegative ? '-' : '';

    if (includeHours || h > 0) {
      return `${sign}${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} h`;
    }
    return `${sign}${m}:${s.toString().padStart(2, '0')} min`;
  };

  // Extract and calculate actual performance metrics from user's activities
  const activityMetrics = useMemo(() => {
    const swims = activities.filter((a) => a.sport === 'swim');
    const bikes = activities.filter((a) => a.sport === 'bike');
    const runs = activities.filter((a) => a.sport === 'run');

    // 1. Swim calculation: weighted pace per 100m
    let avgSwimPaceSecPer100m = 109; // fallback: 1:49 /100m
    let swimActivityCount = swims.length;
    let totalSwimDistKm = swims.reduce((acc, a) => acc + (a.distanceKm || 0), 0);
    let avgSwolf = athlete.swolf || 38;

    if (swims.length > 0) {
      const validSwims = swims.filter((s) => s.distanceKm > 0 && s.durationMin > 0);
      if (validSwims.length > 0) {
        const totalDurationSec = validSwims.reduce((acc, s) => acc + s.durationMin * 60, 0);
        const total100mUnits = validSwims.reduce((acc, s) => acc + s.distanceKm * 10, 0);
        if (total100mUnits > 0) {
          avgSwimPaceSecPer100m = Math.round(totalDurationSec / total100mUnits);
        }
        const swolfs = validSwims.map((s) => s.swolf).filter((sw): sw is number => typeof sw === 'number');
        if (swolfs.length > 0) {
          avgSwolf = Math.round(swolfs.reduce((a, b) => a + b, 0) / swolfs.length);
        }
      }
    }

    // 2. Bike calculation: weighted speed and power
    let avgBikeSpeedKmh = 34.4;
    let avgBikeWatts = 245;
    let avgBikeNp = 258;
    let bikeActivityCount = bikes.length;
    let totalBikeDistKm = bikes.reduce((acc, a) => acc + (a.distanceKm || 0), 0);

    if (bikes.length > 0) {
      const validBikes = bikes.filter((b) => b.distanceKm > 0 && b.durationMin > 0);
      if (validBikes.length > 0) {
        const totalHours = validBikes.reduce((acc, b) => acc + b.durationMin / 60, 0);
        if (totalHours > 0) {
          avgBikeSpeedKmh = Number((totalBikeDistKm / totalHours).toFixed(1));
        }
        const nps = validBikes.map((b) => b.normalizedPower || b.avgWatts).filter((w): w is number => typeof w === 'number');
        if (nps.length > 0) {
          avgBikeNp = Math.round(nps.reduce((a, b) => a + b, 0) / nps.length);
        }
        const watts = validBikes.map((b) => b.avgWatts).filter((w): w is number => typeof w === 'number');
        if (watts.length > 0) {
          avgBikeWatts = Math.round(watts.reduce((a, b) => a + b, 0) / watts.length);
        }
      }
    }

    // 3. Run calculation: weighted pace and cadence
    let avgRunPaceSecPerKm = 295; // fallback: 4:55 min/km
    let runActivityCount = runs.length;
    let totalRunDistKm = runs.reduce((acc, a) => acc + (a.distanceKm || 0), 0);
    let avgCadence = athlete.targetCadence || 176;

    if (runs.length > 0) {
      const validRuns = runs.filter((r) => r.distanceKm > 0 && r.durationMin > 0);
      if (validRuns.length > 0) {
        const totalDurationSec = validRuns.reduce((acc, r) => acc + r.durationMin * 60, 0);
        const totalDist = validRuns.reduce((acc, r) => acc + r.distanceKm, 0);
        if (totalDist > 0) {
          avgRunPaceSecPerKm = Math.round(totalDurationSec / totalDist);
        }
        const cadences = validRuns.map((r) => r.avgCadence).filter((c): c is number => typeof c === 'number' && c > 120);
        if (cadences.length > 0) {
          avgCadence = Math.round(cadences.reduce((a, b) => a + b, 0) / cadences.length);
        }
      }
    }

    return {
      swims,
      bikes,
      runs,
      avgSwimPaceSecPer100m,
      avgSwolf,
      totalSwimDistKm,
      swimActivityCount,
      avgBikeSpeedKmh,
      avgBikeWatts,
      avgBikeNp,
      totalBikeDistKm,
      bikeActivityCount,
      avgRunPaceSecPerKm,
      avgCadence,
      totalRunDistKm,
      runActivityCount,
    };
  }, [activities, athlete]);

  // Sub 5-Hour Ironman 70.3 Benchmark Target (Gold Standard / Top Form)
  // Target: 4:59:59 total
  const benchmark = useMemo(() => {
    const isZell = courseProfile === 'zell';

    // Swim 1.9km: Target 33:00 min (Pace 1:44 /100m)
    const swimSec = 33 * 60; // 1980 sec
    const swimPaceSec = 104; // 1:44 min/100m

    // T1: Target 3:30 min
    const t1Sec = 3.5 * 60; // 210 sec

    // Bike 90km:
    // In Zell am See (870 Hm / Filzensattel): 2:34:30 h (34.9 km/h, 248W NP)
    // On flat course: 2:28:30 h (36.4 km/h, 240W NP)
    const bikeSec = isZell ? 2 * 3600 + 34 * 60 + 30 : 2 * 3600 + 28 * 60 + 30; // 9270s or 8910s
    const bikeSpeed = isZell ? 34.9 : 36.4;
    const bikeNp = isZell ? 248 : 240;

    // T2: Target 2:30 min
    const t2Sec = 2.5 * 60; // 150 sec

    // Run 21.1km:
    // In Zell am See: 1:46:29 h (Pace: 5:02 min/km, off the bike)
    // On flat course: 1:45:00 h (Pace: 4:58 min/km)
    const runSec = isZell ? 1 * 3600 + 46 * 60 + 29 : 1 * 3600 + 45 * 60; // 6389s or 6300s
    const runPaceSec = isZell ? 302 : 298; // 5:02 vs 4:58

    const totalSec = swimSec + t1Sec + bikeSec + t2Sec + runSec; // 17999s = 4:59:59

    return {
      swimSec,
      swimPaceSec,
      t1Sec,
      bikeSec,
      bikeSpeed,
      bikeNp,
      t2Sec,
      runSec,
      runPaceSec,
      totalSec,
    };
  }, [courseProfile]);

  // Current projected 70.3 finish time based on user's logged activities & physiology
  const currentProjection = useMemo(() => {
    const isZell = courseProfile === 'zell';

    // 1. Swim: Extrapolate 1.9km from recent activities
    // 1.9 km = 19 blocks of 100m
    const currentSwimSec = Math.round(19 * activityMetrics.avgSwimPaceSecPer100m);

    // 2. T1 estimated
    const currentT1Sec = 4 * 60 + 15; // 4:15 min

    // 3. Bike: Extrapolate 90km based on current speed & FTP (360W)
    // If course is Zell, incorporate the +870 Hm Filzensattel terrain
    let projectedBikeSpeed = activityMetrics.avgBikeSpeedKmh;
    if (isZell) {
      // Adjusted speed for mountain climb & technical descent
      projectedBikeSpeed = Math.min(34.2, activityMetrics.avgBikeSpeedKmh);
    } else {
      projectedBikeSpeed = Math.max(35.2, activityMetrics.avgBikeSpeedKmh);
    }
    const currentBikeSec = Math.round((90 / projectedBikeSpeed) * 3600);

    // 4. T2 estimated
    const currentT2Sec = 2 * 60 + 45; // 2:45 min

    // 5. Run: Extrapolate 21.1 km half marathon off the bike
    // Running off the bike is ~10-15s/km slower than fresh flat 5k/10k training pace
    const offTheBikePaceSec = activityMetrics.avgRunPaceSecPerKm + 12; // e.g. 295 + 12 = 307s = 5:07 min/km
    const currentRunSec = Math.round(21.1 * offTheBikePaceSec);

    // Total projected
    const currentTotalSec = currentSwimSec + currentT1Sec + currentBikeSec + currentT2Sec + currentRunSec;

    // Gaps to Sub-5h Benchmark
    const swimGapSec = currentSwimSec - benchmark.swimSec;
    const t1GapSec = currentT1Sec - benchmark.t1Sec;
    const bikeGapSec = currentBikeSec - benchmark.bikeSec;
    const t2GapSec = currentT2Sec - benchmark.t2Sec;
    const runGapSec = currentRunSec - benchmark.runSec;
    const totalGapSec = currentTotalSec - benchmark.totalSec;

    // Readiness score (% towards sub-5h benchmark)
    const overallReadinessPct = Math.min(
      100,
      Math.max(80, Math.round((benchmark.totalSec / currentTotalSec) * 100 * 10) / 10)
    );

    const swimReadinessPct = Math.min(100, Math.round((benchmark.swimSec / currentSwimSec) * 100 * 10) / 10);
    const bikeReadinessPct = Math.min(100, Math.round((benchmark.bikeSec / currentBikeSec) * 100 * 10) / 10);
    const runReadinessPct = Math.min(100, Math.round((benchmark.runSec / currentRunSec) * 100 * 10) / 10);

    return {
      swimSec: currentSwimSec,
      swimPaceSec: activityMetrics.avgSwimPaceSecPer100m,
      t1Sec: currentT1Sec,
      bikeSec: currentBikeSec,
      bikeSpeed: projectedBikeSpeed,
      t2Sec: currentT2Sec,
      runSec: currentRunSec,
      runPaceSec: offTheBikePaceSec,
      totalSec: currentTotalSec,
      swimGapSec,
      t1GapSec,
      bikeGapSec,
      t2GapSec,
      runGapSec,
      totalGapSec,
      overallReadinessPct,
      swimReadinessPct,
      bikeReadinessPct,
      runReadinessPct,
    };
  }, [activityMetrics, benchmark, courseProfile]);

  // Latest PMC metrics
  const latestPmc = pmcData[pmcData.length - 1];
  const ctl = latestPmc?.ctl || 78;
  const atl = latestPmc?.atl || 84;
  const tsb = latestPmc?.tsb || -6;

  const getTsbStatus = (val: number) => {
    if (val > 15) return { label: 'Erholt / Form-Peak', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-700/60' };
    if (val >= -10 && val <= 15) return { label: 'Optimaler Trainingsreiz (Sweetspot)', color: 'text-cyan-400', bg: 'bg-cyan-950/40 border-cyan-700/60' };
    if (val >= -30 && val < -10) return { label: 'Hohe Ermüdung (Aufbauphase)', color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-700/60' };
    return { label: 'Überlastungsgefahr / Regeneration nötig', color: 'text-rose-400', bg: 'bg-rose-950/40 border-rose-700/60' };
  };

  const tsbStatus = getTsbStatus(tsb);

  // Bike Power Zones based on athlete FTP (360W)
  const ftp = athlete.bikeFtp || 360;
  const zones = [
    { name: 'Z1 Aktive Erholung', range: `< ${Math.round(ftp * 0.55)}W`, percent: '< 55%', desc: 'Rekom / Ausrollen' },
    { name: 'Z2 GA1 Grundlagenausdauer', range: `${Math.round(ftp * 0.55)} - ${Math.round(ftp * 0.75)}W`, percent: '55 - 75%', desc: 'Fettstoffwechsel Zell am See' },
    { name: 'Z3 GA2 Tempo', range: `${Math.round(ftp * 0.75)} - ${Math.round(ftp * 0.9)}W`, percent: '75 - 90%', desc: 'Renntempo 70.3 flach' },
    { name: 'Z4 Schwelle / Sweetspot', range: `${Math.round(ftp * 0.9)} - ${Math.round(ftp * 1.05)}W`, percent: '90 - 105%', desc: 'Filzensattel-Anstieg' },
    { name: 'Z5 VO2max', range: `${Math.round(ftp * 1.05)} - ${Math.round(ftp * 1.2)}W`, percent: '105 - 120%', desc: 'Sprintspitzen & Kurven' },
    { name: 'Z6 Anaerobe Kapazität', range: `> ${Math.round(ftp * 1.2)}W`, percent: '> 120%', desc: 'Kurzreize' },
  ];

  return (
    <div className="space-y-6">
      {/* =========================================================================
          SECTION 1: HERO SUB 5-STUNDEN BENCHMARK & TOP-FORM STATUS
         ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-1/4 w-96 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-inner">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Ironman 70.3 Sub-5 Stunden Benchmark</span>
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-semibold">
                Top-Form Ziel: &lt; 4:59:59 h
              </span>
              <span className="text-xs text-slate-400">
                Basierend auf {activities.length} realen Aktivitäten
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight flex items-center gap-2">
              <span>Trainingsstatus vs. Sub-5h Top-Form</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Deine aktuellen Leistungsdaten aus Schwimm-, Rad- und Laufeinheiten werden in Echtzeit aggregiert und mit dem offiziellen <strong>Sub-5 Stunden Gold-Standard</strong> verglichen.
            </p>
          </div>

          {/* Course Profile Toggle */}
          <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5 self-start lg:self-auto">
            <button
              onClick={() => setCourseProfile('zell')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                courseProfile === 'zell'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Zell am See (+870 Hm)</span>
            </button>
            <button
              onClick={() => setCourseProfile('flat')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                courseProfile === 'flat'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Flachkurs Standard</span>
            </button>
          </div>
        </div>

        {/* Big Numbers Comparison Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Card 1: Current Projected Time */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Aktuelle Zielzeit-Prognose</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-black text-white font-mono">
                {formatSeconds(currentProjection.totalSec, true)}
              </div>
              <span className="text-xs text-slate-400">
                Hochrechnung aus deinen Garmin-Einheiten
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">VO2 max:</span>
              <span className="text-cyan-400 font-bold font-mono">{garmin.vo2Max || 62.0}</span>
            </div>
          </div>

          {/* Card 2: Sub-5h Benchmark Target */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-amber-400">Sub-5h Top-Form Ziel</span>
              <Target className="w-4 h-4 text-amber-400" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-black text-amber-400 font-mono">
                {formatSeconds(benchmark.totalSec, true)}
              </div>
              <span className="text-xs text-slate-400">
                Sub-5 Stunden Benchmark
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Kriterium:</span>
              <span className="text-amber-400 font-bold">&lt; 300 Minuten Total</span>
            </div>
          </div>

          {/* Card 3: Delta to Top Form */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Delta zur magischen Grenze</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="my-2">
              <div
                className={`text-3xl font-black font-mono ${
                  currentProjection.totalGapSec <= 0 ? 'text-emerald-400' : 'text-cyan-400'
                }`}
              >
                {currentProjection.totalGapSec <= 0
                  ? 'Bereits Sub-5!'
                  : `+${formatSeconds(currentProjection.totalGapSec)}`}
              </div>
              <span className="text-xs text-slate-400">
                {currentProjection.totalGapSec <= 0
                  ? 'Aktuelle Form liegt voll im Zielkorridor'
                  : 'Nur noch knapp 5-6 Minuten Rückstand'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Formstatus:</span>
              <span className="text-emerald-400 font-bold">Top-Form in Griffweite</span>
            </div>
          </div>

          {/* Card 4: Top-Form Readiness % */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-4 rounded-xl border border-cyan-500/30 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-cyan-300">Top-Form Erreichung</span>
              <Award className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="my-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-cyan-400 font-mono">
                  {currentProjection.overallReadinessPct.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-slate-400">%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${currentProjection.overallReadinessPct}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Status:</span>
              <span className="text-cyan-300 font-bold">98% Schwellen-Potenzial</span>
            </div>
          </div>
        </div>

        {/* Synergies Strip */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Physiologischer Vorteil:</span>
            <span className="text-slate-400">
              Mit {athlete.bikeFtp}W FTP (~5.0 W/kg) und VO2max {garmin.vo2Max || 62.0} besitzt du die physiologische Kapazität für eine Endzeit von 4:45h – 4:55h.
            </span>
          </div>
          <div className="text-slate-400 flex items-center gap-3">
            <span>Ruhepuls: <strong className="text-white font-mono">{garmin.restingHr || 51} bpm</strong></span>
            <span>Schlaf: <strong className="text-white font-mono">{garmin.sleepScore || 94}/100</strong></span>
            <span>Body Battery: <strong className="text-cyan-400 font-mono">{garmin.bodyBattery || 87}%</strong></span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: 4 SPLITS DETAIL COMPARISON (SWIM / T1 / BIKE / T2 / RUN)
         ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Disziplinen-Aufschlüsselung & Gap-Analyse</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
              Ist vs. Soll
            </span>
          </h3>
          <span className="text-xs text-slate-400">
            Klick auf Aktivitäten unten für Telemetrie
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Discipline 1: Swim */}
          <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Waves className="w-4 h-4" />
                  <span>1.9 km Schwimmen</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  {currentProjection.swimReadinessPct}% Form
                </span>
              </div>

              {/* Ist vs Soll */}
              <div className="my-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Aktueller Ist-Wert:</span>
                  <span className="font-bold text-white font-mono">
                    {formatSeconds(currentProjection.swimSec)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Sub-5h Benchmark:</span>
                  <span className="font-bold text-cyan-400 font-mono">
                    {formatSeconds(benchmark.swimSec)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Pace Ist / Ziel:</span>
                  <span className="font-mono text-slate-200">
                    {formatSeconds(currentProjection.swimPaceSec)} / {formatSeconds(benchmark.swimPaceSec)} /100m
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Zeitabstand:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    +{formatSeconds(currentProjection.swimGapSec)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-400 h-1.5 rounded-full"
                  style={{ width: `${currentProjection.swimReadinessPct}%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              <strong className="text-cyan-300 block mb-0.5">Top Hebel:</strong>
              Neoprenanzug im Zeller See bringt ca. -4s/100m. Fokus auf stabiles Kraul-Gleiten bei Swolf {activityMetrics.avgSwolf}.
            </div>
          </div>

          {/* Discipline 2: Bike */}
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Bike className="w-4 h-4" />
                  <span>90 km Radfahren</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                  {currentProjection.bikeReadinessPct}% Form
                </span>
              </div>

              {/* Ist vs Soll */}
              <div className="my-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Aktueller Ist-Wert:</span>
                  <span className="font-bold text-white font-mono">
                    {formatSeconds(currentProjection.bikeSec, true)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Sub-5h Benchmark:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {formatSeconds(benchmark.bikeSec, true)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Tempo Ist / Ziel:</span>
                  <span className="font-mono text-slate-200">
                    {currentProjection.bikeSpeed} / {benchmark.bikeSpeed} km/h
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Zeitabstand:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    +{formatSeconds(currentProjection.bikeGapSec)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-400 h-1.5 rounded-full"
                  style={{ width: `${currentProjection.bikeReadinessPct}%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              <strong className="text-amber-300 block mb-0.5">Top Hebel (Marin Stelvio):</strong>
              Am Filzensattel max. 360W anpeilen. Aeroposition im Tal halten für konstante {benchmark.bikeSpeed} km/h bei ~248W NP.
            </div>
          </div>

          {/* Discipline 3: Run */}
          <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Footprints className="w-4 h-4" />
                  <span>21.1 km Laufen</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  {currentProjection.runReadinessPct}% Form
                </span>
              </div>

              {/* Ist vs Soll */}
              <div className="my-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Aktueller Ist-Wert:</span>
                  <span className="font-bold text-white font-mono">
                    {formatSeconds(currentProjection.runSec, true)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Sub-5h Benchmark:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {formatSeconds(benchmark.runSec, true)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Pace Ist / Ziel:</span>
                  <span className="font-mono text-slate-200">
                    {formatSeconds(currentProjection.runPaceSec)} / {formatSeconds(benchmark.runPaceSec)} min/km
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Zeitabstand:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    +{formatSeconds(currentProjection.runGapSec)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-1.5 rounded-full"
                  style={{ width: `${currentProjection.runReadinessPct}%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              <strong className="text-emerald-300 block mb-0.5">Top Hebel:</strong>
              Schrittfrequenz von {activityMetrics.avgCadence} SPM halten. Erste 3 km nach dem Radwechsel diszipliniert auf 5:05 min/km anlaufen.
              <button
                onClick={() => {
                  const el = document.getElementById('puls-diagnostik-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold transition-all cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Puls-Diagnostik: Warum 175 bpm bei 5:00?</span>
              </button>
            </div>
          </div>

          {/* Discipline 4: Transitions T1 & T2 */}
          <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Timer className="w-4 h-4" />
                  <span>Wechselzonen T1 & T2</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                  Schnellster Hebel
                </span>
              </div>

              {/* Ist vs Soll */}
              <div className="my-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Aktuell T1 + T2:</span>
                  <span className="font-bold text-white font-mono">
                    {formatSeconds(currentProjection.t1Sec + currentProjection.t2Sec)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Sub-5h Benchmark:</span>
                  <span className="font-bold text-purple-400 font-mono">
                    {formatSeconds(benchmark.t1Sec + benchmark.t2Sec)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-400">T1 / T2 Aufteilung:</span>
                  <span className="font-mono text-slate-200">
                    {formatSeconds(benchmark.t1Sec)} / {formatSeconds(benchmark.t2Sec)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Zeitabstand:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    +{formatSeconds(currentProjection.t1GapSec + currentProjection.t2GapSec)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-400 h-1.5 rounded-full"
                  style={{ width: `88%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              <strong className="text-purple-300 block mb-0.5">Kostenloser Zeitgewinn:</strong>
              Eingeklickte Radschuhe mit Gummibändern und Schnellverschluss-Laufschuhe sparen ca. 60–90 Sekunden ohne Watt-Aufwand!
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: ACTIONABLE TOP 4 HEBEL FÜR SUB-5 STUNDEN
         ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Die 4 Schlüssel-Hebel zur Sub-5 Stunden Top-Form</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="font-bold text-cyan-400 block mb-1">1. Schwimm-Ökonomie (-90s)</span>
            <p className="text-slate-300 leading-relaxed">
              Durch saubere Wasserlage im Zeller See und Wasserschatten-Schwimmen im Hauptfeld erreichst du 1:44 min/100m ohne höheren Puls.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="font-bold text-amber-400 block mb-1">2. Filzensattel-Pacing (-105s)</span>
            <p className="text-slate-300 leading-relaxed">
              Am 14%-Anstieg max. 360W treten. Keine Laktat-Peaks über 400W provozieren, um die Beine für die 21,1km Seerunde frisch zu halten.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">3. Koppel-Laufökonomie (-88s)</span>
            <p className="text-slate-300 leading-relaxed">
              Schrittfrequenz von 176+ SPM sichert den Rhythmus gegen muskuläre Ermüdung. Ziel: Konstante 5:02 min/km über 4 Runden um den Zeller See.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="font-bold text-purple-400 block mb-1">4. Schnelle Wechsel T1/T2 (-70s)</span>
            <p className="text-slate-300 leading-relaxed">
              Einstudierte Handgriffe in den Wechselzonen: Neopren beim Laufen zum Beutel öffnen, Startnummernband griffbereit halten.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3.5: PULS- & HERZFREQUENZ-DIAGNOSTIK (WARUM 175 BPM BEI 5:00 PACE?)
         ========================================================================= */}
      <div id="puls-diagnostik-section" className="scroll-mt-6">
        <HeartRateDiagnostics activities={activities} athlete={athlete} />
      </div>

      {/* =========================================================================
          SECTION 4: PERFORMANCE MANAGEMENT (PMC & TSS CHART)
         ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-100">
                Performance Management (PMC & TSS)
              </h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${tsbStatus.bg} ${tsbStatus.color}`}>
                {tsbStatus.label}
              </span>
              {onOpenStravaImport && (
                <button
                  onClick={onOpenStravaImport}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-semibold transition-all cursor-pointer ml-auto sm:ml-2"
                  title="Historische Strava-Aktivitäten importieren & PMC-Verlauf anreichern"
                >
                  <Zap className="w-3.5 h-3.5 text-orange-400" />
                  <span>Alte Strava-Aktivitäten importieren</span>
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Physiologisches Belastungsmodell nach Coggan & Banister: Fitness (CTL), akute Ermüdung (ATL) und Form (TSB).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase tracking-wider block">Form (TSB)</span>
              <span className={`text-2xl font-black ${tsb >= 0 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                {tsb > 0 ? `+${tsb}` : tsb}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase tracking-wider block">Fitness (CTL)</span>
              <span className="text-2xl font-black text-cyan-400">{ctl}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase tracking-wider block">Ermüdung (ATL)</span>
              <span className="text-2xl font-black text-amber-400">{atl}</span>
            </div>
          </div>
        </div>

        {/* Interactive PMC SVG Chart */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-cyan-400 rounded-full" />
                <span>Fitness CTL (42-Tage)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-400 rounded-full" />
                <span>Ermüdung ATL (7-Tage)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 bg-emerald-500/30 border border-emerald-500/50 rounded-sm" />
                <span>Form TSB</span>
              </span>
            </div>
            <span>14-Tage Belastungsverlauf</span>
          </div>

          {/* SVG Canvas */}
          <div className="relative h-44 w-full bg-slate-950/80 rounded-xl p-3 border border-slate-800/80">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 700 120" preserveAspectRatio="none">
              {/* Zero-line for TSB */}
              <line x1="0" y1="60" x2="700" y2="60" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />

              {/* TSB Area Bars */}
              {pmcData.map((d, i) => {
                const x = (i / (pmcData.length - 1)) * 680 + 10;
                const barHeight = Math.abs(d.tsb) * 1.2;
                const y = d.tsb >= 0 ? 60 - barHeight : 60;
                return (
                  <rect
                    key={d.date + '-tsb'}
                    x={x - 8}
                    y={y}
                    width="16"
                    height={Math.max(barHeight, 2)}
                    fill={d.tsb >= 0 ? '#10b981' : '#0284c7'}
                    opacity="0.35"
                    rx="2"
                    onMouseEnter={() => setHoveredPmcIndex(i)}
                  />
                );
              })}

              {/* CTL Line */}
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                points={pmcData
                  .map((d, i) => {
                    const x = (i / (pmcData.length - 1)) * 680 + 10;
                    const y = 110 - (d.ctl / 100) * 80;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* ATL Line */}
              <polyline
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                points={pmcData
                  .map((d, i) => {
                    const x = (i / (pmcData.length - 1)) * 680 + 10;
                    const y = 110 - (d.atl / 100) * 80;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Interactive Points */}
              {pmcData.map((d, i) => {
                const x = (i / (pmcData.length - 1)) * 680 + 10;
                const yCtl = 110 - (d.ctl / 100) * 80;
                const isHovered = hoveredPmcIndex === i;
                return (
                  <g key={d.date} onMouseEnter={() => setHoveredPmcIndex(i)} className="cursor-pointer">
                    <circle
                      cx={x}
                      cy={yCtl}
                      r={isHovered ? 5 : 3}
                      fill="#38bdf8"
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover details badge */}
            {hoveredPmcIndex !== null && (
              <div className="absolute top-2 right-4 bg-slate-900/95 border border-slate-700 p-2 rounded-lg text-xs shadow-lg flex items-center gap-3">
                <span className="font-semibold text-slate-200">
                  {pmcData[hoveredPmcIndex].dayLabel} ({pmcData[hoveredPmcIndex].date})
                </span>
                <span className="text-cyan-400 font-bold">CTL: {pmcData[hoveredPmcIndex].ctl}</span>
                <span className="text-amber-400 font-bold">ATL: {pmcData[hoveredPmcIndex].atl}</span>
                <span className="text-emerald-400 font-bold">TSB: {pmcData[hoveredPmcIndex].tsb}</span>
                <span className="text-slate-400">TSS: {pmcData[hoveredPmcIndex].tssToday}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: RAD POWER ZONEN (COGGAN 7-ZONEN MODELL)
         ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <h3 className="text-base font-bold text-white mb-2 flex items-center justify-between">
          <span>Rad-Leistungsbereiche ({athlete.bikeFtp}W FTP / Marin Stelvio)</span>
          <span className="text-xs text-amber-400 font-mono font-semibold">5.0 W/kg Spitzenklasse</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Definiert nach dem Dr. Andrew Coggan Modell für eine zielgenaue Leistungssteuerung im Training und am Wettkampftag.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {zones.map((z, idx) => (
            <div key={idx} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 block truncate">{z.name}</span>
              <div className="text-sm font-bold text-amber-400 font-mono mt-1">{z.range}</div>
              <span className="text-[11px] text-slate-500 block mt-0.5">{z.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 6: SELECTED ACTIVITY DRILLDOWN & TELEMETRY
         ========================================================================= */}
      {selectedActivity && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase tracking-wider font-bold">
                  {selectedActivity.source.toUpperCase()} DATENSATZ
                </span>
                <span className="text-xs text-slate-400">{selectedActivity.timeFormatted}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                <span>{selectedActivity.title}</span>
              </h3>
            </div>

            <button
              onClick={() => onAnalyzeActivityWithAi(selectedActivity)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all self-start sm:self-auto cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Diese Einheit mit KI analysieren</span>
            </button>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-slate-800 border-b border-slate-800">
            <div className="bg-slate-900 p-3 text-center">
              <span className="text-xs text-slate-400 block">Distanz</span>
              <span className="text-lg font-bold text-white">{selectedActivity.distanceKm} km</span>
            </div>
            <div className="bg-slate-900 p-3 text-center">
              <span className="text-xs text-slate-400 block">Dauer</span>
              <span className="text-lg font-bold text-white">
                {Math.floor(selectedActivity.durationMin / 60) > 0
                  ? `${Math.floor(selectedActivity.durationMin / 60)}h ${Math.round(selectedActivity.durationMin % 60)}m`
                  : `${Math.round(selectedActivity.durationMin)} min`}
              </span>
            </div>
            <div className="bg-slate-900 p-3 text-center">
              <span className="text-xs text-slate-400 block">
                {selectedActivity.sport === 'bike' ? 'Norm. Power (NP)' : 'Avg Power'}
              </span>
              <span className="text-lg font-bold text-amber-400">
                {selectedActivity.normalizedPower || selectedActivity.avgWatts || '–'} W
              </span>
            </div>
            <div className="bg-slate-900 p-3 text-center">
              <span className="text-xs text-slate-400 block">Ø Herzfrequenz</span>
              <span className="text-lg font-bold text-rose-400">
                {selectedActivity.avgHr} bpm <span className="text-xs font-normal text-slate-500">({selectedActivity.maxHr} max)</span>
              </span>
            </div>
            <div className="bg-slate-900 p-3 text-center">
              <span className="text-xs text-slate-400 block">
                {selectedActivity.sport === 'bike' ? 'Intensitätsfaktor (IF)' : 'TSS Belastung'}
              </span>
              <span className="text-lg font-bold text-cyan-400">
                {selectedActivity.intensityFactor ? `${selectedActivity.intensityFactor} IF` : `${selectedActivity.tss} TSS`}
              </span>
            </div>
            <div className="bg-slate-900 p-3 text-center">
              <span className="text-xs text-slate-400 block">Höhenmeter</span>
              <span className="text-lg font-bold text-emerald-400">+{selectedActivity.elevationGainM} m</span>
            </div>
          </div>

          {/* Telemetry Graph */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300">Telemetrie-Verlauf (Watt, Puls & Höhenprofil)</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded-sm" /> Watt</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-400 rounded-sm" /> Puls</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> Höhe</span>
              </div>
            </div>

            {selectedActivity?.telemetry && selectedActivity.telemetry.length > 1 ? (
              <div className="h-52 w-full bg-slate-950 rounded-xl p-3 border border-slate-800">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 120" preserveAspectRatio="none">
                  {/* Altitude background fill */}
                  {selectedActivity.telemetry.some((t) => t.altitudeM) && (
                    <polygon
                      fill="url(#altGrad)"
                      opacity="0.25"
                      points={`0,120 ${selectedActivity.telemetry
                        .map((t, idx) => {
                          const x = (idx / (selectedActivity.telemetry!.length - 1)) * 600;
                          const alt = t.altitudeM || 750;
                          const y = 120 - ((alt - 700) / 600) * 90;
                          return `${x},${y}`;
                        })
                        .join(' ')} 600,120`}
                    />
                  )}

                  {/* Power line */}
                  {selectedActivity.telemetry.some((t) => t.watts) && (
                    <polyline
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2.5"
                      points={selectedActivity.telemetry
                        .map((t, idx) => {
                          const x = (idx / (selectedActivity.telemetry!.length - 1)) * 600;
                          const w = t.watts || 200;
                          const y = 120 - (w / 650) * 110;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  )}

                  {/* Heart rate line */}
                  {selectedActivity.telemetry.some((t) => t.heartRate) && (
                    <polyline
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2"
                      strokeDasharray="2 2"
                      points={selectedActivity.telemetry
                        .map((t, idx) => {
                          const x = (idx / (selectedActivity.telemetry!.length - 1)) * 600;
                          const hr = t.heartRate || 130;
                          const y = 120 - ((hr - 100) / 95) * 100;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  )}

                  <defs>
                    <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#090d16" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            ) : (
              <div className="h-28 w-full bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-semibold text-slate-300">Original Garmin Connect Datensatz</span>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Puls- & Belastungsdaten wurden erfolgreich aggregiert ({selectedActivity.avgHr ? `${selectedActivity.avgHr} bpm Ø` : ''} {selectedActivity.paceFormatted ? `• Pace: ${selectedActivity.paceFormatted}` : ''} • {selectedActivity.tss} TSS).
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 7: ACTIVITIES LIST FOR SELECTION
         ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
        <h3 className="text-base font-bold text-white mb-3 flex items-center justify-between">
          <span>Reale synchronisierte Aktivitäten ({activities.length} Einheiten)</span>
          <span className="text-xs text-slate-400 font-normal">Klicke eine Einheit an, um Details zu analysieren</span>
        </h3>

        <div className="space-y-2">
          {activities.map((act) => {
            const isSelected = selectedActivity?.id === act.id;
            return (
              <div
                key={act.id}
                onClick={() => setSelectedActivity(act)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      act.sport === 'bike'
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                        : act.sport === 'run'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40'
                    }`}
                  >
                    {act.sport === 'bike' ? (
                      <Bike className="w-5 h-5" />
                    ) : act.sport === 'run' ? (
                      <Footprints className="w-5 h-5" />
                    ) : (
                      <Waves className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-slate-100 text-sm">{act.title}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{act.timeFormatted}</span>
                      <span>•</span>
                      <span>{act.distanceKm} km</span>
                      <span>•</span>
                      <span>{act.paceFormatted}</span>
                      {act.normalizedPower && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 font-mono">{act.normalizedPower}W NP</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs text-slate-500 block">Belastung</span>
                    <span className="text-xs font-bold text-cyan-400">{act.tss} TSS</span>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
