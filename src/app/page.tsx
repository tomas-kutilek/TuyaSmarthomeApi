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
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  // Ovládání hlasového asistenta
  const handleAssistantClick = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Tento prohlížeč nebo prostředí nepodporuje rozpoznávání řeči (Web Speech API). Ujistěte se, že používáte Chrome nebo plně povolený Fully Kiosk Browser s mikrofonem.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "cs-CZ";
      recognition.interimResults = false;

      recognition.onstart = () => {
        setListening(true);
        setResponseMsg("Poslouchám...");
      };

      recognition.onresult = async (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setListening(false);
        setResponseMsg("Zpracovávám příkaz...");

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
            setResponseMsg("Chyba: " + (data.error || "Neznámá chyba"));
          }
        } catch (err) {
          setResponseMsg("Chyba při odesílání na server.");
        }
      };

      recognition.onerror = (event: any) => {
        setListening(false);
        setResponseMsg("Chyba rozpoznávání hlasu: " + (event.error || "Neznámá"));
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch (e: any) {
      setListening(false);
      alert("Nepodařilo se spustit mikrofon: " + e.message);
    }
  };

  return (
    <main style={{ padding: "20px", fontFamily: "sans-serif", backgroundColor: "#0f172a", color: "#ffffff", minHeight: "100vh" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Hlavička a Tlačítko */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "20px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px" }}>Tuya Smart Home</h1>
            <p style={{ margin: "5px 0 0 0", color: "#94a3b8", fontSize: "14px" }}>Nástěnný panel</p>
          </div>

          <button
            onClick={handleAssistantClick}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "bold",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              backgroundColor: listening ? "#ef4444" : "#2563eb",
              color: "#ffffff",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
          >
            🎤 {listening ? "Poslouchám..." : "Hlasový příkaz"}
          </button>
        </div>

        {/* Informace o hlase */}
        {(transcript || responseMsg) && (
          <div style={{ backgroundColor: "#1e293b", padding: "15px", borderRadius: "8px", marginBottom: "20px", borderLeft: "4px solid #2563eb" }}>
            {transcript && <p style={{ margin: "0 0 5px 0" }}><strong>Příkaz:</strong> {transcript}</p>}
            {responseMsg && <p style={{ margin: 0, color: "#34d399", fontWeight: "bold" }}>{responseMsg}</p>}
          </div>
        )}

        {/* Výpis zařízení */}
        <h2>Připojená zařízení</h2>
        {loading && <p>Načítání čidel...</p>}
        {error && <p style={{ color: "#f87171" }}>Chyba: {error}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "15px" }}>
          {devices.map((device) => (
            <div key={device.id} style={{ backgroundColor: "#1e293b", padding: "15px", borderRadius: "10px", border: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <strong style={{ fontSize: "16px" }}>{device.name}</strong>
                <span style={{ fontSize: "12px", color: device.online ? "#34d399" : "#f87171" }}>
                  {device.online ? "Online" : "Offline"}
                </span>
              </div>
              
              <div style={{ fontSize: "14px", color: "#cbd5e1" }}>
                {device.temperature !== undefined && device.temperature !== null && (
                  <div>Teplota: <strong style={{ color: "#fbbf24" }}>{(device.temperature / 10).toFixed(1)} °C</strong></div>
                )}
                {device.humidity !== undefined && device.humidity !== null && (
                  <div>Vlhkost: <strong style={{ color: "#38bdf8" }}>{device.humidity} %</strong></div>
                )}
                {device.temperature === null && device.humidity === null && (
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Bez naměřených hodnot</div>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
