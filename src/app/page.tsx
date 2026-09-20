"use client";

import { useEffect, useState } from "react";

interface Device {
  id: string;
  name: string;
  temperature?: number | null;
  humidity?: number | null;
  online?: boolean;
}

export default function Home() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stavy pro hlasového asistenta
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [responseMsg, setResponseMsg] = useState("");

  // Načtení dat z Tuya API
  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices");
      if (!res.ok) throw new Error("Chyba při načítání dat");
      const data = await res.json();
      
      // Pokud API vrací přímo pole zařízení
      if (Array.isArray(data)) {
        setDevices(data);
        setError(null);
      } else if (data.success && Array.isArray(data.result)) {
        setDevices(data.result);
        setError(null);
      } else {
        setError(data.error || "Nepodařilo se načíst zařízení");
      }
    } catch (err: any) {
      setError(err.message || "Chyba připojení k serveru");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000); // Obnovit každých 10s
    return () => clearInterval(interval);
  }, []);

  // Ovládání hlasového asistenta
  const handleAssistantClick = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Váš prohlížeč nepodporuje rozpoznání řeči.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "cs-CZ";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
      setResponseMsg("");
    };

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setListening(false);

      try {
        const res = await fetch("/api/command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: text }),
        });

        const data = await res.json();
        if (data.success) {
          setResponseMsg(data.message);
          fetchDevices();
        } else {
          setResponseMsg("Chyba: " + (data.error || "Neznámá chyby"));
        }
      } catch (err) {
        setResponseMsg("Chyba připojení k serveru.");
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.start();
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Hlavička & Hlasový asistent */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div>
            <h1 className="text-3xl font-bold">Tuya Smart Home</h1>
            <p className="text-slate-400 text-sm mt-1">Nástěnný ovládací panel</p>
          </div>

          <button
            onClick={handleAssistantClick}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              listening
                ? "bg-red-500 animate-pulse text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
            }`}
          >
            🎤 {listening ? "Poslouchám..." : "Hlasový příkaz"}
          </button>
        </div>

        {/* Výstup hlasového asistenta */}
        {(transcript || responseMsg) && (
          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl space-y-1">
            {transcript && <p className="text-slate-300"><strong>Příkaz:</strong> {transcript}</p>}
            {responseMsg && <p className="text-emerald-400 font-medium">{responseMsg}</p>}
          </div>
        )}

        {/* Dlaždice čidel a zařízení */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-slate-300">Připojená zařízení</h2>

          {loading && <p className="text-slate-400">Načítání čidel...</p>}
          {error && <p className="text-red-400">Chyba: {error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="bg-slate-800 p-5 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all shadow-md"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-slate-100">{device.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${device.online ? "bg-emerald-900/60 text-emerald-400 border border-emerald-500/30" : "bg-rose-900/60 text-rose-400 border border-rose-500/30"}`}>
                    {device.online ? "Online" : "Offline"}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm pt-2 border-t border-slate-700/50">
                  {device.temperature !== undefined && device.temperature !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Teplota:</span>
                      <span className="font-semibold text-amber-400 text-base">
                        {(device.temperature / 10).toFixed(1)} °C
                      </span>
                    </div>
                  )}

                  {device.humidity !== undefined && device.humidity !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Vlhkost:</span>
                      <span className="font-semibold text-cyan-400 text-base">
                        {device.humidity} %
                      </span>
                    </div>
                  )}

                  {device.temperature === null && device.humidity === null && (
                    <p className="text-slate-500 italic text-xs">Bez naměřených hodnot</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
