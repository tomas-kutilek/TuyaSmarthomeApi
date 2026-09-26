import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CLIENT_ID = process.env.TUYA_CLIENT_ID || "";
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET || "";
// Zkontrolujte, zda máte v Tuya nastavenou správnou oblast (EU je https://openapi.tuyaeu.com)
const BASE_URL = process.env.TUYA_ENDPOINT || "https://openapi.tuyaeu.com";

// Funkce pro výpočet podpisu (Sign) podle specifikace Tuya API v2
function calcSign(
  clientId: string,
  secret: string,
  timestamp: string,
  accessToken: string,
  method: string,
  url: string,
  body: string = ""
) {
  const contentHash = crypto.createHash("sha256").update(body).digest("hex");
  const stringToSign = [method, contentHash, "", url].join("\n");
  const signStr = clientId + accessToken + timestamp + stringToSign;

  return crypto
    .createHmac("sha256", secret)
    .update(signStr)
    .digest("hex")
    .toUpperCase();
}

// Získání přístupového tokenu z Tuya
async function getAccessToken() {
  const timestamp = Date.now().toString();
  const method = "GET";
  const url = "/v1.0/token?grant_type=1";

  const contentHash = crypto.createHash("sha256").update("").digest("hex");
  const stringToSign = [method, contentHash, "", url].join("\n");
  const signStr = CLIENT_ID + timestamp + stringToSign;

  const sign = crypto
    .createHmac("sha256", CLIENT_SECRET)
    .update(signStr)
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
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error("Chybí TUYA_CLIENT_ID nebo TUYA_CLIENT_SECRET v proměnných prostředí.");
    }

    const token = await getAccessToken();

    // Načtení seznamu všech zařízení z vašich spárovaných účtů
    const listUrl = "/v1.0/iot-01/associated-users/devices";
    const timestamp = Date.now().toString();
    const listSign = calcSign(CLIENT_ID, CLIENT_SECRET, timestamp, token, "GET", listUrl);

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

    if (!devData.success) {
      throw new Error(devData.msg || "Chyba při načítání seznamu zařízení");
    }

    const rawDevices = devData.result?.devices || devData.result || [];

    // Získání ŽIVÉHO STATUSU (teploty a vlhkosti) pro každé zařízení zvlášť
    const formattedDevices = await Promise.all(
      rawDevices.map(async (dev: any) => {
        const statusUrl = `/v1.0/devices/${dev.id}/status`;
        const stTimestamp = Date.now().toString();
        const stSign = calcSign(CLIENT_ID, CLIENT_SECRET, stTimestamp, token, "GET", statusUrl);

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

        // Hledání klíčů pro teplotu a vlhkost ze statusu
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
      { success: false, error: error.message || "Neznámá chyba" },
      { status: 500 }
    );
  }
}
