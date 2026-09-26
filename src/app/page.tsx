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

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [responseMsg, setResponseMsg] = useState("");

  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");

  // Hodiny a datum v reálném čase
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("cs-CZ", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setDate(
        now.toLocaleDateString("cs-CZ", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Automatické stahování živých dat z backendu
  const fetchDevices = async () => {
    try {
      // Vynucení stažení aktuálních dat přidáním razítka ?t=... (obchází cache prohlížeče)
      const res = await fetch(`/api/devices?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          Pragma: "no-cache",
          "Cache-Control": "no-cache",
        },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || `Chyba serveru (${res.status})`);
      }

      let devList: Device[] = [];
      if (Array.isArray(data)) {
        devList = data;
      } else if (data.success && Array.isArray(data.result)) {
        devList = data.result;
      } else if (Array.isArray(data.result)) {
        devList = data.result;
      }

      if (devList.length > 0) {
        setDevices(devList);
        setError(null);
      } else {
        setError(data.error || data.msg || "Tuya API nevrátila žádná zařízení.");
      }
    } catch (err: any) {
      setError(err?.message || "Chyba připojení k backendu");
    } finally {
      setLoading(false);
    }
  };

  // Načíst při spuštění a pak automaticky každých 10 sekund
  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAssistantClick = async () => {
    if (typeof window === "undefined") return;

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      alert("Povolte prosím přístup k mikrofonu v nastavení prohlížeče.");
      return;
    }

    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Tento prohlížeč nepodporuje rozpoznávání hlasu.");
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
        } catch (e) {
          setResponseMsg("Chyba při odesílání na server.");
        }
      };

      recognition.onerror = (event: any) => {
        setListening(false);
        setResponseMsg("Chyba mikrofonu: " + (event.error || "Neznámá chyba"));
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch (e: any) {
      setListening(false);
      alert("Chyba spuštění mikrofonu: " + (e?.message || e));
    }
  };

  // Vyčištění názvu od chybových systémových zpráv z Tuya cloudu
  const cleanDeviceName = (name: string) => {
    return name
      .replace(/\(.*\)/g, "")
      .replace(/IoT Core.*/gi, "")
      .trim();
  };

  const targetKeywords = ["obývák", "obyvak", "venku", "dílna", "dilna"];
  const matchedDevices = devices.filter((dev) =>
    targetKeywords.some((key) => dev.name.toLowerCase().includes(key))
  );

  const displayDevices = matchedDevices.length > 0 ? matchedDevices : devices;

  return (
    <main
      style={{
        padding: "24px",
        fontFamily: "sans-serif",
        backgroundColor: "#0f172a",
        color: "#ffffff",
        minHeight: "100vh",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Horní lišta: Čas + Hlasový asistent */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#1e293b",
          padding: "16px 24px",
          borderRadius: "16px",
          marginBottom: "20px",
          border: "1px solid #334155",
        }}
      >
        <div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#f8fafc" }}>
            {time || "--:--:--"}
          </div>
          <div style={{ fontSize: "14px", color: "#94a3b8", textTransform: "capitalize" }}>
            {date || "Načítání data..."}
          </div>
        </div>

        <button
          onClick={handleAssistantClick}
          style={{
            padding: "14px 28px",
            fontSize: "18px",
            fontWeight: "bold",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            backgroundColor: listening ? "#ef4444" : "#2563eb",
            color: "#ffffff",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🎤 {listening ? "Poslouchám..." : "Hlasový příkaz"}
        </button>
      </div>

      {/* Stav hlasového příkazu */}
      {(transcript || responseMsg) && (
        <div
          style={{
            backgroundColor: "#1e293b",
            padding: "12px 20px",
            borderRadius: "12px",
            marginBottom: "20px",
            borderLeft: "4px solid #2563eb",
          }}
        >
          {transcript && (
            <p style={{ margin: "0 0 4px 0", fontSize: "14px" }}>
              <strong>Příkaz:</strong> {transcript}
            </p>
          )}
          {responseMsg && (
            <p style={{ margin: 0, color: "#34d399", fontWeight: "bold", fontSize: "14px" }}>
              {responseMsg}
            </p>
          )}
        </div>
      )}

      {loading && devices.length === 0 && (
        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "18px" }}>
          Načítání dat z Tuya API...
        </p>
      )}

      {error && (
        <div
          style={{
            backgroundColor: "#7f1d1d",
            color: "#fca5a5",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "20px",
            textAlign: "center",
            border: "1px solid #ef4444",
          }}
        >
          ⚠️ <strong>Detail chyby:</strong> {error}
        </div>
      )}

      {/* Mřížka s teploměry */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            displayDevices.length > 0 ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr",
          gap: "20px",
          flex: 1,
        }}
      >
        {displayDevices.map((device) => {
          const numericTemp =
            device.temperature !== undefined && device.temperature !== null
              ? device.temperature / 10
              : null;

          const formattedTemp =
            numericTemp !== null ? numericTemp.toFixed(1) : null;

          let tempColor = "#ffffff";
          if (numericTemp !== null) {
            if (numericTemp > 30) {
              tempColor = "#ef4444";
            } else if (numericTemp < 0) {
              tempColor = "#38bdf8";
            }
          }

          const isWorking =
            device.online || (numericTemp !== null && numericTemp > -50);

          return (
            <div
              key={device.id}
              style={{
                backgroundColor: "#1e293b",
                padding: "24px",
                borderRadius: "20px",
                border: "1px solid #334155",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                textAlign: "center",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    color: "#e2e8f0",
                    textTransform: "uppercase",
                  }}
                >
                  {cleanDeviceName(device.name)}
                </h2>
                <span
                  style={{
                    fontSize: "12px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    backgroundColor: isWorking ? "#064e3b" : "#7f1d1d",
                    color: isWorking ? "#34d399" : "#f87171",
                  }}
                >
                  {isWorking ? "Online" : "Offline"}
                </span>
              </div>

              <div style={{ margin: "30px 0" }}>
                <div
                  style={{
                    fontSize: "64px",
                    fontWeight: "900",
                    color: tempColor,
                    letterSpacing: "-1px",
                  }}
                >
                  {formattedTemp !== null ? `${formattedTemp} °C` : "-- °C"}
                </div>
              </div>

              {device.humidity !== undefined && device.humidity !== null && (
                <div style={{ fontSize: "20px", color: "#94a3b8" }}>
                  Vlhkost: <strong style={{ color: "#38bdf8" }}>{device.humidity} %</strong>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
