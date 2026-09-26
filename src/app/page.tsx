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

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices", { cache: "no-store" });
      if (!res.ok) throw new Error(`Chyba serveru (${res.status})`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setDevices(data);
        setError(null);
      } else if (data.success && Array.isArray(data.result) && data.result.length > 0) {
        setDevices(data.result);
        setError(null);
      } else {
        const detailErr = data.error || data.msg || "Tuya API nevrátila žádná zařízení";
        setError(detailErr);
      }
    } catch (err: any) {
      setError(err?.message || "Chyba při komunikaci s backendem");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAssistantClick = async () => {
    if (typeof window === "undefined") return;

    // Vyžádání přístupu k mikrofonu
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      alert("Aplikace nemá přístup k mikrofonu. Povolte jej v nastavení prohlížeče.");
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
      alert("Chyba spuštění: " + (e?.message || e));
    }
  };

  const targetNames = ["teploměr dílna", "teploměr obývák", "teplota venku"];
  const filteredDevices = devices.filter((dev) =>
    targetNames.some((name) => dev.name.toLowerCase().includes(name))
  );

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
        <p style={{ textAlign: "center", color: "#94a3b8" }}>Načítání dat z Tuya API...</p>
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
          ⚠️ <strong>Stav API:</strong> {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          flex: 1,
        }}
      >
        {filteredDevices.map((device) => {
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
                <h2 style={{ margin: 0, fontSize: "22px", color: "#e2e8f0" }}>
                  {device.name}
                </h2>
                <span
                  style={{
                    fontSize: "12px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    backgroundColor: device.online ? "#064e3b" : "#7f1d1d",
                    color: device.online ? "#34d399" : "#f87171",
                  }}
                >
                  {device.online ? "Online" : "Offline"}
                </span>
              </div>

              <div style={{ margin: "auto 0" }}>
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
