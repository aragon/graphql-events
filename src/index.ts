import dotenv from "dotenv";
dotenv.config();

import "reflect-metadata";
import { createConnection } from "typeorm";
import graphConfigs from "./configs/graphs.json";
import Logger from "./helpers/Logger";
import { IConfig, IConfigEntry } from "./interfaces/Config";
import PubSub from "./services/PubSub";
import QueryExecutor from "./services/QueryExecutor";

/**
 * Main class of the application
 *
 * @class Main
 */
class Main {
  private logger = new Logger("Main");
  private pubSub = new PubSub(process.env.TOPIC || "graphql-events");
  private executorCache: { [index: string]: QueryExecutor } = {};

  constructor() {
    const {
      DB_HOST,
      DB_USERNAME,
      DB_PASSWORD,
      DB_DATABASE,
      DB_PORT
    } = process.env;
    this.createDBConnection(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_PORT);
    for (const name in graphConfigs) {
      const config = (graphConfigs as IConfig)[name];
      if (this.isConfigValid(name, config)) {
        this.execGraph(name);
        this.logger.info(
          `Setting interval of ${config.interval}ms for ${name}`
        );
        setInterval(() => {
          this.execGraph(name);
        }, config.interval);
      }
    }
  }

  /**
   * Executes the graph passed in the name
   *
   * @private
   * @param {string} name
   * @return {Promise<void>}
   * @memberof Main
   */
  private async execGraph(name: string): Promise<void> {
    this.logger.info(`Executing ${name}`);
    let executor = this.executorCache[name];
    if (!executor) {
      executor = new QueryExecutor(name, (graphConfigs as IConfig)[name]);
      this.executorCache[name] = executor;
    }
    const results = await executor.execQueries();
    this.pubSub.publishBatch(name, results);
  }

  /**
   * Checks if config has al required fields
   *
   * @private
   * @param {string} name
   * @param {IConfigEntry} config
   * @return {*}  {boolean}
   * @memberof Main
   */
  private isConfigValid(name: string, config: IConfigEntry): boolean {
    if (!config.interval) {
      this.logger.warn(`Invalid config for ${name}. Interval is missing`);
      return false;
    }
    if (!config.schema) {
      this.logger.warn(`Invalid config for ${name}. Schema is missing`);
      return false;
    }
    return true;
  }

  private createDBConnection(host: string = "127.0.0.1", username?: string, password?: string, database: string = "graphql-events", port: string = "5432"): void {
    createConnection({
      type: "postgres",
      host,
      port: parseInt(port),
      username,
      password,
      database,
      entities: [__dirname + "/entities/*.js"],
      synchronize: true,
      logging: false
    })
  }
}

new Main();
