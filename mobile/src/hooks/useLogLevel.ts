const LOG_LEVEL_PRIORITY: Record<string, number> = {
  INFO: 0,
  WARN: 1,
  ERROR: 2,
};

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

function getLogLevel(): LogLevel {
  return (process.env.EXPO_PUBLIC_LOG_LEVEL || 'ERROR').toUpperCase() as LogLevel;
}

export function shouldLog(level: LogLevel): boolean {
  const minLevel = getLogLevel();
  return (LOG_LEVEL_PRIORITY[level] ?? 2) >= (LOG_LEVEL_PRIORITY[minLevel] ?? 2);
}

export function useLogLevel() {
  return {
    getLevel: getLogLevel,
    info: () => shouldLog('INFO'),
    warn: () => shouldLog('WARN'),
    error: () => shouldLog('ERROR'),
  };
}
