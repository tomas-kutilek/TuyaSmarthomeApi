import { NextResponse } from "next/server";
import crypto from "crypto";

// Nastavení Next.js: Vynutit dynamické zpracování bez cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CLIENT_ID = process.env.TUYA_CLIENT_ID || "";
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET || "";
const BASE_URL = "https://openapi.tuyaeu.com"; // nebo vaše regionální URL

async function getAccessToken() {
  const method = "GET";
  const timestamp = Date.now().toString();
  const url = "/v1.0/token?grant_type=1";

  const strToSign = [CLIENT_ID, timestamp, method, "", "", url].join("\n");
  const sign = crypto
    .createHmac("sha256", CLIENT_SECRET)
    .update(strToSign)
    .digest("hex")
    .toUpperCase();

  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      client_id: CLIENT_ID,
      sign: sign,
      t: timestamp,
      sign_method: "HMAC-SHA256",
    },
    cache: "no-store",
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.msg || "Chyba při získávání tokenu");
  }
  return data.result.access_token;
}

export async function GET() {
  try {
    const token = await getAccessToken();
    const timestamp = Date.now().toString();

    // 1. Získání seznamu všech zařízení
    const devUrl = "/v1.0/users/YOUR_USER_ID_OR_APP/devices"; // Příklad volání seznamu
    // Pokud používáte jiný endpoint pro seznam zařízení, ponechte své URL:
    const listUrl = "/v1.0/iot-01/associated-users/devices";

    const listStrToSign = [CLIENT_ID, token, timestamp, "GET", "", "", listUrl].join("\n");
    const listSign = crypto
      .createHmac("sha256", CLIENT_SECRET)
      .update(listStrToSign)
      .digest("hex")
      .toUpperCase();

    const devRes = await fetch(`${BASE_URL}${listUrl}`, {
      headers: {
        client_id: CLIENT_ID,
        access_token: token,
        sign: listSign,
        t: timestamp,
        sign_method: "HMAC-SHA256",
      },
      cache: "no-store",
    });

    const devData = await devRes.json();
    const rawDevices = devData.result?.devices || devData.result || [];

    // 2. Načtení AKTUÁLNÍHO STATUSU (živých hodnot) pro každé zařízení
    const formattedDevices = await Promise.all(
      rawDevices.map(async (dev: any) => {
        const statusUrl = `/v1.0/devices/${dev.id}/status`;
        const stTimestamp = Date.now().toString();
        const stStrToSign = [CLIENT_ID, token, stTimestamp, "GET", "", "", statusUrl].join("\n");
        const stSign = crypto
          .createHmac("sha256", CLIENT_SECRET)
          .update(stStrToSign)
          .digest("hex")
          .toUpperCase();

        let statusList = dev.status || [];
        try {
          const stRes = await fetch(`${BASE_URL}${statusUrl}`, {
            headers: {
              client_id: CLIENT_ID,
              access_token: token,
              sign: stSign,
              t: stTimestamp,
              sign_method: "HMAC-SHA256",
            },
            cache: "no-store",
          });
          const stData = await stRes.json();
          if (stData.success && Array.isArray(stData.result)) {
            statusList = stData.result;
          }
        } catch (e) {
          console.error(`Chyba načítání statusu pro ${dev.id}:`, e);
        }

        // Vytažení teploty a vlhkosti ze živého statusu
        const tempItem = statusList.find(
          (s: any) =>
            s.code === "va_temperature" ||
            s.code === "temp_current" ||
            s.code === "temperature"
        );
        const humItem = statusList.find(
          (s: any) =>
            s.code === "va_humidity" ||
            s.code === "humidity_value" ||
            s.code === "humidity"
        );

        return {
          id: dev.id,
          name: dev.name,
          online: dev.online,
          temperature: tempItem ? tempItem.value : null,
          humidity: humItem ? humItem.value : null,
        };
      })
    );

    return NextResponse.json(
      { success: true, result: formattedDevices },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
