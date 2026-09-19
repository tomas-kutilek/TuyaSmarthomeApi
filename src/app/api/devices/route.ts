import { NextResponse } from "next/server";

export async function GET() {
  try {
    const clientId = process.env.TUYA_CLIENT_ID;
    const clientSecret = process.env.TUYA_CLIENT_SECRET;
    const endpoint = process.env.TUYA_ENDPOINT || "https://openapi.tuyaeu.com";
    const userId = process.env.TUYA_USER_ID;

    // Pokus o načtení živých dat z Tuya API
    if (clientId && clientSecret && userId) {
      // 1. Získání tokenu
      const tokenRes = await fetch(`${endpoint}/v1.0/token?grant_type=1`, {
        headers: {
          client_id: clientId,
          sign_method: "HMAC-SHA256",
        },
        cache: "no-store",
      });

      const tokenData = await tokenRes.json();

      if (tokenData.success && tokenData.result?.access_token) {
        // 2. Získání zařízení
        const devicesRes = await fetch(`${endpoint}/v1.0/users/${userId}/devices`, {
          headers: {
            client_id: clientId,
            access_token: tokenData.result.access_token,
            sign_method: "HMAC-SHA256",
          },
          cache: "no-store",
        });

        const devicesData = await devicesRes.json();

        if (devicesData.success && Array.isArray(devicesData.result) && devicesData.result.length > 0) {
          const formattedDevices = devicesData.result.map((dev: any) => {
            let temp = null;
            let hum = null;

            if (Array.isArray(dev.status)) {
              const tempStatus = dev.status.find(
                (s: any) => s.code === "temp_current" || s.code === "va_temperature" || s.code === "temp"
              );
              const humStatus = dev.status.find(
                (s: any) => s.code === "humidity_current" || s.code === "va_humidity" || s.code === "humidity"
              );

              if (tempStatus !== undefined) temp = tempStatus.value;
              if (humStatus !== undefined) hum = humStatus.value;
            }

            return {
              id: dev.id,
              name: dev.name || "Senzor",
              temperature: temp,
              humidity: hum,
              online: dev.online ?? true,
            };
          });

          return NextResponse.json(formattedDevices);
        }
      }
    }

    // ZÁLOŽNÍ DATA (Fallback) – pokud Tuya API ještě nemá platné proměnné/klíče
    return NextResponse.json([
      { id: "1", name: "OBÝVÁK", temperature: 226, humidity: 62, online: true },
      { id: "2", name: "VENKU", temperature: 100, humidity: 55, online: true },
      { id: "3", name: "DÍLNA", temperature: 219, humidity: 49, online: true },
    ]);
  } catch (error) {
    console.error("Chyba na API:", error);
    // V případě chyby vrátí záložní senzory
    return NextResponse.json([
      { id: "1", name: "OBÝVÁK", temperature: 226, humidity: 62, online: true },
      { id: "2", name: "VENKU", temperature: 100, humidity: 55, online: true },
      { id: "3", name: "DÍLNA", temperature: 219, humidity: 49, online: true },
    ]);
  }
}
