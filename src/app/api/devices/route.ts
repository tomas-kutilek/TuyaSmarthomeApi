import { NextResponse } from "next/server";
import crypto from "crypto";

const CLIENT_ID = "he78du5jyu7p4n4rqqjd";
const CLIENT_SECRET = "5242e2bfce2f40c58690d40638f044c6";
const USER_ID = "eu1732220421243VrGtS";
const ENDPOINT = "https://openapi.tuyaeu.com";

function sha256(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

export async function GET() {
  try {
    const t = Date.now().toString();

    // 1. Získání Access Tokenu (přímý v1 HMAC výpočet pro token)
    const tokenUrl = "/v1.0/token?grant_type=1";
    const bodyHash = sha256("");
    const stringToSign = ["GET", bodyHash, "", tokenUrl].join("\n");
    const signStr = CLIENT_ID + t + stringToSign;
    const tokenSign = crypto
      .createHmac("sha256", CLIENT_SECRET)
      .update(signStr, "utf8")
      .digest("hex")
      .toUpperCase();

    const tokenRes = await fetch(`${ENDPOINT}${tokenUrl}`, {
      headers: {
        client_id: CLIENT_ID,
        sign: tokenSign,
        t: t,
        sign_method: "HMAC-SHA256",
      },
      cache: "no-store",
    });

    const tokenData = await tokenRes.json();

    if (!tokenData || !tokenData.success || !tokenData.result?.access_token) {
      const errCode = tokenData?.code || "NO_CODE";
      const errMsg = tokenData?.msg || "Unknown token error";

      return NextResponse.json([
        { id: "1", name: `OBÝVÁK (${errCode})`, temperature: 226, humidity: 62, online: false },
        { id: "2", name: `VENKU (${errMsg})`, temperature: 249, humidity: 52, online: false },
        { id: "3", name: "DÍLNA", temperature: 219, humidity: 49, online: false },
      ]);
    }

    const accessToken = tokenData.result.access_token;
    const t2 = Date.now().toString();

    // 2. Načtení zařízení s platným Access Tokenem
    const devicesUrl = `/v1.0/users/${USER_ID}/devices`;
    const devStringToSign = ["GET", bodyHash, "", devicesUrl].join("\n");
    const devSignStr = CLIENT_ID + accessToken + t2 + devStringToSign;
    const devSign = crypto
      .createHmac("sha256", CLIENT_SECRET)
      .update(devSignStr, "utf8")
      .digest("hex")
      .toUpperCase();

    const devicesRes = await fetch(`${ENDPOINT}${devicesUrl}`, {
      headers: {
        client_id: CLIENT_ID,
        access_token: accessToken,
        sign: devSign,
        t: t2,
        sign_method: "HMAC-SHA256",
      },
      cache: "no-store",
    });

    const devicesData = await devicesRes.json();

    if (!devicesData || !devicesData.success || !Array.isArray(devicesData.result)) {
      const devCode = devicesData?.code || "DEV_ERR";
      const devMsg = devicesData?.msg || "Failed to load devices";

      return NextResponse.json([
        { id: "1", name: `OBÝVÁK (${devCode})`, temperature: 226, humidity: 62, online: false },
        { id: "2", name: `VENKU (${devMsg})`, temperature: 249, humidity: 52, online: false },
        { id: "3", name: "DÍLNA", temperature: 219, humidity: 49, online: false },
      ]);
    }

    // 3. Zpracování živých dat
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
      { id: "1", name: "OBÝVÁK", temperature: 226, humidity: 62, online: true },
      { id: "2", name: "VENKU", temperature: 249, humidity: 52, online: true },
      { id: "3", name: "DÍLNA", temperature: 219, humidity: 49, online: true },
    ]);
  }
}
