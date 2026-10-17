import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, ExternalLink, BatteryCharging, Moon, Heart, Zap, Upload, FileText, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { GarminBiometrics, SportActivity } from '../types.ts';

interface StravaGarminSyncProps {
  stravaConnected: boolean;
  garminConnected: boolean;
  onConnectStrava: () => void;
  onDisconnectStrava: () => void;
  onConnectGarmin: () => void;
  onDisconnectGarmin: () => void;
  garmin: GarminBiometrics;
  onRefreshGarminData: () => void;
  onFileUploadActivity: (activity: SportActivity) => void;
}

export const StravaGarminSync: React.FC<StravaGarminSyncProps> = ({
  stravaConnected,
  garminConnected,
  onConnectStrava,
  onDisconnectStrava,
  onConnectGarmin,
  onDisconnectGarmin,
  garmin,
  onRefreshGarminData,
  onFileUploadActivity,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-...';
  const callbackUrl = `${currentOrigin}/auth/callback`;

  const handleGarminRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      onRefreshGarminData();
      setIsRefreshing(false);
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus(`Datei "${file.name}" wird analysiert...`);

    // Simulated parsing of GPX / FIT file
    setTimeout(() => {
      const isBike = file.name.toLowerCase().includes('bike') || file.name.toLowerCase().includes('rad') || file.name.toLowerCase().includes('stelvio');
      const isSwim = file.name.toLowerCase().includes('swim') || file.name.toLowerCase().includes('see') || file.name.toLowerCase().includes('schwimm');
      const sport = isSwim ? 'swim' : isBike ? 'bike' : 'run';

      const newActivity: SportActivity = {
        id: 'upload_' + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        sport,
        date: new Date().toISOString().slice(0, 10),
        timeFormatted: 'Heute, frisch hochgeladen',
        distanceKm: sport === 'bike' ? 72.5 : sport === 'run' ? 12.4 : 2.2,
        durationMin: sport === 'bike' ? 125 : sport === 'run' ? 56 : 41,
        elevationGainM: sport === 'bike' ? 840 : sport === 'run' ? 95 : 0,
        avgWatts: sport === 'bike' ? 292 : sport === 'run' ? 395 : undefined,
        normalizedPower: sport === 'bike' ? 330 : undefined,
        avgHr: 156,
        maxHr: 181,
        avgCadence: sport === 'bike' ? 89 : sport === 'run' ? 176 : 35,
        paceFormatted: sport === 'bike' ? '34.8 km/h' : sport === 'run' ? '4:31 min/km' : '1:47 /100m',
        tss: sport === 'bike' ? 138 : sport === 'run' ? 82 : 46,
        intensityFactor: sport === 'bike' ? 0.92 : 0.88,
        source: 'file_upload',
        tags: ['Datei-Import', file.name],
        telemetry: [
          { timeOffsetSec: 0, watts: 220, heartRate: 130, speedKmh: 30, altitudeM: 750 },
          { timeOffsetSec: 1200, watts: 310, heartRate: 155, speedKmh: 35, altitudeM: 810 },
          { timeOffsetSec: 2400, watts: 355, heartRate: 168, speedKmh: 24, altitudeM: 1050 },
          { timeOffsetSec: 3600, watts: 375, heartRate: 174, speedKmh: 20, altitudeM: 1240 },
          { timeOffsetSec: 4800, watts: 290, heartRate: 154, speedKmh: 36, altitudeM: 820 },
        ],
      };

      onFileUploadActivity(newActivity);
      setUploadStatus(`Erfolg: ${newActivity.title} mit Telemetrie importiert!`);
      setTimeout(() => setUploadStatus(null), 4000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-cyan-400" />
          <span>Verbindung mit Strava & Garmin Connect™</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          Echte triathlon-spezifische Sportanalyse benötigt kontinuierliche Telemetrie. Synchronisiere deine Workouts
          (Leistung, Trittfrequenz, Swolf) von <strong>Strava</strong> und deine physiologische Erholungs-Basis (Body Battery, HRV, Schlaf)
          von <strong>Garmin</strong>.
        </p>
      </div>

      {/* Connect Strava & Garmin Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* STRAVA CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-base shadow-md shadow-amber-500/20">
                  S
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Strava Aktivitäts-Sync</h3>
                  <span className="text-xs text-slate-400">Fahrten, Läufe, Watt & Swolf</span>
                </div>
              </div>

              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5 ${
                  stravaConnected
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700/60'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${stravaConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                {stravaConnected ? 'Aktiv verbunden' : 'Nicht verbunden'}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Synchronisiert deine Touren mit dem <strong>Marin Stelvio</strong> (Leistungskurven, NP, Filzensattel-Segmente),
              Laufintervalle mit <strong>175 SPM Cadence</strong> und Schwimm-Swolf aus dem Zeller See.
            </p>

            <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span>OAuth 2.0 Schnittstelle:</span>
                <span className="text-emerald-400">Bereit</span>
              </div>
              <div className="text-[11px] font-mono break-all text-slate-500">
                Callback: <span className="text-slate-300">{callbackUrl}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-3">
            {stravaConnected ? (
              <>
                <button
                  onClick={onDisconnectStrava}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                >
                  Trennen
                </button>
                <button
                  onClick={onConnectStrava}
                  className="flex-1 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Jetzt erneut synchronisieren</span>
                </button>
              </>
            ) : (
              <button
                onClick={onConnectStrava}
                className="w-full px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <span>Mit Strava verbinden</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* GARMIN CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500 flex items-center justify-center font-black text-slate-950 text-base shadow-md shadow-cyan-500/20">
                  G
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Garmin Connect™ Health</h3>
                  <span className="text-xs text-slate-400">Body Battery, HRV & Erholung</span>
                </div>
              </div>

              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5 ${
                  garminConnected
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700/60'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${garminConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                {garminConnected ? 'Verbunden' : 'Nicht verbunden'}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Liest kontinuierlich physiologische Parameter aus der Garmin Forerunner / Edge Serie, damit der KI-Coach
              Überlastungen frühzeitig erkennt und Ruhetage smart anpasst.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Body Battery</span>
                <span className="text-base font-black text-cyan-400">{garmin.bodyBattery} %</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">HRV-Status</span>
                <span className="text-base font-black text-emerald-400">{garmin.hrvValueMs} ms ({garmin.hrvStatus})</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-3">
            {garminConnected ? (
              <>
                <button
                  onClick={onDisconnectGarmin}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                >
                  Trennen
                </button>
                <button
                  onClick={handleGarminRefresh}
                  disabled={isRefreshing}
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Sync läuft...' : 'Health-Daten aktualisieren'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={onConnectGarmin}
                className="w-full px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <span>Garmin Connect aktivieren</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Garmin Live Biometrics Panel */}
      {garminConnected && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Aktuelle Garmin Vital- & Regenerationswerte</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{garmin.lastSyncTime}</p>
            </div>
            <button
              onClick={handleGarminRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Neu laden</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Body Battery</span>
                <BatteryCharging className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-black text-cyan-400">{garmin.bodyBattery} %</div>
              <span className="text-[11px] text-emerald-400">Aufladend über Nacht</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Schlaf-Score</span>
                <Moon className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-black text-purple-300">{garmin.sleepScore} / 100</div>
              <span className="text-[11px] text-slate-400">{garmin.sleepHours}h Schlaf</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>HRV Status</span>
                <Heart className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-emerald-400">{garmin.hrvValueMs} ms</div>
              <span className="text-[11px] text-emerald-400 font-semibold">{garmin.hrvStatus}</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Erholungszeit</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-black text-amber-400">{garmin.recoveryHours} Std</div>
              <span className="text-[11px] text-slate-400">Bis zu Z4 Reiz</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Ruhepuls</span>
                <Heart className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl font-black text-white">{garmin.restingHr} bpm</div>
              <span className="text-[11px] text-slate-400">Basis stabil</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>VO2 Max</span>
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-black text-cyan-400">{garmin.vo2Max}</div>
              <span className="text-[11px] text-emerald-400 font-semibold">{garmin.trainingStatus}</span>
            </div>
          </div>
        </div>
      )}

      {/* Manual File Dropzone (FIT / GPX / TCX) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Upload className="w-4 h-4 text-cyan-400" />
          <span>Direkter Datei-Import (.FIT, .GPX, .TCX von Garmin Edge / Forerunner)</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Du kannst auch exportierte Trainingsdateien von deinem Garmin-Gerät oder Radcomputer direkt hier ablegen. Die Telemetrie wird sofort in die Analyse und den KI-Coach eingespeist.
        </p>

        <div className="mt-4 border-2 border-dashed border-slate-700/80 hover:border-cyan-500 rounded-xl p-6 text-center bg-slate-950/50 transition-colors">
          <input
            type="file"
            id="activity-file-upload"
            accept=".fit,.gpx,.tcx,.json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="activity-file-upload" className="cursor-pointer block">
            <FileText className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
            <span className="text-sm font-semibold text-slate-200 block">
              Klicke hier, um eine FIT- oder GPX-Aktivitätsdatei auszuwählen
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              Unterstützt: Garmin .FIT, GPX Tracks, TCX Dateien
            </span>
          </label>
        </div>

        {uploadStatus && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{uploadStatus}</span>
          </div>
        )}
      </div>
    </div>
  );
};
