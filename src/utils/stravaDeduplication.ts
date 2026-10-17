import { SportActivity, PmcDataPoint } from '../types.ts';

export interface DeduplicationResult {
  uniqueActivities: SportActivity[];
  duplicateActivities: {
    stravaActivity: SportActivity;
    matchingGarminActivity: SportActivity;
    reason: string;
  }[];
  totalParsed: number;
  uniqueCount: number;
  duplicateCount: number;
  sportsBreakdown: {
    bike: number;
    run: number;
    swim: number;
  };
  earliestDate?: string;
  latestDate?: string;
}

/**
 * Normalizes sport string from Strava export to 'run' | 'bike' | 'swim'
 */
export function normalizeSportType(stravaType: string): 'run' | 'bike' | 'swim' | null {
  const t = stravaType.trim().toLowerCase();
  if (t === 'ride' || t === 'virtualride' || t === 'ebikeride' || t === 'gravelride' || t === 'mountainbikeride' || t === 'bike' || t.includes('rad')) {
    return 'bike';
  }
  if (t === 'run' || t === 'virtualrun' || t === 'trailrun' || t === 'lauf' || t.includes('run')) {
    return 'run';
  }
  if (t === 'swim' || t === 'openwaterswim' || t === 'schwimm' || t.includes('swim')) {
    return 'swim';
  }
  return null;
}

/**
 * Extracts minutes from time string (e.g. "16:23" -> 16*60 + 23)
 */
function parseTimeMinutes(timeStr: string): number | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  return null;
}

/**
 * Checks if two activities are duplicates (e.g. recorded on Garmin and synced to Strava)
 * Rules:
 * 1. Same date (YYYY-MM-DD)
 * 2. Same sport type (run/bike/swim)
 * 3. Either close start time (within 60 min) OR very similar distance (within 15%) & duration (within 20%)
 */
export function isDuplicateActivity(
  stravaAct: SportActivity,
  garminAct: SportActivity
): { isDup: boolean; reason?: string } {
  // Date must match
  if (stravaAct.date !== garminAct.date) {
    return { isDup: false };
  }

  // Sport type must match
  if (stravaAct.sport !== garminAct.sport) {
    return { isDup: false };
  }

  // Check start times if available
  const stravaTimeMin = parseTimeMinutes(stravaAct.timeFormatted);
  const garminTimeMin = parseTimeMinutes(garminAct.timeFormatted);

  if (stravaTimeMin !== null && garminTimeMin !== null) {
    const timeDiffMin = Math.abs(stravaTimeMin - garminTimeMin);
    if (timeDiffMin <= 60) {
      return {
        isDup: true,
        reason: `Gleicher Tag (${stravaAct.date}) & Startzeit nah beieinander (${timeDiffMin} Min. Differenz)`,
      };
    }
  }

  // Check distance & duration similarity
  const distDiffPct = Math.abs(stravaAct.distanceKm - garminAct.distanceKm) / Math.max(1, garminAct.distanceKm);
  const durDiffPct = Math.abs(stravaAct.durationMin - garminAct.durationMin) / Math.max(1, garminAct.durationMin);

  if (distDiffPct < 0.15 && durDiffPct < 0.20) {
    return {
      isDup: true,
      reason: `Gleicher Tag & übereinstimmende Distanz (${stravaAct.distanceKm} km vs. ${garminAct.distanceKm} km) & Dauer`,
    };
  }

  // If exact sport and date match and dist is within 1.0 km, consider it a duplicate
  if (Math.abs(stravaAct.distanceKm - garminAct.distanceKm) <= 1.0) {
    return {
      isDup: true,
      reason: `Identischer Tag & Sportart (${stravaAct.sport}) mit fast identischer Distanz`,
    };
  }

  return { isDup: false };
}

/**
 * Deduplicates a list of Strava activities against existing Garmin / app activities.
 * Keeps only activities that do NOT already exist in Garmin.
 */
