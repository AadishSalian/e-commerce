import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';

export async function GET() {
  const options = await generateRegistrationOptions({
    rpName: 'MATTE. Store',
    rpID: 'localhost',
    userID: new Uint8Array(16),
    userName: 'user@example.com',
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    },
  });

  return NextResponse.json(options);
}
