import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Strava OAuth & Garmin Endpoints
app.get('/api/auth/strava/url', (req: Request, res: Response) => {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const redirectUri = `${appUrl}/auth/callback`;

  if (!clientId) {
    // Return simulator/direct URL for easy testing
    res.json({
      url: `${appUrl}/auth/callback?provider=strava&mode=simulated&status=success`,
      isSimulated: true,
      message: 'Demo-Modus aktiv: Verbindung wird direkt simuliert oder Client ID in .env eintragen.',
    });
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all,profile:read_all',
  });

  res.json({
    url: `https://www.strava.com/oauth/authorize?${params.toString()}`,
    isSimulated: false,
  });
});

app.get('/api/auth/garmin/url', (req: Request, res: Response) => {
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  // Garmin Connect OAuth 1.0a / Health API endpoint or demo connector
  res.json({
    url: `${appUrl}/auth/callback?provider=garmin&mode=simulated&status=success`,
    isSimulated: true,
    message: 'Garmin Connect Direct Sync bereit',
  });
});

// Python Garmin Connect backend integration endpoint
app.post('/api/garmin/python-sync', (req: Request, res: Response) => {
  const {
    email = 'tino.worbs3@gmail.com',
    password = 'Garmin2026',
    isDemo = false,
    date: targetDate,
    tokens,
    mfaCode,
  } = req.body;

  const scriptPath = path.join(__dirname, 'garmin_backend.py');
  const args = isDemo ? ['--demo'] : [];
  if (email) {
    args.push('--email', email);
  }
  if (password) {
    args.push('--password', password);
  }
  if (targetDate) {
    args.push('--date', targetDate);
  }
  if (tokens) {
    args.push('--tokens', typeof tokens === 'string' ? tokens : JSON.stringify(tokens));
  }
  if (mfaCode) {
    args.push('--mfa-code', mfaCode.toString().trim());
  }

  const pyProcess = spawn('python3', [scriptPath, ...args]);

  let stdoutData = '';
  let stderrData = '';

  // Pipe credentials and params via stdin safely as well
  const payload = JSON.stringify({
    email: email || 'tino.worbs3@gmail.com',
    password: password || 'Garmin2026',
    tokens: tokens || undefined,
    mfaCode: mfaCode || undefined,
    isDemo: Boolean(isDemo),
    date: targetDate,
  });
  pyProcess.stdin.write(payload);
  pyProcess.stdin.end();

  pyProcess.stdout.on('data', (chunk) => {
    stdoutData += chunk.toString();
  });

  pyProcess.stderr.on('data', (chunk) => {
    stderrData += chunk.toString();
  });

  pyProcess.on('close', (code) => {
    if (code !== 0 && !stdoutData.trim()) {
      console.error(`garmin_backend.py exited with code ${code}:`, stderrData);
      res.status(500).json({
        success: false,
        error: stderrData || `Python-Prozess beendet mit Fehlercode ${code}`,
      });
      return;
    }

    try {
      // Find JSON start and end in case of stray stdout logs
      const startIdx = stdoutData.indexOf('{');
      const endIdx = stdoutData.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const jsonStr = stdoutData.slice(startIdx, endIdx + 1);
        const parsed = JSON.parse(jsonStr);
        res.json(parsed);
        return;
      }
      const parsed = JSON.parse(stdoutData.trim());
      res.json(parsed);
    } catch (parseErr) {
      console.error('Failed to parse Python output:', stdoutData, parseErr);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Parsen der Python-Garmin-Antwort',
        raw: stdoutData,
      });
    }
  });
});

// OAuth Callback Handler (Popup friendly with postMessage)
const callbackHandler = (req: Request, res: Response) => {
  const { provider = 'strava', code = 'demo_code_123', mode = 'real' } = req.query;

  res.send(`
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="utf-8" />
        <title>Authentifizierung erfolgreich</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #090d16;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .card {
            background: #1e293b;
            padding: 30px;
            border-radius: 12px;
            border: 1px solid #334155;
            max-width: 400px;
          }
          .spinner {
            border: 3px solid #334155;
            border-top: 3px solid #38bdf8;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            animation: spin 1s linear infinite;
            margin: 16px auto;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="card">
          <h2 style="color: #38bdf8; margin: 0 0 10px 0;">Verbindung autorisiert!</h2>
          <p style="font-size: 14px; color: #94a3b8;">${provider.toString().toUpperCase()} Daten werden synchronisiert...</p>
          <div class="spinner"></div>
          <p style="font-size: 12px; color: #64748b;">Dieses Fenster schließt sich automatisch.</p>
        </div>
        <script>
          const payload = {
            type: 'OAUTH_AUTH_SUCCESS',
            provider: '${provider}',
            code: '${code}',
            mode: '${mode}'
          };
          if (window.opener) {
            window.opener.postMessage(payload, '*');
            setTimeout(() => window.close(), 700);
          } else {
            setTimeout(() => { window.location.href = '/'; }, 1000);
          }
        </script>
      </body>
    </html>
  `);
};

