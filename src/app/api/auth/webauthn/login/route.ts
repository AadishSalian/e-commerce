import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';

export async function GET() {
  const options = await generateAuthenticationOptions({
    rpID: 'localhost',
    userVerification: 'preferred',
  });
  return NextResponse.json(options);
}
