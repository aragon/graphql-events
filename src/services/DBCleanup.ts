import { getManager, LessThan } from "typeorm";
import { MessagesSent } from "../entities/MessagesSent";
import Logger from "../helpers/Logger";

/**
 * Service to cleanup the db of old messages
 *
 * @export
 * @class DBCleanup
 */
export default class DBCleanup {
  private logger = new Logger("DBcleanup");
  private keepUntil: number;
  private interval = 1000 * 60 * 60;
  private intervalObj: NodeJS.Timeout;

  constructor(keepUntil = 1000 * 60 * 60 * 24 * 7) {
    this.keepUntil = keepUntil;

    this.intervalObj = setInterval(this.cleanUp.bind(this), this.interval);
  }

  /**
   * Stops the interval from running
   *
   * @memberof DBCleanup
   */
  public destroy() {
    clearInterval(this.intervalObj);
  }

  /**
   * Runs the cleanup of the db
   *
   * @private
   * @return {*}  {Promise<void>}
   * @memberof DBCleanup
   */
  private async cleanUp(): Promise<void> {
    this.logger.debug(`Starting cleanup`);
    const result = await getManager()
      .getRepository(MessagesSent)
      .delete({ createdAt: LessThan(new Date(Date.now() - this.keepUntil)) });

    if (result.affected) {
      this.logger.info(`Cleaned up ${result.affected} messages`);
    }
    this.logger.debug("Cleanup finished");
  }
}
