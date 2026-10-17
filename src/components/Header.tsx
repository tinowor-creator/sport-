import React from 'react';
import { Calendar, Activity, Zap, Sparkles, Sliders, RefreshCw, ListPlus, Watch, Plus } from 'lucide-react';
import { AthleteProfile, GarminBiometrics } from '../types.ts';

export type AppTab = 'plan' | 'activities' | 'garmin' | 'analytics' | 'race' | 'coach';

interface HeaderProps {
  athlete: AthleteProfile;
  garmin: GarminBiometrics;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenProfile: () => void;
  onOpenAddActivity: () => void;
  garminConnected: boolean;
  activitiesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  athlete,
  garmin,
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenAddActivity,
  garminConnected,
  activitiesCount,
}) => {
  // Days to Ironman 70.3 Zell am See 2027
  const raceDate = new Date('2027-08-29').getTime();
  const today = new Date().getTime();
  const daysToRace = Math.max(0, Math.ceil((raceDate - today) / (1000 * 60 * 60 * 24)));

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Top Info Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              70.3
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                  Trainings App TRiatzhlon
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800/60 text-cyan-400 font-semibold">
                  Garmin Live
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Zell am See-Kaprun 70.3 Vorbereitung</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-medium">Noch {daysToRace} Tage</span>
              </p>
            </div>
          </div>

          {/* Quick Actions & Garmin Status */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Quick Add Activity Button */}
            <button
              onClick={onOpenAddActivity}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aktivität erfassen</span>
            </button>

            {/* Garmin Connect Status Pill */}
            <button
              onClick={() => setActiveTab('garmin')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                garminConnected
                  ? 'bg-cyan-950/50 border-cyan-600/50 text-cyan-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Garmin Connect Datenbasis"
            >
              <span className={`w-2 h-2 rounded-full ${garminConnected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
              <span>Garmin Body Battery: <strong className="text-white">{garmin.bodyBattery}%</strong></span>
            </button>

            {/* Athlete Profile Pill */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-medium transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>FTP: <strong className="text-white">{athlete.bikeFtp}W</strong></span>
              <span className="text-slate-500">|</span>
              <span>5k: <strong className="text-white">{athlete.run5kTime}</strong></span>
            </button>
          </div>
        </div>

        {/* Tab Navigation as Requested */}
        <div className="flex items-center gap-1 sm:gap-2 pt-2.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'plan'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Trainingsplan</span>
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'activities'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <ListPlus className="w-4 h-4" />
            <span>Eigene Aktivitäten ({activitiesCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('garmin')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'garmin'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Watch className="w-4 h-4 text-cyan-400" />
            <span>Garmin Connect™ & Vitaldaten</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Analyse & Sub-5h Benchmark</span>
          </button>

          <button
            onClick={() => setActiveTab('race')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'race'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Zell am See Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('coach')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'coach'
                ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-900/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>KI-Coach</span>
          </button>
        </div>
      </div>
    </header>
  );
};
