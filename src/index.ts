import dotenv from "dotenv";
dotenv.config();

import "reflect-metadata";
import { createConnection } from "typeorm";
import graphConfigs from "./configs/graphs.json";
import Logger from "./helpers/Logger";
import { IConfig, IConfigEntry, IConfigSchemas } from "./interfaces/Config";
import { IGraphqlVariables } from "./interfaces/GaphqlVariables";
import { Networks, Web3Connections } from "./interfaces/Web3Connections";
import DBCleanup from "./services/DBCleanup";
import PubSub from "./services/PubSub";
import QueryExecutor from "./services/QueryExecutor";
import Web3 from "./services/Web3";

/**
 * Main class of the application
 *
 * @class Main
 */
class Main {
  private logger = new Logger("Main");
  private pubSub = new PubSub(process.env.TOPIC || "graphql-events");
  private executorCache: { [index: string]: QueryExecutor } = {};
  private web3Connections!: Web3Connections;

  constructor() {
    const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_PORT } =
      process.env;
    this.createDBConnection(
      DB_HOST,
      DB_USERNAME,
      DB_PASSWORD,
      DB_DATABASE,
      DB_PORT
    );

    const { RPC_MAINNET, RPC_RINKEBY, RPC_POLYGON, RPC_MUMBAI } = process.env;
    this.connectToNetwork(Networks.MAINNET, RPC_MAINNET || "");
    this.connectToNetwork(Networks.RINKEBY, RPC_RINKEBY || "");
    this.connectToNetwork(Networks.POLYGON, RPC_POLYGON || "");
    this.connectToNetwork(Networks.MUMBAI, RPC_MUMBAI || "");

    for (const name in graphConfigs) {
      const config = (graphConfigs as IConfig)[name];
      if (this.isConfigValid(name, config)) {
        this.setupGraphExecution(name, config);
      }
    }

    new DBCleanup();
  }

  /**
   * Creates the necesssary intervals and eventlisteners for the graphs
   *
   * @private
   * @param {string} name
   * @param {IConfigEntry} config
   * @memberof Main
   */
  private setupGraphExecution(name: string, config: IConfigEntry): void {
    for (const schema of config.schemas) {
      if (schema.interval) {
        setInterval(() => {
          this.execGraph(name, schema);
        }, schema.interval);
        this.execGraph(name, schema);
      }

      if (schema.network) {
        if (this.web3Connections.hasOwnProperty(schema.network)) {
          this.web3Connections[schema.network].on("block", (block: number) => {
            this.execGraph(name, schema, { blocknumber: block });
          });
        }
      }
    }
  }

  /**
   * Executes the graph passed in the name, config and variables
   *
   * @private
   * @param {string} name
   * @param {IConfigSchemas} config
   * @param {IGraphqlVariables} [graphqlVariables]
   * @return {*}  {Promise<void>}
   * @memberof Main
   */
  private async execGraph(
    name: string,
    config: IConfigSchemas,
    graphqlVariables?: IGraphqlVariables
  ): Promise<void> {
    this.logger.info(
      `Executing ${name} with variables`,
      JSON.stringify(graphqlVariables)
    );
    let executor = this.executorCache[name];
    if (!executor) {
      executor = new QueryExecutor(name, config);
      this.executorCache[name] = executor;
    }
    const results = await executor.execQueries(graphqlVariables);
    this.pubSub.publishBatch(name, results, config.schema);
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
    if (!config.schemas || config.schemas.length === 0) {
      this.logger.error(`No schemas defined for ${name}`);
      return false;
    }

    for (const schema of config.schemas) {
      if (!schema.interval && !schema.network) {
        this.logger.warn(
          `Invalid schema for ${name}. Interval and networks are missing`
        );
        return false;
      }
      if (!schema.schema) {
        this.logger.warn(`Invalid schema for ${name}. Schema is missing`);
        return false;
      }
    }

    return true;
  }

  /**
   * Creates the connection to the postgres database
   *
   * @private
   * @param {string} [host="127.0.0.1"]
   * @param {string} [username]
   * @param {string} [password]
   * @param {string} [database="graphql-events"]
   * @param {string} [port="5432"]
   * @memberof Main
   */
  private createDBConnection(
    host: string = "127.0.0.1",
    username?: string,
    password?: string,
    database: string = "graphql-events",
    port: string = "5432"
  ): void {
    createConnection({
      type: "postgres",
      host,
      port: parseInt(port),
      username,
      password,
      database,
      entities: [__dirname + "/entities/*.js"],
      synchronize: true,
      logging: false,
    });
  }

  /**
   * Connect to an ws RPC endpoint and caches the connection
   *
   * @private
   * @param {Networks} name
   * @param {string} rpc
   * @return {*}  {void}
   * @memberof Main
   */
  private connectToNetwork(name: Networks, rpc: string): void {
    if (!rpc) {
      this.logger.warn(`No RPC for ${name} defined. Don't connect...`);
      return;
    }
    const web3 = new Web3(name, rpc);
    if (!this.web3Connections) {
      this.web3Connections = {} as Web3Connections;
    }
    this.web3Connections[name] = web3;
  }
}

new Main();
