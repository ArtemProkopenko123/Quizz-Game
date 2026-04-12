/**
 * When the app is opened via a LAN IP (e.g. phone), API and WS must use that
 * host — not localhost, which would target the client device.
 */
export function getApiBaseUrl(): string {
  const explicit = process.env['NEXT_PUBLIC_API_URL'];
  if (explicit) return explicit;
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3001/api`;
  }
  return 'http://localhost:3001/api';
}

export function getWsUrl(): string {
  const explicit = process.env['NEXT_PUBLIC_WS_URL'];
  if (explicit) return explicit;
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
}
