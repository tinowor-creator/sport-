import React, { useState } from 'react';
import { Mountain, Waves, Footprints, Flame, Droplets, Compass, Clock, Award, ShieldAlert } from 'lucide-react';
import { AthleteProfile } from '../types.ts';
import { zellAmSeeCourseData } from '../data/defaultData.ts';

interface ZellAmSeeRadarProps {
  athlete: AthleteProfile;
}

export const ZellAmSeeRadar: React.FC<ZellAmSeeRadarProps> = ({ athlete }) => {
  const ftp = athlete.bikeFtp || 360;
  const [selectedDiscipline, setSelectedDiscipline] = useState<'bike' | 'swim' | 'run' | 'nutrition'>('bike');

  // Pacing calculations based on FTP
  const flatTargetWatts = Math.round(ftp * 0.78);
  const climbTargetWatts = Math.round(Math.min(ftp * 1.02, 385));
  const normalizedPowerGoal = Math.round(ftp * 0.82);

  return (
    <div className="space-y-6">
      {/* Hero Course Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                Österreich • Salzburg
              </span>
              <span className="text-xs text-slate-400 font-medium">Hohe Tauern Kulisse</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">
              Ironman 70.3 Zell am See-Kaprun 2027
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Strecken-Intelligence & Pacing-Plan: 1,9 km Schwimmen im Zeller See • 90 km Radfahren über den legendären Filzensattel (+1.288 Hm) • 21,1 km Seepromenaden-Halbmarathon.
            </p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center gap-4 self-start md:self-auto">
            <div>
              <span className="text-xs text-slate-400 block">Zielzeit-Kalkulation</span>
              <span className="text-2xl font-black text-cyan-400">4:38:00 h</span>
              <span className="text-[11px] text-slate-400 block">33m Swim • 2h24m Bike • 1h34m Run</span>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-4 flex-wrap">
          <button
            onClick={() => setSelectedDiscipline('bike')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              selectedDiscipline === 'bike'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white bg-slate-800/60'
            }`}
          >
            <Mountain className="w-4 h-4" />
            <span>90km Rad & Filzensattel</span>
          </button>

          <button
            onClick={() => setSelectedDiscipline('swim')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              selectedDiscipline === 'swim'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white bg-slate-800/60'
            }`}
          >
            <Waves className="w-4 h-4" />
            <span>1,9km Zeller See Schwimmen</span>
          </button>

          <button
            onClick={() => setSelectedDiscipline('run')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              selectedDiscipline === 'run'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white bg-slate-800/60'
            }`}
          >
            <Footprints className="w-4 h-4" />
            <span>21,1km Seelauf & Pacing</span>
          </button>

          <button
            onClick={() => setSelectedDiscipline('nutrition')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              selectedDiscipline === 'nutrition'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-300 hover:text-white bg-slate-800/60'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>Ernährung & Carbs</span>
          </button>
        </div>
      </div>

      {/* DISCIPLINE SECTIONS */}
      {selectedDiscipline === 'bike' && (
        <div className="space-y-6">
          {/* Filzensattel Elevation SVG Profile */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-amber-400" />
                  <span>90 km Radkurs Höhenprofil: Der Filzensattel (1.288 m ü. A.)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Schlüsselstelle bei km 30–38 mit bis zu 14% Maximalsteigung. Nicht überzocken!
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold self-start sm:self-auto">
                +1.288 Hm gesamt
              </span>
            </div>

            {/* Elevation SVG */}
            <div className="h-56 w-full bg-slate-950 rounded-xl p-4 border border-slate-800 relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 130" preserveAspectRatio="none">
                {/* Elevation shape */}
                <polygon
                  fill="url(#filzenGrad)"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                  points="
                    0,120
                    80,118
                    160,115
                    220,105
                    280,75
                    310,40
                    325,18
                    340,45
                    400,98
                    480,108
                    560,115
                    640,118
                    700,120
                  "
                />

                {/* Marker for Filzensattel Peak */}
                <circle cx="325" cy="18" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                <text x="335" y="22" fill="#f87171" fontSize="11" fontWeight="bold">
                  Filzensattel 1.288m (14%)
                </text>

                {/* Pacing Sectors text */}
                <text x="70" y="110" fill="#94a3b8" fontSize="10">
                  Flach Z3 (280W)
                </text>
                <text x="240" y="65" fill="#f59e0b" fontSize="10" fontWeight="bold">
                  K3 Klettern (360-380W)
                </text>
                <text x="410" y="90" fill="#38bdf8" fontSize="10">
                  Aero Abfahrt &gt; 70 km/h
                </text>
                <text x="540" y="105" fill="#38bdf8" fontSize="10">
                  High-Speed TT (290W)
                </text>

                <defs>
                  <linearGradient id="filzenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#090d16" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Pacing Breakdown Table for 360W FTP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Sektor 1: Anfahrt & Flachstück (0-30 km)
              </span>
              <div className="text-xl font-bold text-cyan-400 mt-1">{flatTargetWatts} Watt</div>
              <p className="text-xs text-slate-300 mt-2">
                78% FTP im Marin Stelvio Aero-Aufsatz. Ruhig rollen lassen, Beine schonen, erste 750ml Flasche mit 45g Carbs trinken.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Sektor 2: Filzensattel Anstieg (30-42 km)
              </span>
              <div className="text-xl font-bold text-amber-400 mt-1">{climbTargetWatts} Watt max</div>
              <p className="text-xs text-slate-300 mt-2">
                K3-Kraftausdauer bei 70-75 U/min. Keinesfalls über 400W andrücken, da die 14% Rampe sonst Laktat aufbaut, das im Halbmarathon blockiert.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Sektor 3: Abfahrt & Rückweg (42-90 km)
              </span>
              <div className="text-xl font-bold text-emerald-400 mt-1">285 - 295 Watt</div>
              <p className="text-xs text-slate-300 mt-2">
                In Maria Alm und Saalfelden Druck auf das Pedal bringen. Letzte 5 km Kadenz leicht steigern (95 U/min), um die Beine auf den Koppel-Lauf vorzubereiten.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedDiscipline === 'swim' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Waves className="w-4 h-4 text-cyan-400" />
            <span>1,9 km Schwimmen im Zeller See</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Der Zeller See gehört zu den saubersten Badeseen Europas mit Trinkwasserqualität. Der Kurs ist eine 1-Runden-Strecke in U-Form mit Start am Strandbad Seecamp.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Wassertemperatur</span>
              <span className="text-lg font-bold text-cyan-400">19 - 22 °C</span>
              <span className="text-[11px] text-slate-500 block mt-1">Neoprenanzug in 90% der Fälle erlaubt.</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Swolf Zielwert</span>
              <span className="text-lg font-bold text-emerald-400">Swolf 37 - 38</span>
              <span className="text-[11px] text-slate-500 block mt-1">Langer Zug & Gleiten statt Frequenzhektik.</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Rennziel-Split</span>
              <span className="text-lg font-bold text-white">33:00 - 34:00 min</span>
              <span className="text-[11px] text-slate-500 block mt-1">Pace ~1:45 min/100m im Neo.</span>
            </div>
          </div>
        </div>
      )}

      {selectedDiscipline === 'run' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Footprints className="w-4 h-4 text-emerald-400" />
            <span>21,1 km Halbmarathon am Seeufer</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Flacher Rundkurs direkt am Zeller See. Der Kurs führt durch den Stadtkern von Zell am See und entlang der malerischen Esplanade.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Schrittfrequenz (Cadence)</span>
              <span className="text-lg font-bold text-emerald-400">175 - 178 SPM</span>
              <span className="text-[11px] text-slate-500 block mt-1">Reduziert Muskelermüdung nach dem Radfahren.</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Zielpace</span>
              <span className="text-lg font-bold text-cyan-400">4:25 - 4:32 min/km</span>
              <span className="text-[11px] text-slate-500 block mt-1">Entspricht ca. 1:34 h Halbmarathon.</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Hitze- & Kühlstrategie</span>
              <span className="text-lg font-bold text-purple-300">Eis & Schwämme</span>
              <span className="text-[11px] text-slate-500 block mt-1">An jeder Labestation Kopf & Nacken kühlen.</span>
            </div>
          </div>
        </div>
      )}

      {selectedDiscipline === 'nutrition' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Droplets className="w-4 h-4 text-purple-400" />
            <span>Wettkampf-Ernährung (85 - 90 g Kohlenhydrate / Stunde)</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Bei 360W Rad-FTP und hohem Energieumsatz ist eine gezielte Kohlenhydrat-Zufuhr überlebenswichtig, um im Halbmarathon nicht einzubrechen.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Auf dem Rad (90 km)</span>
              <span className="text-lg font-bold text-amber-400">85 - 95 g Carbs / h</span>
              <span className="text-[11px] text-slate-400 block mt-1">Maltodextrin-Fruktose 1:0.8 Ratio in 2 Flaschen + 1 Gel vor Filzensattel.</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Beim Laufen (21,1 km)</span>
              <span className="text-lg font-bold text-emerald-400">55 - 65 g Carbs / h</span>
              <span className="text-[11px] text-slate-400 block mt-1">Hydrogels bei km 5, 10, 15 + Wasser mit Elektrolyten.</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Natrium & Flüssigkeit</span>
              <span className="text-lg font-bold text-cyan-400">700 - 900 mg Na+ / h</span>
              <span className="text-[11px] text-slate-400 block mt-1">Verhindert Krämpfe bei sommerlichen Bergabfahrten.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
