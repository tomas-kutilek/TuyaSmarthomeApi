import { NextResponse } from 'next/server';
import crypto from 'crypto';

const CLIENT_ID = process.env.TUYA_CLIENT_ID || 'pasjsrhrnvpfk73mrqrn';
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET || '1398c1d5b62842aeb3502abee069af89';
const BASE_URL = process.env.TUYA_ENDPOINT || 'https://openapi.tuyaeu.com';

// Pomocná funkce pro vygenerování podpisu (HMAC-SHA256)
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

// Získání platného Access Tokenu
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

  const data = await res.json();
  if (!data.success) {
    throw new Error(`Tuya Token Error: ${data.msg || 'Failed to get token'}`);
  }
  return data.result.access_token;
}

// GET endpoint - načtení všech zařízení pro Smart Home PaaS
export async function GET() {
  try {
    const token = await getAccessToken();
    const timestamp = Date.now().toString();
    
    // Smart Home PaaS API endpoint pro načtení všech spárovaných zařízení
    const path = '/v1.0/users/devices'; 
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

    if (!data.success) {
      return NextResponse.json({ error: data.msg }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      devices: data.result || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
