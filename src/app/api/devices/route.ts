import { NextResponse } from "next/server";
import crypto from "crypto";

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
    const clientId = process.env.TUYA_CLIENT_ID || "";
    const clientSecret = process.env.TUYA_CLIENT_SECRET || "";
    const endpoint = process.env.TUYA_ENDPOINT || "https://openapi.tuyaeu.com";
    const userId = process.env.TUYA_USER_ID || "";

    if (!clientId || !clientSecret || !userId) {
      return NextResponse.json([
        { id: "err", name: "CHYBÍ VERCEL PROMĚNNÉ", temperature: 0, humidity: 0, online: false }
      ]);
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

    // Pokud selže Token, vypíšeme přesnou chybu přímo na dlaždici
    if (!tokenData || !tokenData.success || !tokenData.result?.access_token) {
      const errMessage = tokenData?.msg || tokenData?.code || "Unknown Token Error";
      return NextResponse.json([
        { id: "err_token", name: `TOKEN CHYBA: ${errMessage}`, temperature: 0, humidity: 0, online: false }
      ]);
    }

    const accessToken = tokenData.result.access_token;
    const t2 = Date.now().toString();

    // 2. Načtení zařízení uživatele z Tuya API
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

    // Pokud selže načtení zařízení, vypíšeme přesnou chybu
    if (!devicesData || !devicesData.success || !Array.isArray(devicesData.result)) {
      const errMessage = devicesData?.msg || devicesData?.code || "Unknown Device Error";
      return NextResponse.json([
        { id: "err_dev", name: `DEV CHYBA: ${errMessage}`, temperature: 0, humidity: 0, online: false }
      ]);
    }

    // 3. Mapování živých dat
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
  } catch (error: any) {
    return NextResponse.json([
      { id: "err_catch", name: `CATCH CHYBA: ${error?.message || "Server Error"}`, temperature: 0, humidity: 0, online: false }
    ]);
  }
}
