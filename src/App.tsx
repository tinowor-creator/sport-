/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, AppTab } from './components/Header.tsx';
import { VitalDashboard } from './components/VitalDashboard.tsx';
import { TrainingPlanView } from './components/TrainingPlanView.tsx';
import { ActivitiesManagementView } from './components/ActivitiesManagementView.tsx';
import { GarminHubView } from './components/GarminHubView.tsx';
import { SportAnalyticsView } from './components/SportAnalyticsView.tsx';
import { ZellAmSeeRadar } from './components/ZellAmSeeRadar.tsx';
import { AiCoachPanel } from './components/AiCoachPanel.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { ManualActivityModal } from './components/ManualActivityModal.tsx';
import { StravaImportModal } from './components/StravaImportModal.tsx';
import { recalculatePmcHistory, cleanDuplicateActivities, DeduplicationResult } from './utils/stravaDeduplication.ts';
import {
  AthleteProfile,
  WeeklyPlan,
  PlanSession,
  GarminBiometrics,
  GarminDailyLog,
  SportActivity,
  PmcDataPoint,
} from './types.ts';
import {
  initialAthleteProfile,
  defaultPlans,
  defaultGarminBiometrics,
  defaultActivities,
  initialPmcData,
} from './data/defaultData.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('plan');
  const [currentWeek, setCurrentWeek] = useState<'A' | 'B'>('A');

  // Athlete Profile State
  const [athlete, setAthlete] = useState<AthleteProfile>(() => {
    const saved = localStorage.getItem('triathlon_athlete_profile');
    return saved ? JSON.parse(saved) : initialAthleteProfile;
  });

  // Plans State
  const [plans, setPlans] = useState<WeeklyPlan>(() => {
    const saved = localStorage.getItem('triathlon_plans');
    return saved ? JSON.parse(saved) : defaultPlans;
  });

  // Garmin Biometrics & Daily Logs State
  const [garmin, setGarmin] = useState<GarminBiometrics>(() => {
    const saved = localStorage.getItem('garmin_biometrics');
    return saved ? JSON.parse(saved) : defaultGarminBiometrics;
  });

  const [garminDailyLogs, setGarminDailyLogs] = useState<GarminDailyLog[]>(() => {
    const saved = localStorage.getItem('garmin_daily_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'garmin_log_1',
        date: '2026-10-15',
        bodyBattery: 84,
        sleepScore: 87,
        sleepHours: 7.9,
        hrvValueMs: 65,
        hrvStatus: 'Ausgeglichen',
        restingHr: 46,
        recoveryHours: 14,
        vo2Max: 62,
        note: 'Guter Schlaf, Ruhepuls stabil auf 46 bpm',
      },
      {
        id: 'garmin_log_2',
        date: '2026-10-14',
        bodyBattery: 78,
        sleepScore: 82,
        sleepHours: 7.4,
        hrvValueMs: 62,
        hrvStatus: 'Ausgeglichen',
        restingHr: 47,
        recoveryHours: 20,
        vo2Max: 62,
        note: 'Nachmittags Marin Stelvio Ausfahrt absolviert',
      },
    ];
  });

  // Activities State with automatic deduplication & full 63 Garmin activities integration
  const [activities, setActivities] = useState<SportActivity[]>(() => {
    const saved = localStorage.getItem('triathlon_activities');
    const savedList = saved ? (JSON.parse(saved) as SportActivity[]) : [];
    // Ensure all 63 live Garmin activities are integrated with any custom/imported activities
    const combined = [...defaultActivities, ...savedList];
    const { cleanedActivities } = cleanDuplicateActivities(combined);
    localStorage.setItem('triathlon_activities', JSON.stringify(cleanedActivities));
    return cleanedActivities;
  });

  // Action to clean duplicates on demand
  const handleCleanDuplicates = () => {
    setActivities((prev) => {
      const { cleanedActivities, removedCount, removedTitles } = cleanDuplicateActivities(prev);
      localStorage.setItem('triathlon_activities', JSON.stringify(cleanedActivities));
      const updatedPmc = recalculatePmcHistory(cleanedActivities);
      setPmcData(updatedPmc);
      localStorage.setItem('triathlon_pmc_data', JSON.stringify(updatedPmc));

      if (removedCount > 0) {
        setImportNotification(
          `Bereinigung erfolgreich: ${removedCount} doppelte Aktivitäten entfernt (${removedTitles.slice(0, 2).join(', ')}).`
        );
      } else {
        setImportNotification('Alles sauber: Keine doppelten Aktivitäten in deiner Liste gefunden.');
      }
      setTimeout(() => setImportNotification(null), 5000);
      return cleanedActivities;
    });
  };

  // PMC Data State
  const [pmcData, setPmcData] = useState<PmcDataPoint[]>(() => {
    const saved = localStorage.getItem('triathlon_pmc_data');
    return saved ? JSON.parse(saved) : initialPmcData;
  });

  // Garmin & Strava connection states
  const [garminConnected, setGarminConnected] = useState<boolean>(() => {
    return localStorage.getItem('garmin_connected') !== 'false';
  });

  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isStravaImportModalOpen, setIsStravaImportModalOpen] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);
  const [activityToEdit, setActivityToEdit] = useState<SportActivity | null>(null);
  const [coachPresetResult, setCoachPresetResult] = useState<string | null>(null);

  // Strava Historical Import Handler with full PMC curve recalculation
  const handleImportStravaActivities = (
    newActivities: SportActivity[],
    dedupSummary: DeduplicationResult
  ) => {
    setActivities((prev) => {
      const combined = [...newActivities, ...prev];
      const { cleanedActivities } = cleanDuplicateActivities(combined);
      localStorage.setItem('triathlon_activities', JSON.stringify(cleanedActivities));

      // Recalculate complete PMC history across all activities
      const updatedPmc = recalculatePmcHistory(cleanedActivities);
      setPmcData(updatedPmc);
      localStorage.setItem('triathlon_pmc_data', JSON.stringify(updatedPmc));

      return cleanedActivities;
    });

    setImportNotification(
      `Erfolg: ${dedupSummary.uniqueCount} historische Strava-Aktivitäten importiert! (${dedupSummary.duplicateCount} Garmin-Duplikate ignoriert, PMC-Verlauf neu berechnet)`
    );
    setTimeout(() => setImportNotification(null), 6000);
  };

  // Recalculate PMC helper
  const updatePmcWithActivities = (currentActivities: SportActivity[]) => {
    setPmcData((prev) => {
      const copy = [...prev];
      // Sum TSS for today
      const todayStr = new Date().toISOString().slice(0, 10);
      const todaysActs = currentActivities.filter((a) => a.date === todayStr);
      const todayTss = todaysActs.reduce((acc, a) => acc + (a.tss || 0), 0);

      const lastIdx = copy.length - 1;
      if (lastIdx >= 0) {
        const prevPoint = copy[lastIdx - 1] || copy[lastIdx];
        const atl = Math.round(prevPoint.atl * 0.86 + todayTss * 0.14);
        const ctl = Math.round(prevPoint.ctl * 0.98 + todayTss * 0.02);
        copy[lastIdx] = {
          ...copy[lastIdx],
          tssToday: todayTss,
          atl,
          ctl,
          tsb: ctl - atl,
        };
      }
      localStorage.setItem('triathlon_pmc_data', JSON.stringify(copy));
      return copy;
    });
  };

  // Activity Handlers
  const handleSaveActivity = (activity: SportActivity) => {
    setActivities((prev) => {
      let updated: SportActivity[];
      const exists = prev.some((a) => a.id === activity.id);
      if (exists) {
        updated = prev.map((a) => (a.id === activity.id ? activity : a));
      } else {
        updated = [activity, ...prev];
      }
      localStorage.setItem('triathlon_activities', JSON.stringify(updated));
      updatePmcWithActivities(updated);
      return updated;
    });
    setActivityToEdit(null);
  };

  const handleEditActivity = (activity: SportActivity) => {
    setActivityToEdit(activity);
    setIsActivityModalOpen(true);
  };

  const handleDeleteActivity = (id: string) => {
    setActivities((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      localStorage.setItem('triathlon_activities', JSON.stringify(updated));
      updatePmcWithActivities(updated);
      return updated;
    });
  };

  const handleClearSampleData = () => {
    if (window.confirm('Möchtest du alle generierten Beispieldaten entfernen, um nur deine eigenen echten Aktivitäten zu nutzen?')) {
      setActivities((prev) => {
        const userOnly = prev.filter((a) => !a.id.startsWith('strava_act_'));
        localStorage.setItem('triathlon_activities', JSON.stringify(userOnly));
        updatePmcWithActivities(userOnly);
        return userOnly;
      });
    }
  };

  // Garmin Handlers
  const handleUpdateGarminBiometrics = (updated: GarminBiometrics) => {
    setGarmin(updated);
    localStorage.setItem('garmin_biometrics', JSON.stringify(updated));
  };

  const handleSaveDailyLog = (log: GarminDailyLog) => {
    setGarminDailyLogs((prev) => {
      const updated = [log, ...prev.filter((l) => l.date !== log.date)];
      localStorage.setItem('garmin_daily_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteDailyLog = (id: string) => {
    setGarminDailyLogs((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      localStorage.setItem('garmin_daily_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleConnectGarmin = async () => {
    try {
      const res = await fetch('/api/auth/garmin/url');
      const data = await res.json();
      if (data.url) {
        window.open(data.url, 'garmin_oauth', 'width=600,height=700');
        setGarminConnected(true);
        localStorage.setItem('garmin_connected', 'true');
      }
    } catch {
      setGarminConnected(true);
      localStorage.setItem('garmin_connected', 'true');
    }
  };

  const [isSyncingGarmin, setIsSyncingGarmin] = useState(false);

  // Live Garmin Connect Python Sync
  const handleSyncGarminLive = async () => {
    setIsSyncingGarmin(true);
    try {
      const res = await fetch('/api/garmin/python-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'tino.worbs3@gmail.com',
          password: 'Garmin2026',
        }),
      });
      const data = await res.json();
      if (data.success && data.vitals) {
        const v = data.vitals;
        const nowStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        const updatedBio: GarminBiometrics = {
          ...garmin,
          bodyBattery: v.bodyBatteryMostRecent ?? garmin.bodyBattery ?? 87,
          sleepScore: v.sleepScore ?? garmin.sleepScore ?? 94,
          sleepHours: v.sleepHours ?? garmin.sleepHours ?? 8.1,
          hrvStatus: (v.hrvStatus as any) ?? garmin.hrvStatus ?? 'Ausgeglichen',
          hrvValueMs: v.hrvValueMs ?? garmin.hrvValueMs ?? 65,
          hrvBaselineMs: v.hrvBaselineMs ?? garmin.hrvBaselineMs ?? 43,
          restingHr: v.restingHeartRate ?? garmin.restingHr ?? 51,
          recoveryHours: v.recoveryHours ?? garmin.recoveryHours ?? 14,
          vo2Max: v.vo2Max ?? garmin.vo2Max ?? 62.0,
          trainingStatus: v.trainingStatus ?? garmin.trainingStatus ?? 'Produktiv',
          steps: v.steps ?? garmin.steps ?? 803,
          lastSyncTime: `Garmin Connect Live (${nowStr} Uhr)`,
        };
        setGarmin(updatedBio);
        localStorage.setItem('garmin_biometrics', JSON.stringify(updatedBio));
        setGarminConnected(true);
        localStorage.setItem('garmin_connected', 'true');

        // Automatically import live Garmin activities and deduplicate
        if (data.activities && Array.isArray(data.activities) && data.activities.length > 0) {
          setActivities((prev) => {
            const combined = [...data.activities, ...prev];
            const { cleanedActivities } = cleanDuplicateActivities(combined);
            localStorage.setItem('triathlon_activities', JSON.stringify(cleanedActivities));
            updatePmcWithActivities(cleanedActivities);
            return cleanedActivities;
          });
        }

        // Save daily entry
        const todayStr = new Date().toISOString().slice(0, 10);
        const newDailyLog: GarminDailyLog = {
          id: `garmin_sync_${Date.now()}`,
          date: todayStr,
          bodyBattery: updatedBio.bodyBattery,
          sleepScore: updatedBio.sleepScore,
          sleepHours: updatedBio.sleepHours,
          hrvValueMs: updatedBio.hrvValueMs,
          hrvStatus: updatedBio.hrvStatus,
          restingHr: updatedBio.restingHr,
          recoveryHours: updatedBio.recoveryHours,
          steps: updatedBio.steps,
          vo2Max: updatedBio.vo2Max,
          note: `Live synchronisiert via Garmin Connect Python-Backend (${data.displayName || 'Tino W.'})`,
        };
        handleSaveDailyLog(newDailyLog);
      }
    } catch (err) {
      console.error('Failed to sync live Garmin data:', err);
    } finally {
      setIsSyncingGarmin(false);
    }
  };

  // Automatically sync live Garmin data on mount
  useEffect(() => {
    handleSyncGarminLive();
  }, []);

  const handleDisconnectGarmin = () => {
    setGarminConnected(false);
    localStorage.setItem('garmin_connected', 'false');
  };

  // Plan Session Update
  const handleUpdatePlanSession = (week: 'A' | 'B', index: number, field: keyof PlanSession, value: any) => {
    setPlans((prev) => {
      const updatedWeek = [...prev[week]];
      updatedWeek[index] = {
        ...updatedWeek[index],
        [field]: value,
      };
      const newPlans = {
        ...prev,
        [week]: updatedWeek,
      };
      localStorage.setItem('triathlon_plans', JSON.stringify(newPlans));
      return newPlans;
    });
  };

  const handleResetPlan = () => {
    if (window.confirm('Möchtest du den Trainingsplan auf den Standardplan zurücksetzen?')) {
      setPlans(defaultPlans);
      localStorage.setItem('triathlon_plans', JSON.stringify(defaultPlans));
    }
  };

  const handleSaveProfile = (updated: AthleteProfile) => {
    setAthlete(updated);
    localStorage.setItem('triathlon_athlete_profile', JSON.stringify(updated));
  };

  // AI Triggers
  const handleTriggerAiEvaluation = (week: 'A' | 'B') => {
    setCurrentWeek(week);
    setActiveTab('coach');
  };

  const handleTriggerAiVariation = (week: 'A' | 'B') => {
    setCurrentWeek(week);
    setActiveTab('coach');
  };

  const handleAnalyzeActivityWithAi = (_act: SportActivity) => {
    setActiveTab('coach');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header */}
      <Header
        athlete={athlete}
        garmin={garmin}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAddActivity={() => {
          setActivityToEdit(null);
          setIsActivityModalOpen(true);
        }}
        garminConnected={garminConnected}
        activitiesCount={activities.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Import Notification Banner */}
        {importNotification && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-950/80 border border-emerald-600/70 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{importNotification}</span>
            </div>
            <button
              onClick={() => setImportNotification(null)}
              className="text-xs px-2 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 font-semibold cursor-pointer"
            >
              Schließen
            </button>
          </div>
        )}

        {/* Vital-Dashboard: Schnelle Fitness-Einschätzung mit Garmin Daten */}
        <VitalDashboard
          garmin={garmin}
          onOpenGarminTab={() => setActiveTab('garmin')}
          onQuickEditGarmin={() => {
            setActiveTab('garmin');
          }}
          onSyncGarminLive={handleSyncGarminLive}
          isSyncingGarmin={isSyncingGarmin}
        />

        {/* Tab 1: Trainingsplan */}
        {activeTab === 'plan' && (
          <TrainingPlanView
            plans={plans}
            currentWeek={currentWeek}
            setCurrentWeek={setCurrentWeek}
            onUpdatePlanSession={handleUpdatePlanSession}
            onResetPlan={handleResetPlan}
            onTriggerAiEvaluation={handleTriggerAiEvaluation}
            onTriggerAiVariation={handleTriggerAiVariation}
          />
        )}

        {/* Tab 2: Eigene Aktivitäten erfassen & verwalten */}
        {activeTab === 'activities' && (
          <ActivitiesManagementView
            activities={activities}
            onOpenAddModal={() => {
              setActivityToEdit(null);
              setIsActivityModalOpen(true);
            }}
            onOpenStravaImport={() => setIsStravaImportModalOpen(true)}
            onCleanDuplicates={handleCleanDuplicates}
            onEditActivity={handleEditActivity}
            onDeleteActivity={handleDeleteActivity}
            onClearSampleData={handleClearSampleData}
            onAnalyzeWithAi={handleAnalyzeActivityWithAi}
          />
        )}

        {/* Tab 3: Garmin Connect & Vitaldaten */}
        {activeTab === 'garmin' && (
          <GarminHubView
            garmin={garmin}
            garminConnected={garminConnected}
            onConnectGarmin={handleConnectGarmin}
            onDisconnectGarmin={handleDisconnectGarmin}
            onUpdateGarminBiometrics={handleUpdateGarminBiometrics}
            onFileUploadActivity={handleSaveActivity}
            dailyLogs={garminDailyLogs}
            onSaveDailyLog={handleSaveDailyLog}
            onDeleteDailyLog={handleDeleteDailyLog}
          />
        )}

        {/* Tab 4: Sport-Analyse & PMC */}
        {activeTab === 'analytics' && (
          <SportAnalyticsView
            activities={activities}
            pmcData={pmcData}
            athlete={athlete}
            garmin={garmin}
            onAnalyzeActivityWithAi={handleAnalyzeActivityWithAi}
            onOpenStravaImport={() => setIsStravaImportModalOpen(true)}
          />
        )}

        {/* Tab 5: Zell am See Strecken-Radar */}
        {activeTab === 'race' && <ZellAmSeeRadar athlete={athlete} />}

        {/* Tab 6: KI-Coach */}
        {activeTab === 'coach' && (
          <AiCoachPanel
            athlete={athlete}
            plans={plans}
            currentWeek={currentWeek}
            garmin={garmin}
            activities={activities}
            presetAnalysisResult={coachPresetResult}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Trainings App TRiatzhlon • Zell am See-Kaprun Vorbereitung 2027</span>
          <div className="flex items-center gap-3">
            <span>Garmin als Datenbasis</span>
            <span>•</span>
            <span>Rad: 360W FTP (Marin Stelvio)</span>
            <span>•</span>
            <span>5k: 22:31</span>
            <span>•</span>
            <span>Cadence: 175 SPM</span>
          </div>
        </div>
      </footer>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        athlete={athlete}
        onSaveProfile={handleSaveProfile}
      />

      {/* Manual Activity Add / Edit Modal */}
      <ManualActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setActivityToEdit(null);
        }}
        onSaveActivity={handleSaveActivity}
        athlete={athlete}
        initialActivity={activityToEdit}
      />

      {/* Strava Import & Deduplication Modal */}
      <StravaImportModal
        isOpen={isStravaImportModalOpen}
        onClose={() => setIsStravaImportModalOpen(false)}
        existingActivities={activities}
        onImportActivities={handleImportStravaActivities}
      />
    </div>
  );
}
