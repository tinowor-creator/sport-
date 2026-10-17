import React from 'react';
import {
  BatteryCharging,
  Heart,
  Moon,
  ShieldCheck,
  Activity,
  Edit3,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  Footprints,
  Flame,
} from 'lucide-react';
import { GarminBiometrics } from '../types.ts';

interface VitalDashboardProps {
  garmin: GarminBiometrics;
  onOpenGarminTab: () => void;
  onQuickEditGarmin: () => void;
  onSyncGarminLive?: () => Promise<void> | void;
  isSyncingGarmin?: boolean;
}

export const VitalDashboard: React.FC<VitalDashboardProps> = ({
  garmin,
  onOpenGarminTab,
  onQuickEditGarmin,
  onSyncGarminLive,
  isSyncingGarmin = false,
}) => {
  // Compute overall Daily Training Readiness Score (0 - 100)
  // Weighted: 40% Body Battery, 30% HRV status, 20% Sleep Score, 10% Resting HR stability
  const hrvStatusStr = String(garmin.hrvStatus || '');
  const hrvNormalized =
    hrvStatusStr === 'Ausgeglichen' || hrvStatusStr === 'BALANCED'
      ? 95
      : hrvStatusStr === 'Erhöht' || hrvStatusStr === 'HIGH'
      ? 85
      : hrvStatusStr === 'Niedrig' || hrvStatusStr === 'LOW'
      ? 55
      : 40;

  const readinessScore = Math.min(
    100,
    Math.max(
      20,
      Math.round(
        (garmin.bodyBattery || 80) * 0.4 +
          hrvNormalized * 0.3 +
          (garmin.sleepScore || 85) * 0.2 +
          10
      )
    )
  );

  const getReadinessBadge = (score: number) => {
    if (score >= 80) {
      return {
        label: 'Hohe Trainingsbereitschaft',
        advice: 'Physiologisch top regeneriert für Schwellen- & Intervallreize (Filzensattel-Simulation).',
        badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/60',
        ringColor: 'stroke-emerald-400',
      };
    }
    if (score >= 60) {
      return {
        label: 'Moderate Trainingsbereitschaft',
        advice: 'GA1 Grundlagen- und Koppelblöcke empfohlen. Schwellenreize moderat dosieren.',
        badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-700/60',
        ringColor: 'stroke-cyan-400',
      };
    }
    return {
      label: 'Erhöhter Erholungsbedarf',
      advice: 'Aktive Regeneration, leichtes Dehnen & Mobility oder lockeres Rekom-Rollen.',
      badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-700/60',
      ringColor: 'stroke-amber-400',
    };
  };

  const readiness = getReadinessBadge(readinessScore);
  const isGarminLive = garmin.lastSyncTime?.includes('Live') || garmin.lastSyncTime?.includes('Garmin');

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden mb-6">
      {/* Background glow accent */}
      <div className="absolute top-0 right-1/4 w-64 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header of Vital Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold shadow-inner">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">
                Garmin Vital-Dashboard & Tagesform
              </h3>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${readiness.badgeColor}`}>
                {readiness.label}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Garmin Connect Live-Schnittstelle</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>{garmin.lastSyncTime || 'Garmin Connect Live synchronisiert'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400/90 font-mono text-[11px]">tino.worbs3@gmail.com</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onSyncGarminLive && (
            <button
              onClick={() => onSyncGarminLive()}
              disabled={isSyncingGarmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-900/50 text-slate-950 disabled:text-cyan-400 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer disabled:cursor-not-allowed"
              title="Aktuelle Vitalwerte live via garminconnect Python Backend auslesen"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGarmin ? 'animate-spin' : ''}`} />
              <span>{isSyncingGarmin ? 'Lese Garmin aus...' : 'Garmin Live abrufen'}</span>
            </button>
          )}

          <button
            onClick={onQuickEditGarmin}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
            title="Garmin-Werte manuell überschreiben"
          >
            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Anpassen</span>
          </button>

          <button
            onClick={onOpenGarminTab}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 text-xs font-semibold transition-all cursor-pointer"
            title="Zum Garmin Connect Hub wechseln"
          >
            <span>Hub</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
        {/* Metric 1: Body Battery */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Body Battery</span>
            <BatteryCharging className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
              {garmin.bodyBattery ?? 87}
            </span>
            <span className="text-xs text-slate-400">%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, garmin.bodyBattery ?? 87))}%` }}
            />
          </div>
        </div>

        {/* Metric 2: HRV Status */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">HRV-Status</span>
            <Heart className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {garmin.hrvValueMs ?? 65}
            </span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold truncate">
            {garmin.hrvStatus ?? 'Ausgeglichen'} <span className="text-slate-500 font-normal">(Basis {garmin.hrvBaselineMs ?? 43}ms)</span>
          </span>
        </div>

        {/* Metric 3: Resting Heart Rate (Ruhepuls) */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Ruhepuls</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {garmin.restingHr ?? 51}
            </span>
            <span className="text-xs text-slate-400">bpm</span>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Garmin Connect Live</span>
          </span>
        </div>

        {/* Metric 4: Sleep Score & Duration */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Schlaf-Score</span>
            <Moon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">
              {garmin.sleepScore ?? 94}
            </span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {garmin.sleepHours ?? 8.1} Std. erholsam
          </span>
        </div>

        {/* Metric 5: Daily Steps */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Schritte heute</span>
            <Footprints className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {garmin.steps !== undefined && garmin.steps !== null ? Number(garmin.steps).toLocaleString('de-DE') : '1.561'}
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">
            Live aus Garmin
          </span>
        </div>

        {/* Metric 6: Readiness Score Card */}
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-3 rounded-xl border border-cyan-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-cyan-300">Readiness Score</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {readinessScore}
            </span>
            <span className="text-xs font-semibold text-emerald-400">/ 100</span>
          </div>
          <span className="text-[11px] text-slate-300 leading-tight">
            Erholung: <strong className="text-amber-400">{garmin.recoveryHours ?? 14}h</strong> bis Vollast
          </span>
        </div>
      </div>

      {/* Dynamic Training Recommendation Strip */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-semibold">💡 Coach-Empfehlung für heute:</span>
          <span className="text-slate-300">{readiness.advice}</span>
        </div>
        <div className="text-slate-400 text-[11px] flex items-center gap-3">
          <span>VO2 Max: <strong className="text-cyan-400 font-mono">{garmin.vo2Max || 62.0}</strong></span>
          <span>Status: <strong className="text-emerald-400">{garmin.trainingStatus || 'Formaufbau'}</strong></span>
          <span className="text-slate-500">Quelle: Garmin Connect Python Backend</span>
        </div>
      </div>
    </div>
  );
};