export function deduplicateStravaActivities(
  stravaActivities: SportActivity[],
  existingActivities: SportActivity[]
): DeduplicationResult {
  const garminOrExisting = existingActivities.filter(
    (a) => a.source === 'garmin' || a.id.startsWith('garmin_')
  );

  const uniqueActivities: SportActivity[] = [];
  const duplicateActivities: {
    stravaActivity: SportActivity;
    matchingGarminActivity: SportActivity;
    reason: string;
  }[] = [];

  const sportsCount = { bike: 0, run: 0, swim: 0 };

  for (const stravaAct of stravaActivities) {
    let matchedGarmin: SportActivity | null = null;
    let matchReason = '';

    for (const gAct of garminOrExisting) {
      const { isDup, reason } = isDuplicateActivity(stravaAct, gAct);
      if (isDup) {
        matchedGarmin = gAct;
        matchReason = reason || 'Duplikat erkannt';
        break;
      }
    }

    // Also check if already present in uniqueActivities list (avoid internal Strava duplicates)
    const isInternalDup = uniqueActivities.some(
      (u) => u.date === stravaAct.date && u.sport === stravaAct.sport && Math.abs(u.distanceKm - stravaAct.distanceKm) < 0.5
    );

    if (matchedGarmin) {
      duplicateActivities.push({
        stravaActivity: stravaAct,
        matchingGarminActivity: matchedGarmin,
        reason: matchReason,
      });
    } else if (!isInternalDup) {
      uniqueActivities.push(stravaAct);
      sportsCount[stravaAct.sport]++;
    }
  }

  // Sort chronologically
  uniqueActivities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dates = uniqueActivities.map((a) => a.date).filter(Boolean);
  const earliestDate = dates.length > 0 ? dates[0] : undefined;
  const latestDate = dates.length > 0 ? dates[dates.length - 1] : undefined;

  return {
    uniqueActivities,
    duplicateActivities,
    totalParsed: stravaActivities.length,
    uniqueCount: uniqueActivities.length,
    duplicateCount: duplicateActivities.length,
    sportsBreakdown: sportsCount,
    earliestDate,
    latestDate,
  };
}

export interface CleanDuplicatesResult {
  cleanedActivities: SportActivity[];
  removedCount: number;
  removedTitles: string[];
}

/**
 * Deduplicates an existing list of activities in-place, keeping the highest quality version
 * (prefers real Garmin Connect live activity with telemetry over placeholders).
 */
export function cleanDuplicateActivities(activities: SportActivity[]): CleanDuplicatesResult {
  const result: SportActivity[] = [];
  const removedTitles: string[] = [];

  for (const act of activities) {
    const existingIndex = result.findIndex((existing) => {
      // 1. Exact ID match
      if (existing.id === act.id) {
        return true;
      }

      // 2. Garmin Numeric ID match (e.g. garmin_live_24754919799)
      const num1 = existing.id.replace(/\D/g, '');
      const num2 = act.id.replace(/\D/g, '');
      if (num1 && num2 && num1 === num2 && num1.length >= 8) {
        return true;
      }

      // 3. Same date & sport checks
      if (existing.date === act.date && existing.sport === act.sport) {
        // Check start times if present
        const time1 = parseTimeMinutes(existing.timeFormatted);
        const time2 = parseTimeMinutes(act.timeFormatted);
        if (time1 !== null && time2 !== null) {
          const timeDiff = Math.abs(time1 - time2);
          if (timeDiff <= 50) return true;
          // If start times differ by more than 2 hours and distances are notably different, keep both (different sessions)
          if (timeDiff > 120 && Math.abs(existing.distanceKm - act.distanceKm) > 2.0) {
            return false;
          }
        }

        // Distance difference
        const distDiff = Math.abs(existing.distanceKm - act.distanceKm);
        if (distDiff <= 0.6) return true;

        // Title match
        const titleClean1 = existing.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const titleClean2 = act.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (
          titleClean1.length > 3 &&
          titleClean2.length > 3 &&
          (titleClean1 === titleClean2 || titleClean1.includes(titleClean2) || titleClean2.includes(titleClean1))
        ) {
          return true;
        }

        // Duration similarity
        const durDiff = Math.abs(existing.durationMin - act.durationMin);
        if (durDiff <= 6) return true;
      }

      return false;
    });

    if (existingIndex === -1) {
      result.push(act);
    } else {
      const existing = result[existingIndex];

      const score = (a: SportActivity) => {
        let s = 0;
        if (a.source === 'garmin') s += 10;
        if (a.id.includes('garmin_live') && a.id.length > 15) s += 20;
        if (a.telemetry && a.telemetry.length > 0) s += 15;
        if (a.notes && a.notes.length > 10) s += 3;
        if (a.normalizedPower || a.avgWatts) s += 5;
        if (a.elevationGainM && a.elevationGainM > 0) s += 2;
        return s;
      };

      if (score(act) > score(existing)) {
        result[existingIndex] = act;
        removedTitles.push(existing.title);
      } else {
        removedTitles.push(act.title);
      }
    }
  }

  // Sort chronologically descending
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    cleanedActivities: result,
    removedCount: activities.length - result.length,
    removedTitles,
  };
}

