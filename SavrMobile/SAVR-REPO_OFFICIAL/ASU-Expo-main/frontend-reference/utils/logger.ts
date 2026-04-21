// Lightweight env-aware logger with simple dedupe-on-change helpers
// Usage:
//   import logger from '@/utils/logger';
//   logger.debug('message', data)
//   logger.changed('ChatPage:state', { a: 1, b: 2 }) // logs only when payload changes

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

// Detect Vite env if available, otherwise fall back to Node env, then defaults
const viteEnv: any | undefined = (typeof import.meta !== 'undefined' && (import.meta as any)?.env)
  ? (import.meta as any).env
  : undefined;

const envMode: string = (viteEnv?.MODE as string)
  || (typeof process !== 'undefined' ? process.env.NODE_ENV : undefined)
  || 'development';

const configuredLevel: string | undefined = (viteEnv?.VITE_LOG_LEVEL as string | undefined)
  || (typeof process !== 'undefined' ? (process.env.VITE_LOG_LEVEL || process.env.LOG_LEVEL) : undefined);

const levelToNumber: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 50,
};

function parseLevel(value: string | undefined): LogLevel | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase() as LogLevel;
  if (v in levelToNumber) return v;
  return undefined;
}

const defaultLevel: LogLevel = envMode === 'production' ? 'warn' : 'debug';
const currentLevel: LogLevel = parseLevel(configuredLevel) || defaultLevel;

function shouldLog(level: LogLevel): boolean {
  return levelToNumber[level] >= levelToNumber[currentLevel] && currentLevel !== 'silent';
}

// Simple stable stringify (best-effort) to compare objects without deep diffing
function stableStringify(value: unknown): string {
  try {
    return JSON.stringify(value, Object.keys(value as any).sort());
  } catch (_e) {
    try {
      return JSON.stringify(value);
    } catch (_e2) {
      return String(value);
    }
  }
}

const previousByKey = new Map<string, string>();

const logger = {
  level: currentLevel as LogLevel,
  debug: (...args: unknown[]) => { if (shouldLog('debug')) console.debug(...args); },
  info: (...args: unknown[]) => { if (shouldLog('info')) console.info(...args); },
  warn: (...args: unknown[]) => { if (shouldLog('warn')) console.warn(...args); },
  error: (...args: unknown[]) => { if (shouldLog('error')) console.error(...args); },

  // Logs only when the serialized payload for a given key changes
  changed: (key: string, payload: unknown, level: Exclude<LogLevel, 'error' | 'silent'> = 'debug') => {
    try {
      const next = stableStringify(payload);
      const prev = previousByKey.get(key);
      if (prev !== next) {
        previousByKey.set(key, next);
        if (level === 'debug') {
          logger.debug(`[${key}]`, payload);
        } else if (level === 'info') {
          logger.info(`[${key}]`, payload);
        } else {
          logger.warn(`[${key}]`, payload);
        }
      }
    } catch (err) {
      // If comparison fails, fall back to a normal log
      logger.debug(`[${key}]`, payload);
    }
  },
} as const;

export default logger;


