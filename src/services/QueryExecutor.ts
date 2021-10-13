import { ExecutionResult, graphql, GraphQLSchema } from "graphql";
import { IConfigEntry } from "../interfaces/Config";
import { loadSchema } from "@graphql-tools/load";
import { UrlLoader } from "@graphql-tools/url-loader";
import { promises as fs, existsSync } from "fs";
import Logger from "../helpers/Logger";


/**
 * Service to run all queries and return the result
 *
 * @export
 * @class QueryExecutor
 */
export default class QueryExecutor {
  private name: string;
  private config: IConfigEntry;
  private queries2Exec: string[] = [];
  private loadedSchema!: GraphQLSchema;
  private isLoadingSchema: Promise<void>;
  private logger: Logger;

  constructor(name: string, config: IConfigEntry) {
    this.logger = new Logger(name);
    this.name = name;
    this.config = config;
    this.isLoadingSchema = this.loadSchema();
    this.findQueries();
  }

  /**
   * Executes the queries found in the queries directory
   * and returns the result
   *
   * @return {Promise<ExecutionResult[]>}
   * @memberof QueryExecutor
   */
  public async execQueries(): Promise<ExecutionResult[]> {
    await this.isLoadingSchema;
    const graphqlPromises: Array<Promise<ExecutionResult>> = [];
    for (const query of this.queries2Exec) {
      this.logger.debug(`Executing ${query} query`);
      const queries = (
        await fs.readFile(`./queries/${this.name}/${query}`)
      ).toString();
      const queryPromise = graphql(this.loadedSchema, queries);
      queryPromise
        .then(() => {
          this.logger.debug(`${query} executed successfully`);
        })
        .catch((e) => {
          this.logger.error(`Failed executing ${query} query with`, e);
        });
      graphqlPromises.push(queryPromise);
    }
    const results = Promise.all(graphqlPromises);
    return results;
  }

  /**
   * Helper function to load the external schema
   *
   * @private
   * @memberof QueryExecutor
   */
  private async loadSchema() {
    this.logger.debug(`Loading schema from ${this.config.schema}`);
    this.loadedSchema = await loadSchema(this.config.schema, {
      loaders: [new UrlLoader()],
    });
    this.logger.debug(`Schema loaded`);
  }

  /**
   * Helper function to search for the queries in the queries folder
   *
   * @private
   * @memberof QueryExecutor
   */
  private async findQueries() {
    if (!existsSync(`./queries/${this.name}`)) {
      this.logger.warn(`No queries defined for ${this.name}`);
      return;
    }

    this.logger.debug(`Searching for queries`);
    this.queries2Exec = await fs.readdir(`./queries/${this.name}`);
    this.logger.debug(`Found ${this.queries2Exec.length} queries`);
  }
}