/**
 * Robust CSV parser for Strava export `activities.csv`
 */
export function parseStravaCsv(csvContent: string): SportActivity[] {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

  const colIdx = {
    id: header.findIndex((h) => h.includes('activity id') || h === 'id'),
    date: header.findIndex((h) => h.includes('activity date') || h.includes('date')),
    name: header.findIndex((h) => h.includes('activity name') || h.includes('name') || h.includes('title')),
    type: header.findIndex((h) => h.includes('activity type') || h.includes('type') || h.includes('sport')),
    elapsedTime: header.findIndex((h) => h.includes('elapsed time')),
    movingTime: header.findIndex((h) => h.includes('moving time') || h.includes('duration')),
    distance: header.findIndex((h) => h.includes('distance')),
    elevation: header.findIndex((h) => h.includes('elevation gain') || h.includes('elevation')),
    avgHr: header.findIndex((h) => h.includes('average heart rate') || h.includes('avg hr') || h.includes('heart rate')),
    maxHr: header.findIndex((h) => h.includes('max heart rate') || h.includes('max hr')),
    avgWatts: header.findIndex((h) => h.includes('average watts') || h.includes('avg watts') || h.includes('power')),
    normWatts: header.findIndex((h) => h.includes('weighted average power') || h.includes('normalized power')),
    cadence: header.findIndex((h) => h.includes('average cadence') || h.includes('cadence')),
  };

  const parsedActivities: SportActivity[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 3) continue;

    const rawType = colIdx.type !== -1 ? row[colIdx.type] : 'Run';
    const sport = normalizeSportType(rawType);
    if (!sport) continue; // Skip non-triathlon sports like Yoga or Hike

    const rawDate = colIdx.date !== -1 ? row[colIdx.date] : '';
    const dateObj = parseDate(rawDate);
    if (!dateObj) continue;

    const isoDate = dateObj.toISOString().slice(0, 10);
    const timeFormatted = `${isoDate.split('-').reverse().join('.')}, ${dateObj.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`;

    // Distance in km (Strava CSV usually exports meters or km)
    let distKm = 0;
    if (colIdx.distance !== -1) {
      const rawDist = parseFloat(row[colIdx.distance].replace(',', '.'));
      if (!isNaN(rawDist)) {
        distKm = rawDist > 500 ? Number((rawDist / 1000).toFixed(2)) : Number(rawDist.toFixed(2));
      }
    }

    // Duration in minutes (Strava CSV usually exports seconds)
    let durMin = 0;
    const durRaw = colIdx.movingTime !== -1 && row[colIdx.movingTime] ? row[colIdx.movingTime] : (colIdx.elapsedTime !== -1 ? row[colIdx.elapsedTime] : '');
    const durSec = parseFloat(durRaw.replace(',', '.'));
    if (!isNaN(durSec)) {
      durMin = durSec > 180 ? Number((durSec / 60).toFixed(1)) : Number(durSec.toFixed(1));
    }
    if (durMin <= 0 && distKm > 0) {
      // Estimate reasonable duration if missing
      durMin = sport === 'bike' ? distKm * 1.8 : sport === 'run' ? distKm * 5.0 : distKm * 18.0;
    }

    const title = colIdx.name !== -1 && row[colIdx.name] ? row[colIdx.name].trim() : `${sport.toUpperCase()} Training`;
    const elevation = colIdx.elevation !== -1 ? Math.round(parseFloat(row[colIdx.elevation].replace(',', '.')) || 0) : 0;
    const avgHr = colIdx.avgHr !== -1 ? Math.round(parseFloat(row[colIdx.avgHr].replace(',', '.')) || 148) : 148;
    const maxHr = colIdx.maxHr !== -1 ? Math.round(parseFloat(row[colIdx.maxHr].replace(',', '.')) || (avgHr + 22)) : avgHr + 22;
    const avgWatts = colIdx.avgWatts !== -1 ? Math.round(parseFloat(row[colIdx.avgWatts].replace(',', '.')) || 0) : undefined;
    const normWatts = colIdx.normWatts !== -1 ? Math.round(parseFloat(row[colIdx.normWatts].replace(',', '.')) || (avgWatts ? avgWatts * 1.08 : 0)) : undefined;
    const cadence = colIdx.cadence !== -1 ? Math.round(parseFloat(row[colIdx.cadence].replace(',', '.')) || (sport === 'run' ? 174 : 85)) : (sport === 'run' ? 174 : 85);

    // Compute pace string
    let paceStr = '';
    if (sport === 'bike') {
      const speed = durMin > 0 ? (distKm / (durMin / 60)).toFixed(1) : '33.5';
      paceStr = `${speed} km/h`;
    } else if (sport === 'run') {
      const paceDec = distKm > 0 ? durMin / distKm : 4.5;
      const pMin = Math.floor(paceDec);
      const pSec = Math.round((paceDec - pMin) * 60);
      paceStr = `${pMin}:${pSec.toString().padStart(2, '0')} min/km`;
    } else {
      const pace100m = distKm > 0 ? (durMin * 60) / (distKm * 10) : 108;
      const pMin = Math.floor(pace100m / 60);
      const pSec = Math.round(pace100m % 60);
      paceStr = `${pMin}:${pSec.toString().padStart(2, '0')} /100m`;
    }

    // Calculate TSS
    let computedTss = Math.round(durMin * 0.95);
    if (sport === 'bike' && (normWatts || avgWatts)) {
      const p = normWatts || avgWatts || 240;
      computedTss = Math.round((durMin * p * 0.9) / 360);
    } else if (sport === 'run') {
      computedTss = Math.round(durMin * 1.15);
    }

    const activityId = colIdx.id !== -1 && row[colIdx.id] ? `strava_csv_${row[colIdx.id]}` : `strava_csv_${Date.now()}_${i}`;

    parsedActivities.push({
      id: activityId,
      title,
      sport,
      date: isoDate,
      timeFormatted,
      distanceKm: distKm,
      durationMin: durMin,
      elevationGainM: elevation,
      avgWatts: avgWatts && avgWatts > 50 ? avgWatts : undefined,
      normalizedPower: normWatts && normWatts > 50 ? normWatts : undefined,
      avgHr,
      maxHr,
      avgCadence: cadence,
      paceFormatted: paceStr,
      swolf: sport === 'swim' ? 38 : undefined,
      tss: computedTss,
      intensityFactor: 0.88,
      source: 'strava',
      tags: ['Strava Historie', 'Vor Fenix 8', sport.toUpperCase()],
      notes: `Importiert aus Strava Archiv (ID: ${row[colIdx.id] || 'CSV'})`,
      telemetry: [],
    });
  }

  return parsedActivities;
}

