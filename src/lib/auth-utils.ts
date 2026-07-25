import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

export async function checkHIBP(password: string): Promise<boolean> {
  try {
    // Hash password with SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // First 5 characters for the API request (k-anonymity model)
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);
    
    // Make request to HIBP API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    
    if (!response.ok) {
      console.error('HIBP API error', response.status);
      return false; // Fail open if API fails, so we don't block users if HIBP is down
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    // Check if our suffix is in the response
    for (const line of lines) {
      const [lineSuffix] = line.split(':');
      if (lineSuffix.trim() === suffix) {
        return true; // Password has been breached
      }
    }
    
    return false; // Not breached
  } catch (error) {
    console.error('Error checking HIBP', error);
    return false; // Fail open
  }
}
