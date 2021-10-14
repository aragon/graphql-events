import { ethers } from "ethers";
import EventEmitter from "events";
import Logger from "../helpers/Logger";

/**
 * Creates a connection to a ws RPC endpoint and exposes events
 *
 * @export
 * @class Web3
 * @extends {EventEmitter}
 */
export default class Web3 extends EventEmitter {
  private provider: ethers.providers.WebSocketProvider;
  private logger: Logger;

  constructor(name: string, endpoint: string) {
    super();
    this.logger = new Logger(name);

    this.logger.info(`Connecting to ${endpoint}`);
    this.provider = new ethers.providers.WebSocketProvider(endpoint);

    this.subscribe2NewBlock();
  }

  /**
   * Setup a subscription to new blocks
   *
   * @private
   * @memberof Web3
   */
  private subscribe2NewBlock() {
    this.logger.debug(`Subscribe to newHeads`);
    this.provider.on("block", (blocknumber: number) => {
      this.logger.debug(`New block ${blocknumber}`);
      this.emit("block", blocknumber);
    });
  }
}