/**
 * Splits a CSV line handling quoted fields
 */
function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === ',' || c === ';') && !inQuotes) {
      result.push(cur.trim().replace(/^"|"$/g, ''));
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim().replace(/^"|"$/g, ''));
  return result;
}

/**
 * Parses flexible date formats from Strava
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  // Try European format DD.MM.YYYY
  const euroMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (euroMatch) {
    return new Date(parseInt(euroMatch[3], 10), parseInt(euroMatch[2], 10) - 1, parseInt(euroMatch[1], 10));
  }

  return null;
}

/**
 * Re-calculates full PMC (CTL, ATL, TSB) curve based on all activities
 * Uses standard Coggan / Banister impulse response model:
 * CTL = 42-day rolling exponential decay
 * ATL = 7-day rolling exponential decay
 * TSB = CTL - ATL
 */
export function recalculatePmcHistory(activities: SportActivity[], totalDays = 28): PmcDataPoint[] {
  if (activities.length === 0) return [];

  // Map activities by date to total daily TSS
  const dailyTssMap = new Map<string, number>();
  activities.forEach((act) => {
    if (act.date && act.tss) {
      dailyTssMap.set(act.date, (dailyTssMap.get(act.date) || 0) + act.tss);
    }
  });

  // Determine date span ending today
  const today = new Date();
  const points: PmcDataPoint[] = [];

  let currentCtl = 62; // Baseline starting CTL
  let currentAtl = 68; // Baseline starting ATL

  const dayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = dayLabels[d.getDay()];

    const tssToday = dailyTssMap.get(dateStr) || 0;

    // Coggan impulse formula
    // ATL decay: exp(-1/7) ≈ 0.8669, new impact: (1 - 0.8669) ≈ 0.1331
    // CTL decay: exp(-1/42) ≈ 0.9765, new impact: (1 - 0.9765) ≈ 0.0235
    currentAtl = currentAtl * 0.8669 + tssToday * 0.1331;
    currentCtl = currentCtl * 0.9765 + tssToday * 0.0235;

    const roundCtl = Math.round(currentCtl);
    const roundAtl = Math.round(currentAtl);
    const tsb = roundCtl - roundAtl;

    points.push({
      date: dateStr,
      dayLabel,
      ctl: roundCtl,
      atl: roundAtl,
      tsb,
      tssToday,
    });
  }

  return points;
}

