import { createHash } from 'crypto';

export function reminderDeliveryKey(recipient: string, type: string, resource: string, utcDay: string) {
  return createHash('sha256').update(JSON.stringify(['service-reminder-v1', recipient, type, resource, utcDay])).digest('hex');
}
