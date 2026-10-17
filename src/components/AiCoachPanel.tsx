import React, { useState } from 'react';
import { Sparkles, Send, RefreshCw, CheckCircle2, MessageSquare, AlertCircle, Zap, Shield, Bike, Footprints, Waves } from 'lucide-react';
import { AthleteProfile, WeeklyPlan, GarminBiometrics, SportActivity } from '../types.ts';

interface AiCoachPanelProps {
  athlete: AthleteProfile;
  plans: WeeklyPlan;
  currentWeek: 'A' | 'B';
  garmin: GarminBiometrics;
  activities: SportActivity[];
  presetAnalysisResult?: string | null;
}

export const AiCoachPanel: React.FC<AiCoachPanelProps> = ({
  athlete,
  plans,
  currentWeek,
  garmin,
  activities,
  presetAnalysisResult,
}) => {
  const [analysisText, setAnalysisText] = useState<string | null>(presetAnalysisResult || null);
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [activePreset, setActivePreset] = useState<string>('Wochenplan A');

  // Trigger analysis via backend API
  const runAiAnalysis = async (mode: string, customPrompt?: string) => {
    setLoading(true);
    setAnalysisText(null);

    try {
      const response = await fetch('/api/coach/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          athleteProfile: athlete,
          currentWeek,
          plan: plans[currentWeek],
          recentActivities: activities,
          garminMetrics: garmin,
          userPrompt: customPrompt,
        }),
      });

      const data = await response.json();
      if (data.analysis) {
        setAnalysisText(data.analysis);
      } else if (data.fallback) {
        setAnalysisText(data.fallback);
      } else {
        setAnalysisText('Antwort konnte nicht geladen werden.');
      }
    } catch (err: any) {
      console.error('Error in AI analysis:', err);
      setAnalysisText('Verbindungsfehler beim Abrufen der KI-Analyse. Bitte prüfe die Internetverbindung.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    runAiAnalysis('custom_question', userInput);
    setUserInput('');
  };

  // Helper to format markdown headers and bolding
  const formatCoachText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-base font-bold text-cyan-300 mt-4 mb-2 flex items-center gap-2">
            <span>{line.replace('### ', '')}</span>
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-lg font-black text-white mt-5 mb-2 border-b border-slate-800 pb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={idx} className="font-bold text-slate-100 mt-2 mb-1">
            {line.replaceAll('**', '')}
          </p>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const itemContent = line.slice(2);
        // Replace inner **bold**
        const parts = itemContent.split('**');
        return (
          <li key={idx} className="ml-4 list-disc text-slate-300 text-xs sm:text-sm my-1 leading-relaxed">
            {parts.map((p, pIdx) => (pIdx % 2 === 1 ? <strong key={pIdx} className="text-white font-semibold">{p}</strong> : p))}
          </li>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <div key={idx} className="text-slate-300 text-xs sm:text-sm my-1.5 leading-relaxed pl-2 border-l-2 border-cyan-500/50">
            {line}
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs sm:text-sm text-slate-300 leading-relaxed my-1">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Coach Introduction Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white">Dein persönlicher KI-Triathlon Coach</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
              Gemini 3.8 Flash
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Spezialisiert auf den <strong>Ironman 70.3 Zell am See</strong>. Erkennt Überlastungen, prüft Garmin-Regenerationsdaten, berechnet Rennspezifik und optimiert deinen 2-Wochen-Wechselplan.
          </p>
        </div>

        {/* Quick status pill */}
        <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-3 self-start sm:self-auto">
          <span>Rad-FTP: <strong className="text-amber-400">{athlete.bikeFtp}W</strong></span>
          <span>5k: <strong className="text-emerald-400">{athlete.run5kTime}</strong></span>
          <span>Body Battery: <strong className="text-cyan-400">{garmin.bodyBattery}%</strong></span>
        </div>
      </div>

      {/* Preset Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setActivePreset(`Wochenplan ${currentWeek}`);
            runAiAnalysis('evaluate_plan');
          }}
          disabled={loading}
          className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/60 rounded-xl text-left transition-all cursor-pointer group disabled:opacity-50"
        >
          <div className="text-xs text-slate-400 group-hover:text-emerald-400 flex items-center justify-between mb-1">
            <span>Plan-Check</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-white">Woche {currentWeek} bewerten</div>
          <p className="text-[11px] text-slate-500 mt-1">Periodisierung & 80:20 Reizverhältnis</p>
        </button>

        <button
          onClick={() => {
            setActivePreset('Alternativ-Plan');
            runAiAnalysis('suggest_variation');
          }}
          disabled={loading}
          className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/60 rounded-xl text-left transition-all cursor-pointer group disabled:opacity-50"
        >
          <div className="text-xs text-slate-400 group-hover:text-purple-400 flex items-center justify-between mb-1">
            <span>Variation</span>
            <Zap className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white">Alternativ-Vorschlag</div>
          <p className="text-[11px] text-slate-500 mt-1">Neue Reize für Woche {currentWeek}</p>
        </button>

        <button
          onClick={() => {
            setActivePreset('Filzensattel Pacing');
            runAiAnalysis(
              'custom_question',
              `Wie soll ich mit 360W Rad-FTP und Marin Stelvio den Filzensattel (14% Rampe, 1288m) bei Ironman 70.3 Zell am See einteilen, um beim Halbmarathon nicht einzubrechen?`
            );
          }}
          disabled={loading}
          className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/60 rounded-xl text-left transition-all cursor-pointer group disabled:opacity-50"
        >
          <div className="text-xs text-slate-400 group-hover:text-amber-400 flex items-center justify-between mb-1">
            <span>Rennspezifik</span>
            <Bike className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white">Filzensattel Pacing</div>
          <p className="text-[11px] text-slate-500 mt-1">14% Rampe Watt-Kalkulation</p>
        </button>

        <button
          onClick={() => {
            setActivePreset('Tagesform-Check');
            runAiAnalysis(
              'custom_question',
              `Bewerte meine heutige Garmin-Erholungsbasis (Body Battery ${garmin.bodyBattery}%, Schlaf-Score ${garmin.sleepScore}/100, HRV ${garmin.hrvValueMs}ms ${garmin.hrvStatus}, Erholungszeit ${garmin.recoveryHours}h). Kann ich heute die geplante Schwellen-Session voll durchziehen oder empfiehlst du eine Anpassung?`
            );
          }}
          disabled={loading}
          className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/60 rounded-xl text-left transition-all cursor-pointer group disabled:opacity-50"
        >
          <div className="text-xs text-slate-400 group-hover:text-cyan-400 flex items-center justify-between mb-1">
            <span>Regeneration</span>
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-white">Garmin Vital-Check</div>
          <p className="text-[11px] text-slate-500 mt-1">HRV & Body Battery Analyse</p>
        </button>
      </div>

      {/* Main Analysis Output Screen */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-slate-200">
              Coaching Report: {activePreset}
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Server-side AI • Zero-Lag
          </div>
        </div>

        <div className="p-5 sm:p-6 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-slate-700 border-t-cyan-400 rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-200">
                KI analysiert Trainingsreize, Garmin-Vitalwerte & Zell am See Streckenprofil...
              </p>
              <p className="text-xs text-slate-500">
                Berechne Intensitätsfaktoren und Watt-Vorgaben...
              </p>
            </div>
          ) : analysisText ? (
            <div className="prose prose-invert max-w-none">
              {formatCoachText(analysisText)}
            </div>
          ) : (
            <div className="text-center py-10 space-y-2 text-slate-400">
              <Sparkles className="w-8 h-8 text-cyan-400 mx-auto opacity-60" />
              <p className="text-sm font-medium text-slate-300">
                Klicke oben auf einen der Buttons oder stelle unten eine eigene Frage an deinen Coach.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Der Coach nutzt dein genaues Profil (360W FTP, Marin Stelvio, 5k 22:31min, Pfadfinder-Freitage) für punktgenaue Antworten.
              </p>
            </div>
          )}
        </div>

        {/* Free-form Prompt Input */}
        <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800">
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Frage den Coach z.B. 'Soll ich Samstag vor dem Koppel-Lauf schon Gels nehmen?'..."
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !userInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Fragen</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
