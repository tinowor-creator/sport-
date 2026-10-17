import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Bike, Footprints, Waves, Clock, Calendar, Heart, Zap, MapPin, AlignLeft, Info } from 'lucide-react';
import { SportActivity, AthleteProfile } from '../types.ts';

interface ManualActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveActivity: (activity: SportActivity) => void;
  athlete: AthleteProfile;
  initialActivity?: SportActivity | null;
}

export const ManualActivityModal: React.FC<ManualActivityModalProps> = ({
  isOpen,
  onClose,
  onSaveActivity,
  athlete,
  initialActivity,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const nowTimeStr = new Date().toTimeString().slice(0, 5);

  const [sport, setSport] = useState<'bike' | 'run' | 'swim'>('bike');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(nowTimeStr);
  const [distanceKm, setDistanceKm] = useState<number>(45);
  const [durationHours, setDurationHours] = useState<number>(1);
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [avgWatts, setAvgWatts] = useState<number>(280);
  const [normalizedPower, setNormalizedPower] = useState<number>(310);
  const [avgHr, setAvgHr] = useState<number>(152);
  const [maxHr, setMaxHr] = useState<number>(175);
  const [avgCadence, setAvgCadence] = useState<number>(88);
  const [elevationGainM, setElevationGainM] = useState<number>(450);
  const [swolf, setSwolf] = useState<number>(38);
  const [source, setSource] = useState<'garmin' | 'strava' | 'manual'>('garmin');
  const [notes, setNotes] = useState('');

  // Load existing data if editing
  useEffect(() => {
    if (initialActivity) {
      setSport(initialActivity.sport);
      setTitle(initialActivity.title);
      setDate(initialActivity.date || todayStr);
      const timeMatch = initialActivity.timeFormatted?.match(/\d{2}:\d{2}/);
      if (timeMatch) setTime(timeMatch[0]);
      setDistanceKm(initialActivity.distanceKm);
      const totalMins = initialActivity.durationMin;
      setDurationHours(Math.floor(totalMins / 60));
      setDurationMinutes(Math.round(totalMins % 60));
      setAvgWatts(initialActivity.avgWatts || 0);
      setNormalizedPower(initialActivity.normalizedPower || 0);
      setAvgHr(initialActivity.avgHr);
      setMaxHr(initialActivity.maxHr);
      setAvgCadence(initialActivity.avgCadence);
      setElevationGainM(initialActivity.elevationGainM);
      setSwolf(initialActivity.swolf || 38);
      setSource(initialActivity.source as any);
      setNotes(initialActivity.notes || '');
    } else {
      // Defaults for new activity
      setTitle(sport === 'bike' ? 'Marin Stelvio Ausfahrt' : sport === 'run' ? 'Schwellenlauf' : 'Zeller See Schwimmtraining');
      setDate(todayStr);
      setTime(nowTimeStr);
      if (sport === 'bike') {
        setDistanceKm(60);
        setDurationHours(1);
        setDurationMinutes(45);
        setAvgWatts(275);
        setNormalizedPower(310);
        setAvgCadence(88);
        setElevationGainM(600);
      } else if (sport === 'run') {
        setDistanceKm(10);
        setDurationHours(0);
        setDurationMinutes(46);
        setAvgWatts(380);
        setNormalizedPower(385);
        setAvgCadence(175);
        setElevationGainM(60);
      } else {
        setDistanceKm(2.0);
        setDurationHours(0);
        setDurationMinutes(38);
        setAvgCadence(34);
        setElevationGainM(0);
      }
    }
  }, [initialActivity, isOpen]);

  // When sport changes in create mode, adjust defaults
  const handleSportChange = (newSport: 'bike' | 'run' | 'swim') => {
    setSport(newSport);
    if (!initialActivity) {
      if (newSport === 'bike') {
        setTitle('Marin Stelvio Ausfahrt');
        setDistanceKm(65);
        setDurationHours(1);
        setDurationMinutes(50);
        setAvgWatts(285);
        setNormalizedPower(320);
        setAvgCadence(88);
        setElevationGainM(750);
      } else if (newSport === 'run') {
        setTitle('Lauf-Einheit (175 SPM Cadence)');
        setDistanceKm(12);
        setDurationHours(0);
        setDurationMinutes(54);
        setAvgWatts(385);
        setNormalizedPower(390);
        setAvgCadence(175);
        setElevationGainM(70);
      } else {
        setTitle('Schwimmen (Swolf-Fokus)');
        setDistanceKm(2.2);
        setDurationHours(0);
        setDurationMinutes(40);
        setAvgCadence(34);
        setElevationGainM(0);
        setSwolf(38);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const totalDurationMin = durationHours * 60 + durationMinutes;
    if (totalDurationMin <= 0) return;

    // Calculate pace / speed string
    let paceFormatted = '';
    if (sport === 'bike') {
      const speedKmh = (distanceKm / (totalDurationMin / 60)).toFixed(1);
      paceFormatted = `${speedKmh} km/h`;
    } else if (sport === 'run') {
      const paceDecimal = totalDurationMin / distanceKm;
      const paceMin = Math.floor(paceDecimal);
      const paceSec = Math.round((paceDecimal - paceMin) * 60);
      paceFormatted = `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec} min/km`;
    } else {
      const pace100mSec = (totalDurationMin * 60) / (distanceKm * 10);
      const pMin = Math.floor(pace100mSec / 60);
      const pSec = Math.round(pace100mSec % 60);
      paceFormatted = `${pMin}:${pSec < 10 ? '0' : ''}${pSec} /100m`;
    }

    // Calculate Intensity Factor (IF) and TSS
    const ftp = sport === 'bike' ? athlete.bikeFtp || 360 : athlete.runFtp || 380;
    const effectivePower = sport === 'bike' ? (normalizedPower || avgWatts || 260) : (avgWatts || 380);
    const intensityFactor = Number((effectivePower / ftp).toFixed(2));
    
    // TSS formula: (sec * NP * IF) / (FTP * 3600) * 100
    const durationSec = totalDurationMin * 60;
    const computedTss = Math.round(((durationSec * effectivePower * intensityFactor) / (ftp * 3600)) * 100) || Math.round(totalDurationMin * 0.9);

    // Format display time
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}.${month}.${year}`;
    const timeFormatted = `${formattedDate}, ${time} Uhr`;

    // Generate realistic telemetry array so graph renders nicely
    const telemetry = [];
    const steps = 7;
    for (let i = 0; i < steps; i++) {
      const factor = 0.85 + Math.sin((i / (steps - 1)) * Math.PI) * 0.35;
      telemetry.push({
        timeOffsetSec: Math.round((totalDurationMin * 60 * i) / (steps - 1)),
        watts: effectivePower ? Math.round(effectivePower * factor) : undefined,
        heartRate: Math.round(avgHr * (0.88 + factor * 0.15)),
        speedKmh: sport === 'bike' ? Math.round((distanceKm / (totalDurationMin / 60)) * factor) : undefined,
        altitudeM: elevationGainM ? Math.round(750 + elevationGainM * (i / (steps - 1))) : 750,
        cadence: avgCadence,
      });
    }

    const savedActivity: SportActivity = {
      id: initialActivity ? initialActivity.id : 'user_act_' + Date.now(),
      title: title || `${sport === 'bike' ? 'Rad' : sport === 'run' ? 'Lauf' : 'Schwimm'}-Einheit`,
      sport,
      date,
      timeFormatted,
      distanceKm: Number(distanceKm),
      durationMin: totalDurationMin,
      elevationGainM: Number(elevationGainM) || 0,
      avgWatts: avgWatts ? Number(avgWatts) : undefined,
      normalizedPower: normalizedPower ? Number(normalizedPower) : undefined,
      maxWatts: maxHr ? Math.round((avgWatts || 300) * 1.5) : undefined,
      avgHr: Number(avgHr) || 145,
      maxHr: Number(maxHr) || 170,
      avgCadence: Number(avgCadence) || (sport === 'run' ? 175 : 88),
      paceFormatted,
      swolf: sport === 'swim' ? Number(swolf) : undefined,
      tss: computedTss,
      intensityFactor,
      source: source || 'garmin',
      tags: ['Manuell erfasst', sport, source.toUpperCase()],
      telemetry,
      notes: notes || undefined,
    };

    onSaveActivity(savedActivity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {initialActivity ? 'Aktivität bearbeiten' : 'Eigene Aktivität hinzufügen'}
              </h3>
              <p className="text-xs text-slate-400">
                Erfasse dein Training exakt mit deinen echten Garmin- / Sensordaten.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Sport Selector Tabs */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">Disziplin auswählen</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSportChange('bike')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  sport === 'bike'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Radfahren</span>
              </button>

              <button
                type="button"
                onClick={() => handleSportChange('run')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  sport === 'run'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Footprints className="w-4 h-4" />
                <span>Laufen</span>
              </button>

              <button
                type="button"
                onClick={() => handleSportChange('swim')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  sport === 'swim'
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Waves className="w-4 h-4" />
                <span>Schwimmen</span>
              </button>
            </div>
          </div>

          {/* Activity Title */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Titel der Einheit</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Marin Stelvio Filzensattel-Simulation"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Date & Time (User explicitly requested exact control over dates and times!) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Exaktes Datum</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Start-Uhrzeit</span>
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Distance & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Distanz (km)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none font-semibold"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-500">km</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Dauer (Std. & Min.)</label>
              <div className="flex gap-2">
                <div className="relative w-1/2">
                  <input
                    type="number"
                    min="0"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-slate-500">h</span>
                </div>
                <div className="relative w-1/2">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-slate-500">min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Power / Watts (Bike & Run) */}
          {sport !== 'swim' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <label className="text-xs text-amber-400 flex items-center gap-1 mb-1 font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Ø Leistung (Watt)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={avgWatts}
                    onChange={(e) => setAvgWatts(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-400 font-bold focus:border-amber-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500">W</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-amber-400 flex items-center gap-1 mb-1 font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Normalized Power (NP)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={normalizedPower}
                    onChange={(e) => setNormalizedPower(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-400 font-bold focus:border-amber-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500">W</span>
                </div>
              </div>
            </div>
          )}

          {/* Heart Rate & Cadence */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Ø Herzfrequenz</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={avgHr}
                  onChange={(e) => setAvgHr(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-rose-400 font-bold focus:border-rose-400 focus:outline-none"
                />
                <span className="absolute right-2.5 top-2 text-xs text-slate-500">bpm</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Max. Herzfrequenz</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={maxHr}
                  onChange={(e) => setMaxHr(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-rose-400 focus:outline-none"
                />
                <span className="absolute right-2.5 top-2 text-xs text-slate-500">bpm</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                {sport === 'run' ? 'Schrittfrequenz' : sport === 'bike' ? 'Trittfrequenz' : 'Zugfrequenz'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={avgCadence}
                  onChange={(e) => setAvgCadence(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-cyan-400 font-bold focus:border-cyan-400 focus:outline-none"
                />
                <span className="absolute right-2 top-2 text-[11px] text-slate-500">
                  {sport === 'run' ? 'SPM' : 'RPM'}
                </span>
              </div>
            </div>
          </div>

          {/* Elevation or Swolf */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Höhenmeter (+ Hm)</span>
              </label>
              <input
                type="number"
                value={elevationGainM}
                onChange={(e) => setElevationGainM(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {sport === 'swim' ? (
              <div>
                <label className="text-xs text-cyan-400 block mb-1 font-semibold">Swolf-Wert</label>
                <input
                  type="number"
                  value={swolf}
                  onChange={(e) => setSwolf(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-cyan-400 font-bold focus:border-cyan-400 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Datenquelle</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="garmin">Garmin Connect (Forerunner / Edge)</option>
                  <option value="strava">Strava</option>
                  <option value="manual">Manuelle Protokollierung</option>
                </select>
              </div>
            )}
          </div>

          {/* Athlete Notes */}
          <div>
            <label className="text-xs text-slate-400 flex items-center gap-1 mb-1">
              <AlignLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Notizen & Körpergefühl (z.B. Beine nach Schule, Ernährung, Wind)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. Starke Beine am Berg, 175 SPM im Schnitt gehalten, vor dem Training 60g Kohlenhydrate gegessen..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{initialActivity ? 'Änderungen speichern' : 'Aktivität anlegen'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
