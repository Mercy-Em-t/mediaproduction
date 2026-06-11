/**
 * Generate HMAC-SHA256 signature for API authentication (browser-compatible)
 * @param {string} userId - The user ID
 * @param {string} secret - The AUTH_HMAC_SECRET from environment
 * @returns {Promise<string>} Hex digest of HMAC-SHA256
 */
export async function generateSignature(userId, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(userId);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  
  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get auth headers for API requests
 * @param {string} userId - The user ID
 * @param {string} secret - The AUTH_HMAC_SECRET from environment
 * @returns {Promise<Object>} Headers object with x-user-id and x-user-signature
 */
export async function getAuthHeaders(userId, secret) {
  const signature = await generateSignature(userId, secret);
  return {
    'x-user-id': userId,
    'x-user-signature': signature,
  };
}
