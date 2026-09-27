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

async function fetchTuyaApi(path: string, token: string, clientId: string, secret: string, baseUrl: string) {
  const timestamp = Date.now().toString();
  const sign = generateSign(clientId, secret, timestamp, token, '', 'GET', path);

  const res = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: {
      client_id: clientId,
      access_token: token,
      sign: sign,
      t: timestamp,
      sign_method: 'HMAC-SHA256'
    },
    cache: 'no-store',
  });

  return await res.json();
}

export async function GET() {
  try {
    const token = await getAccessToken();

    const targetDevices = [
      { id: 'bf524b00e3661af2bd7yjp', name: 'Dílna' },
      { id: 'bf66c0ae13f3dbf851tc1z', name: 'Obývák' },
      { id: 'bfa1b8eb8bda1a3781kddf', name: 'Venku' }
    ];

    const results = await Promise.all(targetDevices.map(async (devInfo) => {
      let online = false;
      let temperature = 0.0;
      let statusList: any[] = [];

      // Seznam endpointů, které pro Zigbee zařízení v Tuya cloudu přicházejí v úvahu
      const pathsToTry = [
        `/v1.0/devices/${devInfo.id}`,
        `/v1.0/devices/${devInfo.id}/status`,
        `/v1.0/iot-03/devices/${devInfo.id}/status`
      ];

      for (const path of pathsToTry) {
        try {
          const data = await fetchTuyaApi(path, token, CLIENT_ID, CLIENT_SECRET, BASE_URL);
          
          if (data.success) {
            // Zjištění online stavu
            if (typeof data.result?.online === 'boolean') {
              online = data.result.online;
            } else {
              online = true; // Pokud endpoint vrátil úspěšná data, zařízení komunikuje
            }

            // Extrakce status pole (může být v result, nebo přímo jako pole v result)
            if (Array.isArray(data.result)) {
              statusList = data.result;
            } else if (Array.isArray(data.result?.status)) {
              statusList = data.result.status;
            } else if (Array.isArray(data.result?.properties)) {
              statusList = data.result.properties;
            }

            if (statusList.length > 0) {
              for (const item of statusList) {
                const code = item.code || item.dp_id;
                if (code && (String(code).toLowerCase().includes('temp') || String(code) === 'va_temperature')) {
                  let val = Number(item.value);
                  if (!isNaN(val)) {
                    temperature = (val > 60 || val < -60) ? val / 10 : val;
                    break;
                  }
                }
              }
              // Pokud jsme našli teplotu, máme vyhráno
              if (temperature !== 0.0 || statusList.length > 0) {
                break;
              }
            }
          }
        } catch (e) {
          // Pokračujeme dalším endpointem v pořadí
        }
      }

      return {
        id: devInfo.id,
        name: devInfo.name,
        online: online,
        temperature: temperature
      };
    }));

    return NextResponse.json({ success: true, devices: results });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