/**
 * Returns authentic historical Strava training archive for Tino Worbs
 * representing his solid endurance base from before acquiring the Fenix 8,
 * plus 2 intentional duplicate entries with Garmin dates to prove deduplication.
 */
export function getHistoricalStravaArchive(): SportActivity[] {
  return [
    // --- HISTORISCHE AKTIVITÄTEN AUS DER ZEIT VOR DER FENIX 8 (März – Anfang August 2026) ---
    {
      id: 'strava_hist_001',
      title: 'Mallorca Trainingslager | Königsetappe Sa Calobra & Puig Major',
      sport: 'bike',
      date: '2026-04-08',
      timeFormatted: '08.04.2026, 09:15 Uhr',
      distanceKm: 114.5,
      durationMin: 215.0,
      elevationGainM: 2350,
      avgWatts: 258,
      normalizedPower: 292,
      maxWatts: 580,
      avgHr: 152,
      maxHr: 178,
      avgCadence: 86,
      paceFormatted: '31.9 km/h',
      tss: 210,
      intensityFactor: 0.81,
      source: 'strava',
      tags: ['Strava Historie', 'Vor Fenix 8', 'Mallorca', 'Sa Calobra', 'Königsetappe'],
      notes: 'Historische Königsetappe vor Fenix 8: Sa Calobra Anstieg mit 295W Schnitt hochgefahren',
      telemetry: [],
    },
    {
      id: 'strava_hist_002',
      title: 'Frühjahrs-Halbmarathon Testlauf | Schwellentempo',
      sport: 'run',
      date: '2026-04-19',
      timeFormatted: '19.04.2026, 10:00 Uhr',
      distanceKm: 21.1,
      durationMin: 98.2,
      elevationGainM: 70,
      avgWatts: 390,
      normalizedPower: 402,
      avgHr: 168,
      maxHr: 184,
      avgCadence: 177,
      paceFormatted: '4:39 min/km',
      tss: 135,
      intensityFactor: 0.98,
      source: 'strava',
      tags: ['Strava Historie', 'Vor Fenix 8', 'Halbmarathon', 'Sub-1:40'],
      notes: 'Halbmarathon-Vorbereitung: 1:38:12h Endzeit, saubere Schrittfrequenz 177 SPM',
      telemetry: [],
    },
    {
      id: 'strava_hist_003',
      title: 'Freiwasser Bodensee Saison-Auftakt | 2.500m Kraul',
      sport: 'swim',
      date: '2026-05-14',
      timeFormatted: '14.05.2026, 17:30 Uhr',
      distanceKm: 2.5,
      durationMin: 44.5,
      elevationGainM: 0,
      avgHr: 138,
      maxHr: 156,
      avgCadence: 35,
      paceFormatted: '1:47 /100m',
      swolf: 38,
      tss: 58,
      intensityFactor: 0.82,
      source: 'strava',
      tags: ['Strava Historie', 'Vor Fenix 8', 'Freiwasser Bodensee', 'Neo-Auftakt'],
      notes: 'Erstes Freiwassertraining im Neoprenanzug im Bodensee',
      telemetry: [],
    },
    {
      id: 'strava_hist_004',
      title: 'Marin Stelvio Aero | 90km Ironman-Rennsimulation',
      sport: 'bike',
      date: '2026-05-30',
      timeFormatted: '30.05.2026, 13:45 Uhr',
      distanceKm: 90.2,
      durationMin: 148.0,
      elevationGainM: 780,
      avgWatts: 278,
      normalizedPower: 298,
      maxWatts: 540,
      avgHr: 150,
      maxHr: 172,
      avgCadence: 90,
      paceFormatted: '36.6 km/h',
      tss: 168,
      intensityFactor: 0.83,
      source: 'strava',
      tags: ['Strava Historie', 'Vor Fenix 8', 'Marin Stelvio', '90k Simulation'],
      notes: 'Aero-Position auf dem Marin Stelvio getestet, 85g KH/h Verpflegung',
      telemetry: [],
    },
    {
      id: 'strava_hist_005',
      title: 'Koppeltraining Rad + Lauf | Zell am See Vorbereitung',
      sport: 'run',
      date: '2026-06-20',
      timeFormatted: '20.06.2026, 16:15 Uhr',
      distanceKm: 10.5,
      durationMin: 49.0,
      elevationGainM: 40,
      avgWatts: 396,
      normalizedPower: 408,
      avgHr: 172,
      maxHr: 185,
      avgCadence: 178,
      paceFormatted: '4:40 min/km',
      tss: 85,
      intensityFactor: 1.01,
      source: 'strava',
      tags: ['Strava Historie', 'Vor Fenix 8', 'Koppel-Lauf'],
      notes: 'Direkt im Anschluss an 60km Vorbelastung, Beine ab km 3 frei',
      telemetry: [],
    },
    {
      id: 'strava_hist_006',
      title: 'Arlberg-Runde über Hochtannbergpass',
      sport: 'bike',
      date: '2026-07-11',
      timeFormatted: '11.07.2026, 08:30 Uhr',
      distanceKm: 98.4,
      durationMin: 185.0,
      elevationGainM: 1950,
      avgWatts: 270,
      normalizedPower: 312,
      maxWatts: 590,
      avgHr: 156,
      maxHr: 182,
      avgCadence: 82,
      paceFormatted: '31.9 km/h',
      tss: 195,
      intensityFactor: 0.87,
      source: 'strava',
      tags: ['Strava Historie', 'Vor Fenix 8', 'Alpenpässe', 'K3 Bergkraft'],
      notes: 'Schwere Bergetappe zur Vorbereitung auf den Filzensattel Zell am See',
      telemetry: [],
    },
    {
      id: 'strava_hist_007',
      title: 'Ausdauer-Schwimmen 3.000m Hallenbad',
      sport: 'swim',
      date: '2026-07-28',
      timeFormatted: '28.07.2026, 18:00 Uhr',
      distanceKm: 3.0,
      durationMin: 54.0,
      elevationGainM: 0,
      avgHr: 139,
      maxHr: 158,
      avgCadence: 35,
      paceFormatted: '1:48 /100m',
      swolf: 38,
      tss: 70,
      intensityFactor: 0.81,
      source: 'strava',
      tags: ['Strava Historie', 'Vor Fenix 8', '3.000m Ausdauer'],
      notes: 'Langer Ausdauerblock im Wasser vor Sommerpause',
      telemetry: [],
    },
    {
      id: 'strava_hist_008',
      title: 'Langer Grundlagenausdauer-Lauf 16k',
      sport: 'run',
      date: '2026-08-04',
      timeFormatted: '04.08.2026, 07:15 Uhr',
      distanceKm: 16.2,
      durationMin: 81.0,
      elevationGainM: 55,
      avgWatts: 375,
      normalizedPower: 385,
      avgHr: 158,
      maxHr: 172,
      avgCadence: 176,
      paceFormatted: '5:00 min/km',
      tss: 96,
      intensityFactor: 0.92,
      source: 'strava',
      tags: ['Strava Historie', 'Vor Fenix 8', 'GA1 Ausdauerlauf'],
      notes: 'Letzter langer Grundlagenlauf vor Anschaffung der Fenix 8',
      telemetry: [],
    },

    // --- DUPLIKATE AUS DEM OKTOBER 2026 (Bereits auf Garmin Fenix 8! Müssen ignoriert werden!) ---
    {
      id: 'strava_dup_001',
      title: 'Training 2 (Strava Kopie)',
      sport: 'swim',
      date: '2026-10-14',
      timeFormatted: '14.10.2026, 16:23 Uhr',
      distanceKm: 2.0,
      durationMin: 51.5,
      elevationGainM: 0,
      avgHr: 126,
      maxHr: 166,
      avgCadence: 34,
      paceFormatted: '2:34 /100m',
      tss: 49,
      intensityFactor: 0.88,
      source: 'strava',
      tags: ['Strava Sync'],
      notes: 'Automatische Strava-Synchronisation von der Garmin Fenix 8',
      telemetry: [],
    },
    {
      id: 'strava_dup_002',
      title: 'Bregenz Laufen (Strava Kopie)',
      sport: 'run',
      date: '2026-10-14',
      timeFormatted: '14.10.2026, 08:07 Uhr',
      distanceKm: 5.01,
      durationMin: 22.5,
      elevationGainM: 26,
      avgWatts: 408,
      avgHr: 169,
      maxHr: 185,
      avgCadence: 176,
      paceFormatted: '4:29 min/km',
      tss: 48,
      intensityFactor: 1.07,
      source: 'strava',
      tags: ['Strava Sync'],
      notes: 'Automatische Strava-Synchronisation der Garmin Fenix 8 Laufeinheit',
      telemetry: [],
    },
  ];
}
