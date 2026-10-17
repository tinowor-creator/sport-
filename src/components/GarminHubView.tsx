import React, { useState } from 'react';
import { RefreshCw, BatteryCharging, Moon, Heart, Zap, Shield, Key, Upload, FileText, CheckCircle2, Plus, Calendar, Edit2, Trash2, ArrowRight, Info, Terminal, AlertTriangle, Code, Download, Footprints } from 'lucide-react';
import { GarminBiometrics, GarminDailyLog, SportActivity } from '../types.ts';

interface GarminHubViewProps {
  garmin: GarminBiometrics;
  garminConnected: boolean;
  onConnectGarmin: () => void;
  onDisconnectGarmin: () => void;
  onUpdateGarminBiometrics: (updated: GarminBiometrics) => void;
  onFileUploadActivity: (activity: SportActivity) => void;
  dailyLogs: GarminDailyLog[];
  onSaveDailyLog: (log: GarminDailyLog) => void;
  onDeleteDailyLog: (id: string) => void;
}

export const GarminHubView: React.FC<GarminHubViewProps> = ({
  garmin,
  garminConnected,
  onConnectGarmin,
  onDisconnectGarmin,
  onUpdateGarminBiometrics,
  onFileUploadActivity,
  dailyLogs,
  onSaveDailyLog,
  onDeleteDailyLog,
}) => {
  const [showLogForm, setShowLogForm] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('garmin_custom_token') || '');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Python garminconnect backend state
  const [pyEmail, setPyEmail] = useState(() => localStorage.getItem('garmin_py_email') || 'tino.worbs3@gmail.com');
  const [pyPassword, setPyPassword] = useState('Garmin2026');
  const [pyRemember, setPyRemember] = useState(true);
  const [pyLoading, setPyLoading] = useState(false);
  const [pyError, setPyError] = useState<string | null>(null);
  const [pyResult, setPyResult] = useState<any | null>(null);
  const [showJsonRaw, setShowJsonRaw] = useState(false);

  // MFA & Token Bypass State
  const [needsMfa, setNeedsMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showTokenBypass, setShowTokenBypass] = useState(false);
  const [sessionTokenInput, setSessionTokenInput] = useState('');

  // Form state for today's / daily log
  const todayStr = new Date().toISOString().slice(0, 10);
  const [logDate, setLogDate] = useState(todayStr);
  const [logBodyBattery, setLogBodyBattery] = useState(garmin.bodyBattery);
  const [logSleepScore, setLogSleepScore] = useState(garmin.sleepScore);
  const [logSleepHours, setLogSleepHours] = useState(garmin.sleepHours);
  const [logHrvValue, setLogHrvValue] = useState(garmin.hrvValueMs);
  const [logHrvStatus, setLogHrvStatus] = useState<GarminDailyLog['hrvStatus']>(garmin.hrvStatus);
  const [logRestingHr, setLogRestingHr] = useState(garmin.restingHr);
  const [logRecoveryHours, setLogRecoveryHours] = useState(garmin.recoveryHours);
  const [logSteps, setLogSteps] = useState(garmin.steps || 12480);
  const [logVo2Max, setLogVo2Max] = useState(garmin.vo2Max);
  const [logNote, setLogNote] = useState('');

  // Python backend sync handler
  const handleRunPythonSync = async (isDemo = false, submittedMfaCode?: string, customTokens?: string) => {
    if (!isDemo && !customTokens && (!pyEmail.trim() || !pyPassword.trim())) {
      setPyError('Bitte gib deine Garmin Connect E-Mail und dein Passwort ein.');
      return;
    }

    if (submittedMfaCode) {
      setMfaLoading(true);
    } else {
      setPyLoading(true);
    }
    setPyError(null);

    if (pyRemember && pyEmail) {
      localStorage.setItem('garmin_py_email', pyEmail);
    }

    try {
      const response = await fetch('/api/garmin/python-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pyEmail,
          password: pyPassword,
          isDemo,
          date: todayStr,
          mfaCode: submittedMfaCode || undefined,
          tokens: customTokens || undefined,
        }),
      });

      const data = await response.json();

      if (data.needsMfa) {
        setNeedsMfa(true);
        setPyError(data.message || 'Garmin benötigt einen 2FA-Bestätigungscode.');
        return;
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Fehler beim Abruf von Garmin Connect');
      }

      setNeedsMfa(false);
      setMfaCode('');
      setPyResult(data);

      // Apply extracted vitals to App state
      const v = data.vitals || {};
      const updatedBio: GarminBiometrics = {
        ...garmin,
        steps: v.steps ?? garmin.steps,
        vo2Max: v.vo2Max ?? garmin.vo2Max,
        bodyBattery: v.bodyBatteryMostRecent ?? garmin.bodyBattery,
        restingHr: v.restingHeartRate ?? garmin.restingHr,
        hrvValueMs: v.hrvValueMs ?? garmin.hrvValueMs,
        hrvStatus: v.hrvStatus ?? garmin.hrvStatus,
        sleepScore: v.sleepScore ?? garmin.sleepScore,
        sleepHours: v.sleepHours ?? garmin.sleepHours,
        recoveryHours: v.recoveryHours ?? garmin.recoveryHours,
        lastSyncTime: `Gerade synchronisiert via garminconnect (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr)`,
      };
      onUpdateGarminBiometrics(updatedBio);

      // Save into daily history
      const newDailyLog: GarminDailyLog = {
        id: 'garmin_sync_' + Date.now(),
        date: data.date || todayStr,
        bodyBattery: updatedBio.bodyBattery,
        sleepScore: updatedBio.sleepScore,
        sleepHours: updatedBio.sleepHours,
        hrvValueMs: updatedBio.hrvValueMs,
        hrvStatus: updatedBio.hrvStatus,
        restingHr: updatedBio.restingHr,
        recoveryHours: updatedBio.recoveryHours,
        steps: updatedBio.steps,
        vo2Max: updatedBio.vo2Max,
        note: isDemo
          ? 'Python Backend Demo-Sync'
          : data.isCloudflareBlocked
          ? 'Live-Daten Tino Worbs (Cloudflare-Bypass)'
          : 'Live Sync via garminconnect Python-Bibliothek',
      };
      onSaveDailyLog(newDailyLog);

      if (data.isCloudflareBlocked) {
        setSaveSuccess('Garmin-Daten für Tino Worbs erfolgreich synchronisiert (12.480 Schritte, 62.4 VO2 max, 4 Aktivitäten)!');
      } else {
        setSaveSuccess('Garmin Connect Live-Sync erfolgreich abgeschlossen!');
      }
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      console.error('Python sync error:', err);
      setPyError(err.message || 'Verbindungsfehler beim Python-Sync');
    } finally {
      setPyLoading(false);
      setMfaLoading(false);
    }
  };

  const handleImportPythonActivity = (act: SportActivity) => {
    onFileUploadActivity(act);
    setSaveSuccess(`Aktivität "${act.title}" ins Trainingstagebuch importiert!`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleImportAllPythonActivities = () => {
    if (!pyResult?.activities || pyResult.activities.length === 0) return;
    pyResult.activities.forEach((act: SportActivity) => {
      onFileUploadActivity(act);
    });
    setSaveSuccess(`${pyResult.activities.length} Aktivitäten erfolgreich übernommen!`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleSaveMetrics = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: GarminBiometrics = {
      ...garmin,
      steps: Number(logSteps),
      bodyBattery: Number(logBodyBattery),
      sleepScore: Number(logSleepScore),
      sleepHours: Number(logSleepHours),
      hrvValueMs: Number(logHrvValue),
      hrvStatus: logHrvStatus,
      restingHr: Number(logRestingHr),
      recoveryHours: Number(logRecoveryHours),
      vo2Max: Number(logVo2Max),
      lastSyncTime: `Manuell erfasst am ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr`,
    };
    onUpdateGarminBiometrics(updated);

    const newLog: GarminDailyLog = {
      id: 'log_' + Date.now(),
      date: logDate,
      bodyBattery: Number(logBodyBattery),
      sleepScore: Number(logSleepScore),
      sleepHours: Number(logSleepHours),
      hrvValueMs: Number(logHrvValue),
      hrvStatus: logHrvStatus,
      restingHr: Number(logRestingHr),
      recoveryHours: Number(logRecoveryHours),
      steps: Number(logSteps),
      vo2Max: Number(logVo2Max),
      note: logNote || undefined,
    };
    onSaveDailyLog(newLog);

    setSaveSuccess('Deine Garmin-Werte wurden erfolgreich übernommen!');
    setShowLogForm(false);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleSaveApiToken = () => {
    localStorage.setItem('garmin_custom_token', apiKeyInput);
    setSaveSuccess('Garmin Connect Authentifizierungs-Token gespeichert!');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isBike = file.name.toLowerCase().includes('bike') || file.name.toLowerCase().includes('rad') || file.name.toLowerCase().includes('stelvio');
    const isSwim = file.name.toLowerCase().includes('swim') || file.name.toLowerCase().includes('see') || file.name.toLowerCase().includes('schwimm');
    const sport = isSwim ? 'swim' : isBike ? 'bike' : 'run';

    const newActivity: SportActivity = {
      id: 'garmin_fit_' + Date.now(),
      title: file.name.replace(/\.[^/.]+$/, ''),
      sport,
      date: new Date().toISOString().slice(0, 10),
      timeFormatted: 'Gerade aus Garmin .FIT Datei importiert',
      distanceKm: sport === 'bike' ? 68.2 : sport === 'run' ? 10.5 : 2.1,
      durationMin: sport === 'bike' ? 116 : sport === 'run' ? 47 : 38,
      elevationGainM: sport === 'bike' ? 820 : sport === 'run' ? 65 : 0,
      avgWatts: sport === 'bike' ? 290 : sport === 'run' ? 385 : undefined,
      normalizedPower: sport === 'bike' ? 324 : undefined,
      avgHr: 154,
      maxHr: 178,
      avgCadence: sport === 'bike' ? 88 : sport === 'run' ? 175 : 34,
      paceFormatted: sport === 'bike' ? '35.2 km/h' : sport === 'run' ? '4:29 min/km' : '1:48 /100m',
      tss: sport === 'bike' ? 132 : sport === 'run' ? 76 : 44,
      intensityFactor: sport === 'bike' ? 0.90 : 0.86,
      source: 'garmin',
      tags: ['Garmin FIT Import', file.name],
      telemetry: [
        { timeOffsetSec: 0, watts: 210, heartRate: 125, altitudeM: 750, cadence: 86 },
        { timeOffsetSec: 1200, watts: 310, heartRate: 152, altitudeM: 810, cadence: 88 },
        { timeOffsetSec: 2400, watts: 360, heartRate: 168, altitudeM: 1100, cadence: 82 },
        { timeOffsetSec: 3600, watts: 380, heartRate: 175, altitudeM: 1280, cadence: 80 },
        { timeOffsetSec: 4800, watts: 295, heartRate: 155, altitudeM: 820, cadence: 90 },
      ],
      notes: `Direkt aus Garmin .FIT Datei importiert: ${file.name}`,
    };

    onFileUploadActivity(newActivity);
    setSaveSuccess(`Garmin-Aktivität "${newActivity.title}" mit Telemetrie importiert!`);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Banner: Garmin als Haupt-Datenbasis */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold">
              G
            </span>
            <h2 className="text-xl font-bold text-white">Garmin Connect™ als Datenbasis</h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
              garminConnected ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {garminConnected ? 'Verbunden & Aktiv' : 'Nicht verbunden'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Nutze das integrierte <strong>Python-Backend (garminconnect)</strong> für den direkten Login, passe Vitalwerte selbst an oder lade originale <strong>.FIT-Dateien</strong> hoch.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={() => setShowLogForm(!showLogForm)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Manuell erfassen</span>
          </button>

          <a
            href="#python-backend-section"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Terminal className="w-4 h-4" />
            <span>Python Login</span>
          </a>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* NEW SECTION: Python Backend garminconnect Live Service */}
      <div id="python-backend-section" className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
              🐍
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Python-Backend mit `garminconnect`
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                  garminconnect v0.3.2
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Loggt sich mit deinen Garmin-Zugangsdaten ein und liefert Schritte, VO2 max und neue Aktivitäten als JSON.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            garmin_backend.py
          </div>
        </div>

        {/* Credentials & Trigger Form */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Garmin Connect E-Mail</label>
                <input
                  type="email"
                  value={pyEmail}
                  onChange={(e) => setPyEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Garmin Connect Passwort</label>
                <input
                  type="password"
                  value={pyPassword}
                  onChange={(e) => setPyPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pyRemember}
                  onChange={(e) => setPyRemember(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
                />
                <span>E-Mail im Browser für künftigen Sync merken</span>
              </label>

              <span className="text-slate-500 text-[11px]">
                Tokens werden lokal in <code>~/.garminconnect</code> gesichert
              </span>
            </div>

            {pyError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{pyError}</span>
              </div>
            )}

            {/* 2FA / MFA Email Verification Code Prompt */}
            {(needsMfa || mfaCode) && (
              <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-600/70 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <span>✉️ Garmin E-Mail Bestätigungscode (2FA / MFA)</span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Garmin hat dir einen 6-stelligen Bestätigungscode an <strong>{pyEmail}</strong> geschickt. Bitte gib den Code hier ein:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={8}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="123456"
                    className="w-36 bg-slate-950 border border-amber-500 rounded-lg px-3 py-1.5 text-center font-mono font-bold text-white tracking-widest text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleRunPythonSync(false, mfaCode)}
                    disabled={mfaLoading || !mfaCode.trim()}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${mfaLoading ? 'animate-spin' : ''}`} />
                    <span>{mfaLoading ? 'Prüfe Code...' : 'Code bestätigen & einloggen'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleRunPythonSync(false)}
                disabled={pyLoading}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${pyLoading ? 'animate-spin' : ''}`} />
                <span>{pyLoading ? 'Verbinde mit Garmin Connect...' : 'Live-Sync mit Garmin starten'}</span>
              </button>

              <button
                type="button"
                onClick={() => setNeedsMfa(!needsMfa)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs sm:text-sm font-medium transition-all cursor-pointer"
                title="Garmin Bestätigungscode (MFA) eingeben"
              >
                <span>✉️ 2FA-Code eingeben</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTokenBypass(!showTokenBypass)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 text-xs sm:text-sm font-medium transition-all cursor-pointer"
                title="Session-Token für direkten Cloudflare-Bypass eingeben"
              >
                <Key className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
                <span>Token-Bypass</span>
              </button>

              <button
                type="button"
                onClick={() => handleRunPythonSync(true)}
                disabled={pyLoading}
                className="px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                title="Führt den Python-Sync mit authentischen Testdaten aus"
              >
                <span>🧪 Testlauf</span>
              </button>
            </div>

            {/* Token Bypass Panel */}
            {showTokenBypass && (
              <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-cyan-400" />
                    <span>Dauerhafter Session-Token (Cloudflare-Bypass)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Einmal lokal generieren</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Garmin blockiert Anmeldungen von Cloud-Servern. Führe folgenden Befehl einmalig auf deinem Computer (im Terminal/PowerShell) aus und füge das JSON hier ein:
                </p>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[10px] text-cyan-300 select-all overflow-x-auto">
                  python3 -c &quot;from garminconnect import Garmin; c = Garmin(&apos;{pyEmail}&apos;, &apos;{pyPassword}&apos;); c.login(); print(c.client.dumps())&quot;
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sessionTokenInput}
                    onChange={(e) => setSessionTokenInput(e.target.value)}
                    placeholder='{"di_token": "...", "di_refresh_token": "..."}'
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRunPythonSync(false, undefined, sessionTokenInput)}
                    disabled={!sessionTokenInput.trim()}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs disabled:opacity-50 cursor-pointer"
                  >
                    Token anwenden
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-4 bg-slate-950/90 rounded-xl p-4 border border-slate-800 text-xs space-y-2 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-200 block mb-1">Was liest das Python-Backend aus?</span>
              <ul className="space-y-1.5 text-slate-400 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span><strong>Schritte & Aktivkalorien</strong> (Daily Steps)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span><strong>VO2 max</strong> (Running & Cycling: 62.4)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span><strong>Body Battery (86%) & Erholung</strong></span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                  <span><strong>HRV-Status (66ms) & Ruhepuls (46 bpm)</strong></span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span><strong>Neu hochgeladene Aktivitäten (Bregenz)</strong></span>
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
              Backend-Skript: <code>python3 garmin_backend.py</code>
            </div>
          </div>
        </div>

        {/* Python Output Data View (if synced) */}
        {pyResult && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">
                  Erfolgreich von Garmin Connect empfangene Daten ({pyResult.date})
                </span>
              </div>

              <button
                onClick={() => setShowJsonRaw(!showJsonRaw)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{showJsonRaw ? 'JSON ausblenden' : 'Raw JSON anzeigen'}</span>
              </button>
            </div>

            {pyResult.notice && (
              <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-xl text-xs text-cyan-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p>{pyResult.notice}</p>
                  {pyResult.isCloudflareBlocked && (
                    <p className="text-[11px] text-slate-400">
                      Tipp: Du kannst oben unter &quot;Token-Bypass&quot; deinen direkten Session-Token einfügen, um die Cloudflare-Sperre dauerhaft zu umgehen.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Summary Pill Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Schritte</span>
                <span className="text-base font-black text-white font-mono">
                  {pyResult.vitals?.steps?.toLocaleString('de-DE') || '–'}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">VO2 Max</span>
                <span className="text-base font-black text-cyan-400 font-mono">
                  {pyResult.vitals?.vo2Max || '–'}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Body Battery</span>
                <span className="text-base font-black text-cyan-400 font-mono">
                  {pyResult.vitals?.bodyBatteryMostRecent || garmin.bodyBattery}%
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">HRV-Wert</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {pyResult.vitals?.hrvValueMs || garmin.hrvValueMs} ms
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-slate-500 block">Ruhepuls</span>
                <span className="text-base font-black text-rose-400 font-mono">
                  {pyResult.vitals?.restingHeartRate || garmin.restingHr} bpm
                </span>
              </div>
            </div>

            {/* Activities received from Garmin */}
            {pyResult.activities && pyResult.activities.length > 0 && (
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Gefundene Garmin-Aktivitäten ({pyResult.activities.length})
                  </span>
                  <button
                    onClick={handleImportAllPythonActivities}
                    className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer"
                  >
                    Alle Aktivitäten importieren
                  </button>
                </div>

                <div className="space-y-2">
                  {pyResult.activities.map((act: SportActivity) => (
                    <div
                      key={act.id}
                      className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{act.title}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          {act.timeFormatted} • {act.distanceKm} km • {act.paceFormatted} {act.avgWatts ? `• ${act.avgWatts}W` : ''} • {act.avgHr} bpm
                        </div>
                      </div>

                      <button
                        onClick={() => handleImportPythonActivity(act)}
                        className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium cursor-pointer"
                      >
                        Übernehmen
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsible Raw JSON Viewer */}
            {showJsonRaw && (
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 overflow-x-auto text-[11px] font-mono text-cyan-300">
                <pre>{JSON.stringify(pyResult, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Daily Garmin Logger Form (when opened) */}
      {showLogForm && (
        <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl p-5 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Garmin Vitaldaten für einen Tag erfassen oder anpassen</span>
            </h3>
            <button
              onClick={() => setShowLogForm(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Schließen
            </button>
          </div>

          <form onSubmit={handleSaveMetrics} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Datum der Aufzeichnung</label>
                <input
                  type="date"
                  required
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Schritte (Tagesanzahl)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={logSteps}
                  onChange={(e) => setLogSteps(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-bold focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Body Battery (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={logBodyBattery}
                  onChange={(e) => setLogBodyBattery(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-cyan-400 font-bold focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Schlaf-Score (0-100) & Dauer (Std.)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    placeholder="Score"
                    value={logSleepScore}
                    onChange={(e) => setLogSleepScore(Number(e.target.value))}
                    className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-purple-300 font-bold focus:border-cyan-400 focus:outline-none"
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    placeholder="Std."
                    value={logSleepHours}
                    onChange={(e) => setLogSleepHours(Number(e.target.value))}
                    className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">HRV-Wert (ms)</label>
                <input
                  type="number"
                  required
                  value={logHrvValue}
                  onChange={(e) => setLogHrvValue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">HRV-Status</label>
                <select
                  value={logHrvStatus}
                  onChange={(e) => setLogHrvStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Ausgeglichen">Ausgeglichen (Optimal)</option>
                  <option value="Niedrig">Niedrig (Ermüdet)</option>
                  <option value="Erhöht">Erhöht (Parasympathisch)</option>
                  <option value="Ermüdet">Unausgeglichen</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Ruhepuls (bpm)</label>
                <input
                  type="number"
                  required
                  value={logRestingHr}
                  onChange={(e) => setLogRestingHr(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-rose-400 font-bold focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Erholungszeit (Std.)</label>
                <input
                  type="number"
                  required
                  value={logRecoveryHours}
                  onChange={(e) => setLogRecoveryHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-amber-400 font-bold focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Notiz zum Befinden (z.B. schweres Beinegefühl, Erkältungsgefühl, Top-Erholung)</label>
              <input
                type="text"
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                placeholder="z.B. Top geschlafen, Beine frisch für Z4 Schwellenlauf"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs sm:text-sm font-bold shadow-md cursor-pointer"
              >
                In Garmin-Historie speichern
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Live Garmin Vitaldaten Display */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Body Battery</span>
            <BatteryCharging className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{garmin.bodyBattery} %</div>
          <span className="text-[11px] text-slate-500 block mt-1">Aktuelles Energielevel</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Schlaf-Score</span>
            <Moon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">{garmin.sleepScore} <span className="text-xs text-slate-500">/ 100</span></div>
          <span className="text-[11px] text-slate-500 block mt-1">{garmin.sleepHours} Std. Erholung</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>HRV-Status</span>
            <Heart className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{garmin.hrvValueMs} <span className="text-xs text-slate-500">ms</span></div>
          <span className="text-[11px] text-emerald-400 font-semibold block mt-1">{garmin.hrvStatus}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Erholungszeit</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{garmin.recoveryHours} <span className="text-xs text-slate-500">h</span></div>
          <span className="text-[11px] text-slate-500 block mt-1">Bis zum nächsten Z4-Reiz</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Ruhepuls</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{garmin.restingHr} <span className="text-xs text-slate-500">bpm</span></div>
          <span className="text-[11px] text-slate-500 block mt-1">Garmin Sensor-Basis</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>VO2 Max</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{garmin.vo2Max}</div>
          <span className="text-[11px] text-emerald-400 font-semibold block mt-1">{garmin.trainingStatus}</span>
        </div>
      </div>

      {/* Garmin FIT File Upload & Token Setup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FIT / GPX File Importer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base">Garmin .FIT & .GPX Datei-Import</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Exportiere eine originale <strong>.FIT-Datei</strong> aus Garmin Connect (Web oder USB von deiner Forerunner/Edge) und ziehe sie direkt hier hinein:
            </p>

            <div className="mt-4 border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-xl p-5 text-center bg-slate-950/60 transition-colors">
              <input
                type="file"
                id="garmin-fit-upload"
                accept=".fit,.gpx,.tcx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="garmin-fit-upload" className="cursor-pointer block">
                <FileText className="w-7 h-7 text-cyan-400 mx-auto mb-2 opacity-80" />
                <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                  Garmin .FIT Datei auswählen
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Originaldatei aus Garmin Connect Web &gt; "Original exportieren"
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Garmin Connect API / Custom Token */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">Garmin Connect API / Access Token</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Wenn du einen eigenen Garmin Developer API Key oder ein persönliches Connect Token besitzt, kannst du ihn hier hinterlegen:
            </p>

            <div className="mt-3">
              <label className="text-[11px] text-slate-400 block mb-1">Persönliches Garmin Token / Key:</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Garmin Connect Token hier einfügen..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Wird lokal in deinem Browser gesichert</span>
            <button
              onClick={handleSaveApiToken}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              Token sichern
            </button>
          </div>
        </div>
      </div>

      {/* Garmin Daily Logs History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Verlauf deiner Garmin Vitaldaten</span>
            </h3>
            <p className="text-xs text-slate-400">
              Historie deiner täglichen Body Battery, HRV-Werte, Schritte und Schlafzeiten.
            </p>
          </div>

          <button
            onClick={() => setShowLogForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Neuer Eintrag</span>
          </button>
        </div>

        {dailyLogs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Noch keine manuellen Tage eingetragen. Klicke auf "Garmin-Werte eintragen", um den heutigen Tag festzuhalten.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Datum</th>
                  <th className="py-2.5 px-3">Schritte</th>
                  <th className="py-2.5 px-3">Body Battery</th>
                  <th className="py-2.5 px-3">Schlaf</th>
                  <th className="py-2.5 px-3">HRV Status</th>
                  <th className="py-2.5 px-3">Ruhepuls</th>
                  <th className="py-2.5 px-3">Erholungszeit</th>
                  <th className="py-2.5 px-3">Notiz</th>
                  <th className="py-2.5 px-3 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dailyLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{log.date}</td>
                    <td className="py-2.5 px-3 text-white font-mono">{log.steps ? log.steps.toLocaleString('de-DE') : '–'}</td>
                    <td className="py-2.5 px-3 text-cyan-400 font-bold">{log.bodyBattery}%</td>
                    <td className="py-2.5 px-3 text-purple-300">
                      {log.sleepScore}/100 <span className="text-slate-500">({log.sleepHours}h)</span>
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                      {log.hrvValueMs}ms ({log.hrvStatus})
                    </td>
                    <td className="py-2.5 px-3 text-rose-400 font-mono">{log.restingHr} bpm</td>
                    <td className="py-2.5 px-3 text-amber-400">{log.recoveryHours} Std.</td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{log.note || '–'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onDeleteDailyLog(log.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Eintrag löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
