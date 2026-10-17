import React, { useState } from 'react';
import { X, Save, Sliders, Bike, Footprints, Waves, User, Calendar } from 'lucide-react';
import { AthleteProfile } from '../types.ts';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: AthleteProfile;
  onSaveProfile: (updated: AthleteProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  athlete,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<AthleteProfile>({ ...athlete });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              Athleten-Profil & Leistungs-Benchmarks
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* General Information */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Name des Athleten</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Körpergewicht (kg)</label>
              <input
                type="number"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Bike Settings */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Bike className="w-4 h-4" />
              <span>Rad-Parameter (Marin Stelvio)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Rad FTP (Functional Threshold Power)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.bikeFtp}
                    onChange={(e) => setFormData({ ...formData, bikeFtp: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-400 font-bold focus:border-amber-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">Watt</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Radmodell / Setup</label>
                <input
                  type="text"
                  value={formData.bikeModel}
                  onChange={(e) => setFormData({ ...formData, bikeModel: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Run Settings */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Footprints className="w-4 h-4" />
              <span>Lauf-Parameter (5k & Cadence)</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">5km Bestzeit (mm:ss)</label>
                <input
                  type="text"
                  value={formData.run5kTime}
                  onChange={(e) => setFormData({ ...formData, run5kTime: e.target.value })}
                  placeholder="22:31"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Lauf rFTP (Running Power)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.runFtp}
                    onChange={(e) => setFormData({ ...formData, runFtp: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">W</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Soll-Schrittfrequenz</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.targetCadence}
                    onChange={(e) => setFormData({ ...formData, targetCadence: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">SPM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Swim Settings */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Waves className="w-4 h-4" />
              <span>Schwimm-Parameter (Swolf)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Swolf-Zielwert (25m Bahn)</label>
                <input
                  type="number"
                  value={formData.swolf}
                  onChange={(e) => setFormData({ ...formData, swolf: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-400 font-bold focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Ruhepuls / Max. Puls (bpm)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Ruhe"
                    value={formData.restingHr}
                    onChange={(e) => setFormData({ ...formData, restingHr: Number(e.target.value) })}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={formData.maxHr}
                    onChange={(e) => setFormData({ ...formData, maxHr: Number(e.target.value) })}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Weekly routine notes */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Wochen-Alltag & Feste Termine (für KI-Coach)</label>
            <input
              type="text"
              value={formData.weeklyAvailability}
              onChange={(e) => setFormData({ ...formData, weeklyAvailability: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Speichern</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
