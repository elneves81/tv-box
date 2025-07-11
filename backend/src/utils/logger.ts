import fs from 'fs';
import path from 'path';

interface LogLevel {
  ERROR: number;
  WARN: number;
  INFO: number;
  DEBUG: number;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  private logLevel: number;
  private logFile?: string;

  constructor() {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    this.logLevel = LOG_LEVELS[level as keyof LogLevel] || LOG_LEVELS.INFO;
    
    if (process.env.LOG_FILE) {
      this.logFile = process.env.LOG_FILE;
      this.ensureLogDirectory();
    }
  }

  private ensureLogDirectory() {
    if (this.logFile) {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] ${level}: ${message}${formattedArgs}`;
  }

  private writeLog(level: string, message: string, ...args: any[]) {
    const formattedMessage = this.formatMessage(level, message, ...args);
    
    // Console output
    console.log(formattedMessage);
    
    // File output
    if (this.logFile) {
      fs.appendFileSync(this.logFile, formattedMessage + '\n');
    }
  }

  error(message: string, ...args: any[]) {
    if (this.logLevel >= LOG_LEVELS.ERROR) {
      this.writeLog('ERROR', message, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.logLevel >= LOG_LEVELS.WARN) {
      this.writeLog('WARN', message, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.logLevel >= LOG_LEVELS.INFO) {
      this.writeLog('INFO', message, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.logLevel >= LOG_LEVELS.DEBUG) {
      this.writeLog('DEBUG', message, ...args);
    }
  }
}

export const logger = new Logger();
