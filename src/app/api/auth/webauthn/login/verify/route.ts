import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { response } = await req.json();
    
    // In a real app we'd verify the assertion using simplewebauthn/server verifyAuthenticationResponse
    // For this UI demo, we mock success if a response is provided
    if (response) {
      return NextResponse.json({ verified: true, user: { id: 'mock-id', name: 'Biometric User', email: 'bio@example.com' } });
    }
    return NextResponse.json({ verified: false }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
