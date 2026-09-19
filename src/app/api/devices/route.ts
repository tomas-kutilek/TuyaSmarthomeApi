import { NextResponse } from "next/server";
import crypto from "crypto";

function calcSign(
  clientId: string,
  secret: string,
  accessToken: string,
  timestamp: string,
  nonce: string,
  httpMethod: string,
  url: string
): string {
  const contentHash = crypto.createHash("sha256").update("").digest("hex");
  const stringToSign = [httpMethod, contentHash, "", url].join("\n");
  const str = clientId + accessToken + timestamp + nonce + stringToSign;
  return crypto.createHmac("sha256", secret).update(str).digest("hex").toUpperCase();
}

export async function GET() {
  try {
    const clientId = process.env.TUYA_CLIENT_ID;
    const clientSecret = process.env.TUYA_CLIENT_SECRET;
    const endpoint = process.env.TUYA_ENDPOINT || "https://openapi.tuyaeu.com";
    const userId = process.env.TUYA_USER_ID;

    if (!clientId || !clientSecret || !userId) {
      return NextResponse.json({ error: "Missing env variables" }, { status: 500 });
    }

    const t = Date.now().toString();
    const tokenUrl = "/v1.0/token?grant_type=1";
    const tokenSign = calcSign(clientId, clientSecret, "", t, "", "GET", tokenUrl);

    // 1. Získání Tokenu
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
      return NextResponse.json({ error: "Token fetch failed", details: tokenData }, { status: 500 });
    }

    const accessToken = tokenData.result.access_token;
    const t2 = Date.now().toString();
    const devicesUrl = `/v1.0/users/${userId}/devices`;
    const devicesSign = calcSign(clientId, clientSecret, accessToken, t2, "", "GET", devicesUrl);

    // 2. Získání živých zařízení
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
      return NextResponse.json({ error: "Devices fetch failed", details: devicesData }, { status: 500 });
    }

    // 3. Formátování reálných dat pro frontend
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
    console.error("Server Error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
