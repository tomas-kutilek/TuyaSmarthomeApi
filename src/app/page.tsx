"use client";

import React, { useEffect, useState } from "react";

interface Device {
  id: string;
  name: string;
  temperature: number | null;
  humidity: number | null;
  online: boolean;
}

export default function Home() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [timeStr, setTimeStr] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");

  // Aktualizace hodin a data
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("cs-CZ", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      const formattedDate = now.toLocaleDateString("cs-CZ", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      setDateStr(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Načítání a striktní filtrování zařízení (pouze Obývák, Venku, Dílna)
  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices", { cache: "no-store" });
      if (res.ok) {
        const data: Device[] = await res.json();
        if (Array.isArray(data)) {
          const filtered = data.filter((dev) => {
            const nameLower = (dev.name || "").toLowerCase();
            
            if (
              nameLower.includes("tv") ||
              nameLower.includes("vrata") ||
              nameLower.includes("audio") ||
              nameLower.includes("gateway")
            ) {
              return false;
            }

            return (
              nameLower.includes("obý") ||
              nameLower.includes("obyv") ||
              nameLower.includes("venk") ||
              nameLower.includes("díl") ||
              nameLower.includes("diln")
            );
          });

          const sorted = filtered.sort((a, b) => {
            const getOrder = (name: string) => {
              const n = name.toLowerCase();
              if (n.includes("obý") || n.includes("obyv")) return 1;
              if (n.includes("venk")) return 2;
              if (n.includes("díl") || n.includes("diln")) return 3;
              return 4;
            };
            return getOrder(a.name) - getOrder(b.name);
          });

          setDevices(sorted);
        }
      }
    } catch (err) {
      console.error("Chyba při načítání zařízení:", err);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  // Formátování teploty (dělení 10 u celých čísel + čárka)
  const formatTemperature = (rawTemp: number | null) => {
    if (rawTemp === null || rawTemp === undefined) return "--,-";

    let temp = rawTemp;
    if (Math.abs(temp) > 80 && Number.isInteger(temp)) {
      temp = temp / 10;
    }

    return temp.toFixed(1).replace(".", ",");
  };

  // Barva teploty (Modrá < 0 °C, Červená > 30 °C, Bílá jinak)
  const getTemperatureColor = (rawTemp: number | null) => {
    if (rawTemp === null || rawTemp === undefined) return "#ffffff";

    let temp = rawTemp;
    if (Math.abs(temp) > 80 && Number.isInteger(temp)) {
      temp = temp / 10;
    }

    if (temp < 0) return "#3b82f6";
    if (temp > 30) return "#ef4444";
    return "#ffffff";
  };

  // Spuštění Hlasového Asistenta
  const handleAssistantClick = () => {
    if (
      typeof window !== "undefined" &&
      (window as unknown as { fully?: { startApplication: (app: string) => void } }).fully
    ) {
      (window as unknown as { fully: { startApplication: (app: string) => void } }).fully.startApplication(
        "com.google.android.googlequicksearchbox"
      );
    } else {
      alert("Spouštím hlasového asistenta...");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#000000",
        color: "#ffffff",
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "16px 24px",
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* Horní lišta: Čas, Datum A TLAČÍTKO ASISTENTA na jednom řádku */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #262626",
          paddingBottom: "10px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "20px" }}>
          <h1 style={{ fontSize: "52px", fontWeight: "900", margin: 0, lineHeight: 1 }}>
            {timeStr || "00:00"}
          </h1>
          <p style={{ fontSize: "22px", fontWeight: "600", color: "#a3a3a3", margin: 0 }}>
            {dateStr}
          </p>
        </div>

        {/* Tlačítko asistenta vpravo nahoře */}
        <button
          onClick={handleAssistantClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#262626",
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "16px",
            padding: "8px 20px",
            borderRadius: "9999px",
            border: "1px solid #404040",
            cursor: "pointer",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
          }}
        >
          <span style={{ fontSize: "18px" }}>🎤</span>
          <span>Asistent</span>
        </button>
      </header>

      {/* Prostřední část: 3 velké dlaždice vedle sebe */}
      <section
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: "20px",
          height: "75vh",
          margin: "auto 0",
          alignItems: "stretch",
        }}
      >
        {devices.map((dev) => (
          <div
            key={dev.id}
            style={{
              flex: "1 1 0px",
              backgroundColor: "#171717",
              border: "2px solid #262626",
              borderRadius: "24px",
              padding: "20px",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              textAlign: "center",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Online zelená tečka */}
            <div style={{ position: "absolute", top: "18px", right: "18px" }}>
              <span
                style={{
                  display: "block",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  backgroundColor: dev.online ? "#22c55e" : "#ef4444",
                  boxShadow: dev.online ? "0 0 10px #22c55e" : "none",
                }}
              />
            </div>

            {/* Název čidla */}
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "800",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#d4d4d4",
                marginTop: "4px",
              }}
            >
              {dev.name}
            </h2>

            {/* Velká čísla teploty */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
                gap: "4px",
                margin: "auto 0",
              }}
            >
              <span
                style={{
                  fontSize: "80px",
                  fontWeight: "900",
                  letterSpacing: "-2px",
                  color: getTemperatureColor(dev.temperature),
                }}
              >
                {formatTemperature(dev.temperature)}
              </span>
              <span style={{ fontSize: "36px", fontWeight: "700", color: "#a3a3a3" }}>°C</span>
            </div>

            {/* Vlhkost */}
            <div style={{ fontSize: "20px", fontWeight: "600", color: "#a3a3a3", marginBottom: "4px" }}>
              Vlhkost: <span style={{ color: "#ffffff", fontWeight: "700" }}>{dev.humidity ?? "--"} %</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
