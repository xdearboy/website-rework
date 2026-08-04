export function clientIp(headers: Record<string, string | undefined>): string {
  return headers['x-real-ip'] ?? headers['x-forwarded-for']?.split(',')[0]?.trim() ?? 'unknown';
}
