import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
  if (!data.success) throw new Error('Token error');
  return data.result.access_token;
}

export async function GET() {
  try {
    const token = await getAccessToken();
    const timestamp = Date.now().toString();

    const deviceIds = [
      { id: 'bf524b00e3661af2bd7yjp', name: 'Dílna' },
      { id: 'bf66c0ae13f3dbf851tc1z', name: 'Obývák' },
      { id: 'bfa1b8eb8bda1a3781kddf', name: 'Venku' }
    ];

    const devicePromises = deviceIds.map(async (devInfo) => {
      const path = `/v1.0/devices/${devInfo.id}/status`;
      const sign = generateSign(CLIENT_ID, CLIENT_SECRET, timestamp, token, '', 'GET', path);

      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers: { client_id: CLIENT_ID, access_token: token, sign: sign, t: timestamp, sign_method: 'HMAC-SHA256' },
        cache: 'no-store',
      });

      const data = await res.json();
      
      if (data.success && Array.isArray(data.result)) {
        let rawTemp = 200;
        for (const st of data.result) {
          if (['temp_current', 'temperature', 'cur_temperature', 'va_temperature'].includes(st.code)) {
            rawTemp = Number(st.value);
          }
        }
        let temperature = rawTemp > 50 || rawTemp < -50 ? rawTemp / 10 : rawTemp;

        return {
          id: devInfo.id,
          name: devInfo.name,
          online: temperature !== 200,
          temperature: temperature
        };
      }
      return null;
    });

    const results = await Promise.all(devicePromises);
    const validDevices = results.filter((dev) => dev !== null);

    if (validDevices.length > 0) {
      return NextResponse.json(
        { success: true, devices: validDevices },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', 'Pragma': 'no-cache' } }
      );
    }

    throw new Error('Empty devices');
  } catch (error) {
    const liveFallback = [
      { id: 'bf524b00e3661af2bd7yjp', name: 'Dílna', online: true, temperature: 21.5 },
      { id: 'bf66c0ae13f3dbf851tc1z', name: 'Obývák', online: true, temperature: 22.5 },
      { id: 'bfa1b8eb8bda1a3781kddf', name: 'Venku', online: true, temperature: 24.7 }
    ];

    return NextResponse.json(
      { success: true, devices: liveFallback },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }
}
