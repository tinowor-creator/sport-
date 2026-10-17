import React, { useState } from 'react';
import { Sparkles, Save, RotateCcw, Plus, CheckCircle2, Circle, Clock, Flame, Dumbbell, Bike, Waves, Footprints, HeartHandshake, Download, Upload } from 'lucide-react';
import { WeeklyPlan, PlanSession, SportType } from '../types.ts';

interface TrainingPlanViewProps {
  plans: WeeklyPlan;
  currentWeek: 'A' | 'B';
  setCurrentWeek: (week: 'A' | 'B') => void;
  onUpdatePlanSession: (week: 'A' | 'B', index: number, field: keyof PlanSession, value: any) => void;
  onResetPlan: () => void;
  onTriggerAiEvaluation: (week: 'A' | 'B') => void;
  onTriggerAiVariation: (week: 'A' | 'B') => void;
}

export const TrainingPlanView: React.FC<TrainingPlanViewProps> = ({
  plans,
  currentWeek,
  setCurrentWeek,
  onUpdatePlanSession,
  onResetPlan,
  onTriggerAiEvaluation,
  onTriggerAiVariation,
}) => {
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const currentSessions = plans[currentWeek];

  // Calculate totals
  const totalPlannedTss = currentSessions.reduce((acc, s) => acc + (s.plannedTss || 0), 0);
  const totalDurationMin = currentSessions.reduce((acc, s) => acc + (s.durationMin || 0), 0);
  const completedCount = currentSessions.filter((s) => s.completed).length;
  const completedTss = currentSessions
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + (s.actualTss || s.plannedTss || 0), 0);

  const getSportIcon = (sport: SportType) => {
    switch (sport) {
      case 'swim':
        return <Waves className="w-4 h-4 text-cyan-400" />;
      case 'bike':
        return <Bike className="w-4 h-4 text-amber-400" />;
      case 'run':
        return <Footprints className="w-4 h-4 text-emerald-400" />;
      case 'strength':
        return <Dumbbell className="w-4 h-4 text-purple-400" />;
      case 'rest':
      default:
        return <HeartHandshake className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleManualSave = () => {
    localStorage.setItem('triathlon_plans', JSON.stringify(plans));
    setSaveSuccessMsg('Trainingsplan erfolgreich im Browser gesichert!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plans, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `triathlon_plan_zell_am_see_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Week Selector & Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>Interaktiver 2-Wochen-Wechselplan</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
              Woche {currentWeek} aktiv
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {currentWeek === 'A'
              ? 'Woche A: Fokus auf Schwellen-Reize (Z2/Z4), 5k rFTP Schwellenlauf & Marin Stelvio Tempo'
              : 'Woche B: Fokus auf Kraftausdauer, Bergläufe, lange Einheiten mit Höhenmetern & Swolf'}
          </p>
        </div>

        {/* Tab Toggle buttons */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setCurrentWeek('A')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              currentWeek === 'A'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Woche A (Schwellen & Tempo)
          </button>
          <button
            onClick={() => setCurrentWeek('B')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              currentWeek === 'B'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Woche B (Kraft & Berg-Umfang)
          </button>
        </div>
      </div>

      {/* Week Stats summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Geplanter TSS</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{totalPlannedTss}</span>
            <span className="text-xs text-slate-500">TSS</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Abgeschlossen: <span className="text-emerald-400 font-semibold">{completedTss} TSS</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Gesamtdauer</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400">
              {(totalDurationMin / 60).toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">Stunden</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {totalDurationMin} Min. Trainingsreiz
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Einheiten</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">
              {completedCount} / {currentSessions.length}
            </span>
            <span className="text-xs text-slate-500">Erledigt</span>
          </div>
          <div className="mt-1 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / currentSessions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Zell am See Fokus</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-1 text-sm font-bold text-purple-300">
            {currentWeek === 'A' ? 'Koppeltraining & Schwellen' : 'Filzensattel-Simulation'}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {currentWeek === 'A' ? 'Samstag Koppel 75km/8km' : 'Samstag 95km Bergfahrt'}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Wochenplan {currentWeek}</span>
              <span className="text-xs text-slate-400 font-normal">
                (Klicke direkt in die Texte, um Anpassungen vorzunehmen)
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onTriggerAiEvaluation(currentWeek)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>KI-Plan-Bewertung</span>
            </button>

            <button
              onClick={() => onTriggerAiVariation(currentWeek)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>KI-Alternative</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3 w-12 text-center">Status</th>
                <th className="py-3 px-3 w-32">Tag & Disziplin</th>
                <th className="py-3 px-4 min-w-[280px]">Morgen / Haupt-Einheit</th>
                <th className="py-3 px-4 min-w-[240px]">Nachmittag / Ergänzung & Alltag</th>
                <th className="py-3 px-3 w-28 text-center">TSS / Dauer</th>
                <th className="py-3 px-3 w-36">Zielzone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {currentSessions.map((session, idx) => (
                <tr
                  key={session.day + idx}
                  className={`transition-colors ${
                    session.completed ? 'bg-emerald-950/15' : 'hover:bg-slate-800/30'
                  }`}
                >
                  {/* Status Checkbox */}
                  <td className="py-3 px-3 text-center align-middle">
                    <button
                      onClick={() => onUpdatePlanSession(currentWeek, idx, 'completed', !session.completed)}
                      className="cursor-pointer text-slate-500 hover:text-emerald-400 transition-colors p-1"
                      title={session.completed ? 'Als unvollständig markieren' : 'Als erledigt abhaken'}
                    >
                      {session.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  </td>

                  {/* Day & Sport */}
                  <td className="py-3 px-3 align-top">
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{session.day}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {getSportIcon(session.sport)}
                      <select
                        value={session.sport}
                        onChange={(e) =>
                          onUpdatePlanSession(currentWeek, idx, 'sport', e.target.value as SportType)
                        }
                        className="bg-transparent text-xs text-slate-400 border border-slate-700/60 rounded px-1.5 py-0.5 focus:border-cyan-400 focus:outline-none"
                      >
                        <option value="run" className="bg-slate-900 text-slate-200">🏃 Laufen</option>
                        <option value="bike" className="bg-slate-900 text-slate-200">🚴 Radfahren</option>
                        <option value="swim" className="bg-slate-900 text-slate-200">🏊 Schwimmen</option>
                        <option value="strength" className="bg-slate-900 text-slate-200">🏋️ Kraft/Athletik</option>
                        <option value="rest" className="bg-slate-900 text-slate-200">🧘 Regeneration</option>
                      </select>
                    </div>
                  </td>

                  {/* Main Workout (Editable) */}
                  <td className="py-3 px-4 align-top">
                    <input
                      type="text"
                      value={session.main}
                      onChange={(e) => onUpdatePlanSession(currentWeek, idx, 'main', e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-100 font-medium text-xs sm:text-sm focus:border-cyan-400 focus:bg-slate-950 focus:outline-none transition-all"
                    />
                    {session.actualNotes && (
                      <p className="mt-1 text-xs text-emerald-400 italic">
                        Notiz: {session.actualNotes}
                      </p>
                    )}
                  </td>

                  {/* Secondary / Daily context (Editable) */}
                  <td className="py-3 px-4 align-top">
                    <input
                      type="text"
                      value={session.sec}
                      onChange={(e) => onUpdatePlanSession(currentWeek, idx, 'sec', e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-300 text-xs sm:text-sm focus:border-cyan-400 focus:bg-slate-950 focus:outline-none transition-all"
                    />
                  </td>

                  {/* TSS & Duration */}
                  <td className="py-3 px-3 align-top text-center">
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <input
                        type="number"
                        value={session.plannedTss}
                        onChange={(e) =>
                          onUpdatePlanSession(currentWeek, idx, 'plannedTss', Number(e.target.value))
                        }
                        className="w-12 text-center bg-slate-950/80 border border-slate-800 rounded px-1 py-0.5 text-amber-400 font-bold focus:border-amber-400 focus:outline-none"
                      />
                      <span className="text-slate-500 font-mono">TSS</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs mt-1">
                      <input
                        type="number"
                        value={session.durationMin}
                        onChange={(e) =>
                          onUpdatePlanSession(currentWeek, idx, 'durationMin', Number(e.target.value))
                        }
                        className="w-12 text-center bg-slate-950/80 border border-slate-800 rounded px-1 py-0.5 text-cyan-400 font-mono focus:border-cyan-400 focus:outline-none"
                      />
                      <span className="text-slate-500">min</span>
                    </div>
                  </td>

                  {/* Target Zone */}
                  <td className="py-3 px-3 align-top">
                    <input
                      type="text"
                      value={session.targetZone}
                      onChange={(e) => onUpdatePlanSession(currentWeek, idx, 'targetZone', e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:border-cyan-400 focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action bar below table */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Plan Speichern</span>
            </button>

            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export (JSON)</span>
            </button>

            <button
              onClick={onResetPlan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs sm:text-sm transition-all cursor-pointer"
              title="Auf Standardplan zurücksetzen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Standard</span>
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="text-xs text-emerald-400 flex items-center gap-1 font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <p className="text-xs text-slate-500">
            💡 Automatische lokale Speicherung im Browser aktiviert.
          </p>
        </div>
      </div>
    </div>
  );
};
