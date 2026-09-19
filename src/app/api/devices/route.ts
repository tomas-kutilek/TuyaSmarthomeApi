import { NextResponse } from "next/server";
import crypto from "crypto";

// Pomocná funkce pro podpis Tuya API požadavků (HMAC-SHA256)
function generateSign(
  clientId: string,
  secret: string,
  accessToken: string = "",
  t: string,
  nonce: string = "",
  stringToSign: string
) {
  const str = clientId + accessToken + t + nonce + stringToSign;
  return crypto.createHmac("sha256", secret).update(str).digest("hex").toUpperCase();
}

export async function GET() {
  try {
    const clientId = process.env.TUYA_CLIENT_ID;
    const clientSecret = process.env.TUYA_CLIENT_SECRET;
    const endpoint = process.env.TUYA_ENDPOINT || "https://openapi.tuyaeu.com";
    const userId = process.env.TUYA_USER_ID;

    if (!clientId || !clientSecret || !userId) {
      console.warn("Chybí Tuya proměnné prostředí.");
      return NextResponse.json([]);
    }

    const t = Date.now().toString();

    // 1. Získání Access Tokenu
    const tokenUrl = "/v1.0/token?grant_type=1";
    const tokenStringToSign = ["GET", crypto.createHash("sha256").update("").digest("hex"), "", tokenUrl].join("\n");
    const tokenSign = generateSign(clientId, clientSecret, "", t, "", tokenStringToSign);

    const tokenRes = await fetch(`${endpoint}${tokenUrl}`, {
      headers: {
        client_id: clientId,
        sign: tokenSign,
        t: t,
        sign_method: "HMAC-SHA256",
      },
      cache: "no-store",
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.success || !tokenData.result?.access_token) {
      console.error("Tuya Token Error:", tokenData);
      return NextResponse.json([]);
    }

    const accessToken = tokenData.result.access_token;
    const t2 = Date.now().toString();

    // 2. Získání seznamu zařízení uživatele
    const devicesUrl = `/v1.0/users/${userId}/devices`;
    const devicesStringToSign = ["GET", crypto.createHash("sha256").update("").digest("hex"), "", devicesUrl].join("\n");
    const devicesSign = generateSign(clientId, clientSecret, accessToken, t2, "", devicesStringToSign);

    const devicesRes = await fetch(`${endpoint}${devicesUrl}`, {
      headers: {
        client_id: clientId,
        access_token: accessToken,
        sign: devicesSign,
        t: t2,
        sign_method: "HMAC-SHA256",
      },
      cache: "no-store",
    });

    const devicesData = await devicesRes.json();

    if (!devicesData.success || !Array.isArray(devicesData.result)) {
      console.error("Tuya Devices Error:", devicesData);
      return NextResponse.json([]);
    }

    // 3. Mapování dat ze senzorů
    const formattedDevices = devicesData.result.map((dev: any) => {
      let temp = null;
      let hum = null;

      if (Array.isArray(dev.status)) {
        const tempStatus = dev.status.find(
          (s: any) =>
            s.code === "temp_current" ||
            s.code === "va_temperature" ||
            s.code === "temp"
        );
        const humStatus = dev.status.find(
          (s: any) =>
            s.code === "humidity_current" ||
            s.code === "va_humidity" ||
            s.code === "humidity"
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
  } catch (error) {
    console.error("Chyba při komunikaci s Tuya API:", error);
    return NextResponse.json([]);
  }
}
