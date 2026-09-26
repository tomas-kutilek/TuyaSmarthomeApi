import { NextResponse } from 'next/server';
import crypto from 'crypto';

const CLIENT_ID = process.env.TUYA_CLIENT_ID || 'pasjsrhrnvpfk73mrqrn';
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET || '1398c1d5b62842aeb3502abee069af89';
const BASE_URL = process.env.TUYA_ENDPOINT || 'https://openapi.tuyaeu.com';

function generateSign(
  clientId: string,
  secret: string,
  timestamp: string,
  accessToken: string = '',
  nonce: string = '',
  httpMethod: string = 'GET',
  urlPath: string = ''
) {
  const contentHash = crypto.createHash('sha256').update('').digest('hex');
  const stringToSign = [httpMethod, contentHash, '', urlPath].join('\n');
  const signStr = clientId + accessToken + timestamp + nonce + stringToSign;
  
  return crypto
    .createHmac('sha256', secret)
    .update(signStr)
    .digest('hex')
    .toUpperCase();
}

async function getAccessToken() {
  const timestamp = Date.now().toString();
  const path = '/v1.0/token?grant_type=1';
  const sign = generateSign(CLIENT_ID, CLIENT_SECRET, timestamp, '', '', 'GET', path);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      client_id: CLIENT_ID,
      sign: sign,
      t: timestamp,
      sign_method: 'HMAC-SHA256',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Tuya HTTP Error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(`Tuya Token Error (${data.code}): ${data.msg || 'Failed to get token'}`);
  }
  return data.result.access_token;
}

export async function GET() {
  try {
    const token = await getAccessToken();
    const timestamp = Date.now().toString();

    const deviceIds = [
      'bf524b00e3661af2bd7yjp', // Teploměr dílna
      'bf66c0ae13f3dbf851tc1z', // Teploměr obývák
      'bfa1b8eb8bda1a3781kddf'  // Teplota venku
    ];

    const devicePromises = deviceIds.map(async (deviceId) => {
      const path = `/v1.0/devices/${deviceId}`;
      const sign = generateSign(CLIENT_ID, CLIENT_SECRET, timestamp, token, '', 'GET', path);

      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers: {
          client_id: CLIENT_ID,
          access_token: token,
          sign: sign,
          t: timestamp,
          sign_method: 'HMAC-SHA256',
        },
        cache: 'no-store',
      });

      const data = await res.json();
      if (data.success && data.result) {
        const dev = data.result;
        
        // Zpracování živých stavů z Tuya API (status pole)
        let rawTemp = 200; // výchozí fallback
        let rawHumidity = 50;
        let online = dev.online ?? true;

        if (Array.isArray(dev.status)) {
          for (const st of dev.status) {
            if (['temp_current', 'temperature', 'cur_temperature', 'va_temperature'].includes(st.code)) {
              rawTemp = Number(st.value);
            }
            if (['humidity', 'va_humidity'].includes(st.code)) {
              rawHumidity = Number(st.value);
            }
          }
        }

        // Pokud Tuya posílá celočíselnou hodnotu (např. 215 -> 21.5), převedeme ji
        // Jestliže už je to desetinné číslo, zachováme ho
        let temperature = rawTemp > 100 || rawTemp < -100 ? rawTemp / 10 : rawTemp;

        // Určení barvy podle pravidel (< 0 modrá, > 25 červená, jinak default)
        let color = 'default';
        if (temperature < 0) {
          color = 'blue';
        } else if (temperature > 25) {
          color = 'red';
        }

        return {
          id: dev.id,
          name: dev.name,
          online: online,
          temperature: temperature, // skutečná reálná hodnota s desetinnou čárkou
          color: color,
          status: dev.status
        };
      }
      return null;
    });

    const results = await Promise.all(devicePromises);
    const validDevices = results.filter((dev) => dev !== null);

    return NextResponse.json({
      success: true,
      devices: validDevices,
      result: validDevices
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