app.get(['/auth/callback', '/auth/callback/'], callbackHandler);

// AI Coach Analysis endpoint using server-side Gemini 3.8 Flash
app.post('/api/coach/analyze', async (req: Request, res: Response) => {
  try {
    const { mode, athleteProfile, currentWeek, plan, recentActivities, garminMetrics, userPrompt } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback response if GEMINI_API_KEY is not yet present
      res.json({
        success: true,
        source: 'local_fallback',
        analysis: generateFallbackAnalysis(mode, currentWeek, plan, athleteProfile, garminMetrics),
      });
      return;
    }

    const systemInstruction = `Du bist ein hochkarätiger Triathlon-Headcoach mit Spezialisierung auf die Mitteldistanz Ironman 70.3 Zell am See-Kaprun.
Dein Athlet bereitet sich gezielt vor. Du kennst die Besonderheiten des Rennens:
- Schwimmen: 1,9 km im klaren Zeller See (fliegender Rolling-Start, Wassertemperatur oft 18-23°C, Neopren meist erlaubt).
- Radfahren: 90 km mit 1.288 Höhenmetern. Schlüsselstelle: der Filzensattel bei Dienten am Hochkönig (bis zu 14% Steigung, lange Abfahrt mit Tempo > 70 km/h, dann flacher Hochgeschwindigkeits-Abschnitt Richtung Zell am See).
- Laufen: 21,1 km Halbmarathon in 2 bzw. 3 Runden am Seeufer entlang (flach, oft warm, Schotter- und Asphaltpassagen, Fokus auf Frequenz und Kühlung).

Du sprichst auf Deutsch, motivierend, präzise und sportwissenschaftlich fundiert (nutze Begriffe wie FTP, rFTP, TSS, CTL/ATL/TSB, Swolf, Laktatschwelle, Pacing, Pw:HR Entkopplung).
Gib klare, strukturierte Abschnitte mit Überschriften und Bullet-Points.`;

    let prompt = '';

    if (mode === 'evaluate_plan') {
      prompt = `Analysiere den Trainingsplan für Woche ${currentWeek}.
Athleten-Profil:
- Rad-FTP: ${athleteProfile?.bikeFtp || 360}W (Rad: Marin Stelvio)
- Laufen: 5km Bestzeit ${athleteProfile?.run5kTime || '22:31'} min (~${athleteProfile?.runFtp || 380}W rFTP, Cadence Ziel ~175 SPM)
- Schwimmen: Swolf ~${athleteProfile?.swolf || 38} (Basis 2.000m - 2.500m)
- Feste Verpflichtungen: Freitagabend Pfadfinder, unter der Woche Schule/Arbeit

Garmin Erholungs-Status:
- Schlaf: ${garminMetrics?.sleepScore || 85}/100 (${garminMetrics?.sleepHours || '7.5'} Std)
- Body Battery: ${garminMetrics?.bodyBattery || 82}%
- HRV-Status: ${garminMetrics?.hrvStatus || 'Ausgeglichen'} (${garminMetrics?.hrvValue || 64} ms)
- Erholungszeit: ${garminMetrics?.recoveryHours || 14} Std

Aktueller Plan Woche ${currentWeek}:
${JSON.stringify(plan, null, 2)}

Bitte beurteile:
1. Trainingsreize & Periodisierung (Verhältnis Schwellen- vs. Grundlagenreize / 80:20 Prinzip)
2. Ironman 70.3 Zell am See Relevanz (Filzensattel-Simulation, Koppel-Einheiten, Wettkampfernährung)
3. Überlastungsrisiko & Regeneration (unter Berücksichtigung von Pfadfindern und Schule)
4. 3 konkrete Anpassungs-Empfehlungen für die Woche`;
    } else if (mode === 'activity_deep_dive') {
      prompt = `Mache einen detaillierten Post-Workout Debriefing-Check für folgende Aktivität:
${JSON.stringify(recentActivities?.[0] || {}, null, 2)}

Athlet: Rad-FTP ${athleteProfile?.bikeFtp || 360}W, Lauf-rFTP ${athleteProfile?.runFtp || 380}W.
Beurteile Intensitätsfaktor (IF), berechneten TSS, Trittfrequenz/Schrittfrequenz, aerobe Effizienz und wie sich diese Einheit auf die Vorbereitung für Zell am See auswirkt.`;
    } else if (mode === 'suggest_variation') {
      prompt = `Schlage eine kreative, hochwirksame Optimierung oder Variation für Woche ${currentWeek} vor.
Aktueller Plan:
${JSON.stringify(plan, null, 2)}
Berücksichtige die Garmin-Werte (Body Battery: ${garminMetrics?.bodyBattery}%, Schlaf: ${garminMetrics?.sleepScore}/100) und sorge für maximale Rennspezifik für Zell am See.`;
    } else {
      prompt = userPrompt || `Gib ein allgemeines Coaching-Feedback für den Ironman 70.3 Zell am See Trainingszustand.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const analysisText = response.text || 'Keine Antwort erhalten.';

    res.json({
      success: true,
      source: 'gemini-3.8-flash',
      analysis: analysisText,
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Fehler bei der KI-Analyse',
      fallback: 'Konnte die Analyse nicht durchführen. Bitte versuche es erneut.',
    });
  }
});

// Helper for local fallback if API key is in setup
function generateFallbackAnalysis(
  mode: string,
  currentWeek: string,
  plan: any[],
  athleteProfile: any,
  garminMetrics: any
) {
  const ftp = athleteProfile?.bikeFtp || 360;
  const runTime = athleteProfile?.run5kTime || '22:31';
  const bb = garminMetrics?.bodyBattery || 82;
  const hrv = garminMetrics?.hrvStatus || 'Ausgeglichen';

  return `### 🏆 Ironman 70.3 Zell am See Coach-Report (Woche ${currentWeek})

**1. Athleten-Status & Erholung:**
- **Aktuelle physiologische Bereitschaft:** Body Battery steht bei soliden **${bb}%** mit **${hrv}em HRV-Status**. Deine Regenerationsbasis ist für harte Schwellenblöcke freigegeben.
- **Leistungswerte:** Rad-FTP ${ftp}W und 5k-Bestzeit von ${runTime} min zeigen ein erstklassiges aerobes Fundament für die Nachwuchs-Altersklasse.

**2. Bewertung des Plans (Woche ${currentWeek}):**
- **Stärken:** Die Koppel-Einheit am Samstag ist der absolute Dreh- und Angelpunkt für Zell am See. Das Laufen nach 90 km Vorbelastung muss genau in diesem Ermüdungszustand trainiert werden.
- **Rennspezifik Zell am See:** Achte auf der Freitags- und Samstagsausfahrt auf "Filzensattel-Simulationen": 12–15 min K3-Intervalle (dicke Übersetzung, 60–68 U/min bei 85–92% FTP), um die Bergauf-Kraftausdauer für Dienten zu schärfen.
- **Belastungsmanagement:** Die Pfadfinder-Aktivität am Freitagabend erfordert eine smarte Ernährungsstrategie (Kohlenhydrat-Speicher direkt nach dem Radtraining füllen!), damit der lange Samstag nicht in den Hungerast führt.

**3. Konkrete Coach-Tipps:**
1. **Pacing am Berg:** Bei 360W FTP nicht über 390W in die 14%-Rampen des Filzensattels hineinstechen – das spart Laktat für den Halbmarathon.
2. **Trittfrequenz:** Halte deine gewohnte Laufkadenz von ~175 SPM auch auf den letzten 5 Kilometern des Koppellaufs stabil.
3. **Schwimm-Ökonomie:** Fokussiere dienstags auf Wassergefühl und Gleitphase (Swolf < 37) statt reines Auspowern.`;
}

// Start dev or production server
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Triathlon Hub Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
