import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const CLIENT_ID = process.env.TUYA_CLIENT_ID || 'pasjsrhrnvpfk73mrqrn';
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET || '1398c1d5b62842aeb3502abee069af89';
const BASE_URL = process.env.TUYA_ENDPOINT || 'https://openapi.tuyaeu.com';

function generateSign(clientId: string, secret: string, timestamp: string, accessToken: string = '', nonce: string = '', httpMethod: string = 'GET', urlPath: string = '') {
  const contentHash = crypto.createHash('sha256').update('').digest('hex');
  const stringToSign = [httpMethod, contentHash, '', urlPath].join('\n');
  const signStr = clientId + accessToken + timestamp + nonce + stringToSign;
  return crypto.createHmac('sha256', secret).update(signStr).digest('hex').toUpperCase();
}

async function getAccessToken() {
  const timestamp = Date.now().toString();
  const path = '/v1.0/token?grant_type=1';
  const sign = generateSign(CLIENT_ID, CLIENT_SECRET, timestamp, '', '', 'GET', path);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: { client_id: CLIENT_ID, sign: sign, t: timestamp, sign_method: 'HMAC-SHA256' },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(`Token error: ${data.msg || JSON.stringify(data)}`);
  }
  return data.result.access_token;
}

export async function GET() {
  try {
    const accessToken = await getAccessToken();

    const targetDevices = [
      { id: 'bf524b00e3661af2bd7yjp', name: 'Dílna' },
      { id: 'bf66c0ae13f3dbf851tc1z', name: 'Obývák' },
      { id: 'bfa1b8eb8bda1a3781kddf', name: 'Venku' }
    ];

    const results = await Promise.all(targetDevices.map(async (dev) => {
      let online = false;
      let temperature = 0.0;

      // Zkusíme stáhnout detail a stav zařízení
      const pathsToTry = [
        `/v1.0/devices/${dev.id}`,
        `/v1.0/devices/${dev.id}/status`
      ];

      for (const path of pathsToTry) {
        try {
          const timestamp = Date.now().toString();
          const sign = generateSign(CLIENT_ID, CLIENT_SECRET, timestamp, accessToken, '', 'GET', path);

          const res = await fetch(`${BASE_URL}${path}`, {
            method: 'GET',
            headers: {
              client_id: CLIENT_ID,
              access_token: accessToken,
              sign: sign,
              t: timestamp,
              sign_method: 'HMAC-SHA256'
            },
            cache: 'no-store',
          });

          const data = await res.json();
          if (data.success && data.result) {
            // Pokud jde o detail zařízení
            if (typeof data.result.online === 'boolean') {
              online = data.result.online;
            } else {
              online = true; // Pokud endpoint odpověděl úspěšně, zařízení žije
            }

            // Extrakce stavů / vlastností (status může být pole nebo objekt)
            const statusList = Array.isArray(data.result) ? data.result : (data.result.status || data.result.properties || []);
            
            for (const item of statusList) {
              const code = item.code || item.dp_id || '';
              if (String(code).toLowerCase().includes('temp') || code === 'va_temperature') {
                let val = Number(item.value);
                if (!isNaN(val)) {
                  temperature = (val > 60 || val < -60) ? val / 10 : val;
                }
              }
            }
          }
        } catch (err) {
          // Pokračujeme na další cestu v poli, pokud tato selhala
        }
      }

      return {
        id: dev.id,
        name: dev.name,
        online: online,
        temperature: temperature
      };
    }));

    return NextResponse.json({ success: true, devices: results });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
