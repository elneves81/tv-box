"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};
class Logger {
    constructor() {
        const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
        this.logLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
        if (process.env.LOG_FILE) {
            this.logFile = process.env.LOG_FILE;
            this.ensureLogDirectory();
        }
    }
    ensureLogDirectory() {
        if (this.logFile) {
            const logDir = path_1.default.dirname(this.logFile);
            if (!fs_1.default.existsSync(logDir)) {
                fs_1.default.mkdirSync(logDir, { recursive: true });
            }
        }
    }
    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length > 0 ? ' ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') : '';
        return `[${timestamp}] ${level}: ${message}${formattedArgs}`;
    }
    writeLog(level, message, ...args) {
        const formattedMessage = this.formatMessage(level, message, ...args);
        console.log(formattedMessage);
        if (this.logFile) {
            fs_1.default.appendFileSync(this.logFile, formattedMessage + '\n');
        }
    }
    error(message, ...args) {
        if (this.logLevel >= LOG_LEVELS.ERROR) {
            this.writeLog('ERROR', message, ...args);
        }
    }
    warn(message, ...args) {
        if (this.logLevel >= LOG_LEVELS.WARN) {
            this.writeLog('WARN', message, ...args);
        }
    }
    info(message, ...args) {
        if (this.logLevel >= LOG_LEVELS.INFO) {
            this.writeLog('INFO', message, ...args);
        }
    }
    debug(message, ...args) {
        if (this.logLevel >= LOG_LEVELS.DEBUG) {
            this.writeLog('DEBUG', message, ...args);
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map