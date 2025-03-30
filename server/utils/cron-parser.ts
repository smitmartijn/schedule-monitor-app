import parser from 'cron-parser';

export function parseScheduleExpression(expression: string): string {
  // Handle Laravel schedule frequency shortcuts
  if (expression.startsWith('@')) {
    return convertLaravelShortcutsToCron(expression);
  }

  return expression;
}

export function convertLaravelShortcutsToCron(shortcut: string): string {
  // Map Laravel schedule frequency shortcuts to cron expressions
  const shortcuts: Record<string, string> = {
    '@yearly': '0 0 1 1 *',
    '@annually': '0 0 1 1 *',
    '@monthly': '0 0 1 * *',
    '@weekly': '0 0 * * 0',
    '@daily': '0 0 * * *',
    '@midnight': '0 0 * * *',
    '@hourly': '0 * * * *',
    '@everyMinute': '* * * * *',
    '@everyFiveMinutes': '*/5 * * * *',
    '@everyTenMinutes': '*/10 * * * *',
    '@everyFifteenMinutes': '*/15 * * * *',
    '@everyThirtyMinutes': '*/30 * * * *'
  };

  return shortcuts[shortcut] || '* * * * *'; // Default to every minute
}

export function getNextRunDate(cronExpression: string, lastRun?: Date): Date {
  try {
    // Parse the cron expression
    const interval = parser.parseExpression(
      parseScheduleExpression(cronExpression),
      {
        currentDate: lastRun || new Date(),
        iterator: true
      }
    );

    // Get the next run date
    return interval.next().value.toDate();
  } catch (error) {
    console.error('Error parsing cron expression:', error);
    // Return a date 1 day from now as fallback
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1);
    return fallback;
  }
}