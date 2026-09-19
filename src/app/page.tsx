"use client";

import { useEffect, useState } from "react";

interface DeviceData {
  id: string;
  name: string;
  temperature: number | null;
  humidity: number | null;
  online: boolean;
}

export default function Home() {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("cs-CZ", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      setDate(
        now.toLocaleDateString("cs-CZ", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDevices(data);
        }
      }
    } catch (error) {
      console.error("Chyba při načítání senzorů:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  const getParsedTemp = (val: any): number | null => {
    if (val === null || val === undefined) return null;
    const num = Number(val);
    if (isNaN(num)) return null;
    if (Math.abs(num) > 60) {
      return num / 10;
    }
    return num;
  };

  const formatTemp = (val: any): string => {
    const parsed = getParsedTemp(val);
    if (parsed === null) return "--.-";
    return parsed.toFixed(1);
  };

  // Vrací přímo barvu textu
  const getTempColor = (val: any): string => {
    const parsed = getParsedTemp(val);
    if (parsed === null) return "#ffffff";

    if (parsed <= 0) {
      return "#3b82f6"; // Modrá pro mráz a 0 °C
    }
    if (parsed > 30) {
      return "#ef4444"; // Červená pro teploty nad 30 °C
    }
    return "#ffffff"; // Bílá pro běžné teploty
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#000000",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
        userSelect: "none",
        boxSizing: "border-box",
      }}
    >
      {/* Čas a datum */}
      <div style={{ textAlign: "center", margin: "8px 0" }}>
        <h1 style={{ fontSize: "56px", fontWeight: "800", margin: "0" }}>
          {time || "00:00"}
        </h1>
        <p style={{ fontSize: "18px", color: "#9ca3af", margin: "4px 0 0 0", textTransform: "capitalize" }}>
          {date}
        </p>
      </div>

      {/* Mřížka se senzory */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          maxWidth: "1100px",
          width: "100%",
          margin: "auto",
        }}
      >
        {loading && devices.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "#6b7280", padding: "40px" }}>
            Načítání dat ze senzorů...
          </div>
        ) : (
          devices.map((device, index) => {
            const formattedTemp = formatTemp(device.temperature);
            const tempColor = getTempColor(device.temperature);

            return (
              <div
                key={device.id || index}
                style={{
                  backgroundColor: "#171717",
                  border: "1px solid #262626",
                  borderRadius: "16px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                }}
              >
                {/* Zelená / Červená kontrolka stavu */}
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: device.online ? "#22c55e" : "#ef4444",
                    boxShadow: device.online ? "0 0 8px #22c55e" : "none",
                  }}
                  title={device.online ? "Online" : "Offline"}
                />

                {/* Název senzoru */}
                <h2
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    margin: "0 0 16px 0",
                  }}
                >
                  {device.name}
                </h2>

                {/* Teplota */}
                <div style={{ margin: "8px 0", textAlign: "center" }}>
                  <span
                    style={{
                      fontSize: "56px",
                      fontWeight: "700",
                      color: tempColor,
                      letterSpacing: "-1px",
                    }}
                  >
                    {formattedTemp}
                  </span>
                  <span style={{ fontSize: "28px", fontWeight: "500", color: tempColor, marginLeft: "4px" }}>
                    °C
                  </span>
                </div>

                {/* Vlhkost */}
                <div style={{ marginTop: "16px", color: "#9ca3af", fontSize: "14px", fontWeight: "500" }}>
                  Vlhkost:{" "}
                  <span style={{ color: "#e5e7eb", fontWeight: "600" }}>
                    {device.humidity !== null && device.humidity !== undefined ? `${device.humidity} %` : "-- %"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
