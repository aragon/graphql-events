export enum Level {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

/**
 * Logger class to set different levels and have standardized logs
 *
 * @export
 * @class Logger
 */
export default class Logger {
  private name: string;
  private level: Level;

  constructor(name: string) {
    this.name = name;

    switch (process.env.LOG_LEVEL) {
      case "DEBUG":
        this.level = Level.DEBUG;
        break;
      case "INFO":
        this.level = Level.INFO;
        break;
      case "WARN":
        this.level = Level.WARN;
        break;
      case "ERROR":
        this.level = Level.ERROR;
        break;
      default:
        this.level = Level.ERROR;
    }
  }

  /**
   * Log messages on the debug level
   *
   * @param {...Array<any>} message
   * @memberof Logger
   */
  public debug(...message: Array<any>): void {
    this.log(Level.DEBUG, message);
  }

  /**
   * Log messages on the info level
   *
   * @param {...Array<any>} message
   * @memberof Logger
   */
  public info(...message: Array<any>): void {
    this.log(Level.INFO, message);
  }

  /**
   * Log messages on the warn level
   *
   * @param {...Array<any>} message
   * @memberof Logger
   */
  public warn(...message: Array<any>): void {
    this.log(Level.WARN, message);
  }

  /**
   * Log messages on the error level
   *
   * @param {...Array<any>} message
   * @memberof Logger
   */
  public error(...message: Array<any>): void {
    this.log(Level.ERROR, message);
  }

  /**
   * Helper function to decide if the message has to be logged
   * and creating the standard log message structure
   *
   * @private
   * @param {Level} level
   * @param {...Array<any>} message
   * @memberof Logger
   */
  private log(level: Level, ...message: Array<any>): void {
    if (this.level <= level) {
      console.log(
        `[${new Date().toISOString()}] [${Level[level]}] [${this.name}]`,
        message.join(" ")
      );
    }
  }
}
