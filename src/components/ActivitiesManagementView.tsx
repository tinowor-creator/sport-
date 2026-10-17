import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Bike, Footprints, Waves, Calendar, Clock, Zap, Heart, Sparkles, Filter, AlertCircle, ArrowUpDown } from 'lucide-react';
import { SportActivity } from '../types.ts';

interface ActivitiesManagementViewProps {
  activities: SportActivity[];
  onOpenAddModal: () => void;
  onOpenStravaImport: () => void;
  onCleanDuplicates: () => void;
  onEditActivity: (activity: SportActivity) => void;
  onDeleteActivity: (id: string) => void;
  onClearSampleData: () => void;
  onAnalyzeWithAi: (activity: SportActivity) => void;
}

export const ActivitiesManagementView: React.FC<ActivitiesManagementViewProps> = ({
  activities,
  onOpenAddModal,
  onOpenStravaImport,
  onCleanDuplicates,
  onEditActivity,
  onDeleteActivity,
  onClearSampleData,
  onAnalyzeWithAi,
}) => {
  const [sportFilter, setSportFilter] = useState<'all' | 'bike' | 'run' | 'swim'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filtered = activities
    .filter((act) => (sportFilter === 'all' ? true : act.sport === sportFilter))
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const getSportBadge = (sport: 'bike' | 'run' | 'swim') => {
    switch (sport) {
      case 'bike':
        return (
          <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/60 font-semibold">
            <Bike className="w-3.5 h-3.5" />
            <span>Radfahren</span>
          </span>
        );
      case 'run':
        return (
          <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold">
            <Footprints className="w-3.5 h-3.5" />
            <span>Laufen</span>
          </span>
        );
      case 'swim':
        return (
          <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 font-semibold">
            <Waves className="w-3.5 h-3.5" />
            <span>Schwimmen</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Aktivitäten & Trainingstagebuch</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
              {activities.length} Einheiten erfasst
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Füge deine eigenen Workouts manuell mit exaktem Datum, Startzeit, Wattwerten und Herzfrequenz hinzu oder korrigiere bestehende Einträge.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={onCleanDuplicates}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            title="Prüft die Aktivitätenliste auf Duplikate (gleicher Tag, Sportart & Distanz) und behält die beste Version"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Duplikate bereinigen</span>
          </button>

          <button
            onClick={onOpenStravaImport}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
            title="Historische Strava-Aktivitäten importieren und mit Garmin Fenix 8 abgleichen"
          >
            <Zap className="w-4 h-4 text-orange-400" />
            <span>Strava-Import & Abgleich</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Neue Aktivität hinzufügen</span>
          </button>

          {activities.some((a) => a.id.startsWith('strava_act_')) && (
            <button
              onClick={onClearSampleData}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800/60 text-xs font-semibold transition-all cursor-pointer"
              title="Entfernt alle generierten Beispieldaten, damit nur noch deine echten Workouts angezeigt werden"
            >
              Beispieldaten leeren
            </button>
          )}
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSportFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sportFilter === 'all'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Alle ({activities.length})
          </button>
          <button
            onClick={() => setSportFilter('bike')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sportFilter === 'bike'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Rad ({activities.filter((a) => a.sport === 'bike').length})
          </button>
          <button
            onClick={() => setSportFilter('run')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sportFilter === 'run'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Lauf ({activities.filter((a) => a.sport === 'run').length})
          </button>
          <button
            onClick={() => setSportFilter('swim')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sportFilter === 'swim'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Schwimm ({activities.filter((a) => a.sport === 'swim').length})
          </button>
        </div>

        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer self-start sm:self-auto"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sortierung: {sortOrder === 'desc' ? 'Neueste zuerst' : 'Älteste zuerst'}</span>
        </button>
      </div>

      {/* Activity Cards List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Keine Aktivitäten in dieser Ansicht</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Klicke oben auf "Neue Aktivität hinzufügen", um dein erstes Training mit exakter Uhrzeit und Werten einzutragen.
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Aktivität anlegen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((act) => (
            <div
              key={act.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all shadow-lg space-y-3"
            >
              {/* Header row of card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      act.sport === 'bike'
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                        : act.sport === 'run'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                        : 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60'
                    }`}
                  >
                    {act.sport === 'bike' ? <Bike className="w-5 h-5" /> : act.sport === 'run' ? <Footprints className="w-5 h-5" /> : <Waves className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-base">{act.title}</h3>
                      {getSportBadge(act.sport)}
                      {act.source === 'garmin' || act.id.startsWith('garmin_') ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/60 text-cyan-300">
                          Garmin (Fenix 8)
                        </span>
                      ) : act.source === 'strava' ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-orange-950/70 border border-orange-800/60 text-orange-300">
                          Strava (Vor Fenix 8)
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                          {act.source.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-cyan-300 font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>{act.date}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <Clock className="w-3 h-3" />
                        <span>{act.timeFormatted}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => onAnalyzeWithAi(act)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 text-xs font-semibold transition-all cursor-pointer"
                    title="Diese Einheit mit dem KI-Coach auswerten"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>KI-Check</span>
                  </button>

                  <button
                    onClick={() => onEditActivity(act)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                    title="Aktivitätsdaten bearbeiten"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Aktivität "${act.title}" wirklich löschen?`)) {
                        onDeleteActivity(act.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all cursor-pointer"
                    title="Aktivität löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Data Grid of card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Distanz & Tempo</span>
                  <span className="text-sm font-bold text-white block mt-0.5">{act.distanceKm} km</span>
                  <span className="text-[11px] text-cyan-400">{act.paceFormatted}</span>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Dauer</span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    {Math.floor(act.durationMin / 60) > 0
                      ? `${Math.floor(act.durationMin / 60)}h ${Math.round(act.durationMin % 60)}m`
                      : `${Math.round(act.durationMin)} min`}
                  </span>
                  <span className="text-[11px] text-slate-400">{act.durationMin} Minuten</span>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">
                    {act.sport === 'bike' ? 'Norm. Power / Avg' : act.sport === 'run' ? 'Running Power' : 'Swolf'}
                  </span>
                  <span className="text-sm font-bold text-amber-400 block mt-0.5">
                    {act.normalizedPower ? `${act.normalizedPower}W NP` : act.avgWatts ? `${act.avgWatts}W` : act.swolf ? `Swolf ${act.swolf}` : '–'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {act.avgWatts && act.normalizedPower ? `Ø ${act.avgWatts}W` : 'Leistung'}
                  </span>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Herzfrequenz</span>
                  <span className="text-sm font-bold text-rose-400 block mt-0.5">{act.avgHr} bpm</span>
                  <span className="text-[11px] text-slate-400">Max: {act.maxHr} bpm</span>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">
                    {act.sport === 'run' ? 'Schrittfrequenz' : act.sport === 'bike' ? 'Trittfrequenz' : 'Zugfrequenz'}
                  </span>
                  <span className="text-sm font-bold text-emerald-400 block mt-0.5">
                    {act.avgCadence} {act.sport === 'run' ? 'SPM' : 'RPM'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {act.elevationGainM ? `+${act.elevationGainM} Hm` : '–'}
                  </span>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Belastung (TSS)</span>
                  <span className="text-sm font-bold text-cyan-400 block mt-0.5">{act.tss} TSS</span>
                  <span className="text-[11px] text-slate-400">{act.intensityFactor} IF</span>
                </div>
              </div>

              {/* Notes row if present */}
              {act.notes && (
                <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/60 text-xs text-slate-300 italic">
                  <strong>Notiz:</strong> {act.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
