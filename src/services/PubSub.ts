import { PubSub as PubSubGoogle, Topic } from "@google-cloud/pubsub";
import { createHmac } from "crypto";
import { getManager } from "typeorm";
import { MessagesSent } from "../entities/MessagesSent";
import Logger from "../helpers/Logger";

/**
 * Service to publish messages in Googles Pub/Sub
 *
 * @export
 * @class PubSub
 */
export default class PubSub {
  private client: Topic;
  private source: string = "graphql-events";
  private topic: string;
  private logger: Logger;

  constructor(topic: string) {
    this.topic = topic;
    this.client = new PubSubGoogle().topic(topic);
    this.logger = new Logger(`PubSub/${topic}`);
  }

  /**
   * Publishes a batch of messages
   *
   * @param {string} type
   * @param {object[]} messages
   * @param {string} schema
   * @memberof PubSub
   */
  public publishBatch(type: string, messages: object[], schema: string): void {
    for (const message of messages) {
      this.publish(type, message, schema);
    }
  }

  /**
   * Publish a message if it is new for this type and topic
   *
   * @param {string} type
   * @param {object} message
   * @param {string} schema
   * @return {*}  {Promise<void>}
   * @memberof PubSub
   */
  public async publish(
    type: string,
    message: object,
    schema: string
  ): Promise<void> {
    this.logger.debug(
      `Checking if message is new for type ${type} in topic ${this.topic}`
    );
    const isNew = await this.isNew(message, type);
    if (isNew) {
      this.logger.debug(
        `Message is new for type ${type} in topic ${this.topic}. Sending now...`
      );
      try {
        const messageId = await this.client.publishJSON({
          source: this.source,
          type,
          message,
        });
        this.logger.debug(
          `Published message of type ${type} in topic ${this.topic} with messageID: ${messageId}`
        );
        await getManager()
          .getRepository(MessagesSent)
          .save({
            hash: this.hashData(message),
            source: this.source,
            schema,
            type,
            messageId,
          });
      } catch (err) {
        this.logger.error(
          `Failed publishing message of type ${type} in topic ${this.topic} with`,
          err
        );
      }
    } else {
      this.logger.debug(
        `Message isn't new for type ${type} in topic ${this.topic}. Skipping...`
      );
    }
  }

  /**
   * Checks if the particular query has already been sent to pub/sub
   *
   * @private
   * @param {object} message
   * @param {string} type
   * @return {Promise<boolean>}
   * @memberof PubSub
   */
  private async isNew(message: object, type: string): Promise<boolean> {
    if (message) {
      const dataHash = this.hashData(message);
      const dbResult = await getManager().getRepository(MessagesSent).findOne({
        hash: dataHash,
        source: this.source,
        type: type,
      });

      return dbResult === undefined;
    }
    return false;
  }

  /**
   * creates a hash of the data
   *
   * @private
   * @param {*} data
   * @return {string}
   * @memberof PubSub
   */
  private hashData(data: any): string {
    return createHmac("sha256", "secret")
      .update(JSON.stringify(data))
      .digest("hex");
  }
}
