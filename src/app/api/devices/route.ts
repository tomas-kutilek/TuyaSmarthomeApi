import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  try {
    const clientId = "hx78dtfgp7p4nhrqgpt";
    const clientSecret = "5242a3bfba2f40c18fe10d406391f44ea";
    const userId = "eu1732220421243VrGtS";
    const endpoint = "https://openapi.tuyaeu.com";

    const t = Date.now().toString();
    const nonce = "";
    const bodyHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    // 1. Získání Access Tokenu (Oficiální Tuya v2 HMAC Sign)
    const tokenUrl = "/v1.0/token?grant_type=1";
    const stringToSign = ["GET", bodyHash, "", tokenUrl].join("\n");
    const signUrl = clientId + t + nonce + stringToSign;
    const sign = crypto.createHmac("sha256", clientSecret).update(signUrl).digest("hex").toUpperCase();

    const tokenRes = await fetch(`${endpoint}${tokenUrl}`, {
      headers: {
        client_id: clientId,
        sign: sign,
        t: t,
        sign_method: "HMAC-SHA256",
      },
      cache: "no-store",
    });

    const tokenData = await tokenRes.json();

    if (!tokenData || !tokenData.success || !tokenData.result?.access_token) {
      const msg = tokenData?.msg || tokenData?.code || "Token error";
      return NextResponse.json([
        { id: "err1", name: `TOKEN ERR: ${msg}`, temperature: 0, humidity: 0, online: false }
      ]);
    }

    const accessToken = tokenData.result.access_token;
    const t2 = Date.now().toString();

    // 2. Načtení živých zařízení z vašeho Tuya účtu
    const devicesUrl = `/v1.0/users/${userId}/devices`;
    const devStringToSign = ["GET", bodyHash, "", devicesUrl].join("\n");
    const devSignUrl = clientId + accessToken + t2 + nonce + devStringToSign;
    const devicesSign = crypto.createHmac("sha256", clientSecret).update(devSignUrl).digest("hex").toUpperCase();

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

    if (!devicesData || !devicesData.success || !Array.isArray(devicesData.result)) {
      const msg = devicesData?.msg || devicesData?.code || "Device error";
      return NextResponse.json([
        { id: "err2", name: `DEV ERR: ${msg}`, temperature: 0, humidity: 0, online: false }
      ]);
    }

    // 3. Zpracování a mapování reálných dat ze senzorů
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
      { id: "err3", name: `CATCH: ${error?.message || "Err"}`, temperature: 0, humidity: 0, online: false }
    ]);
  }
}
