import { ExecutionResult, graphql, GraphQLSchema } from "graphql";
import { IConfigSchemas } from "../interfaces/Config";
import { loadSchema } from "@graphql-tools/load";
import { UrlLoader } from "@graphql-tools/url-loader";
import { promises as fs, existsSync } from "fs";
import Logger from "../helpers/Logger";
import { IGraphqlVariables } from "../interfaces/GaphqlVariables";

/**
 * Service to run all queries and return the result
 *
 * @export
 * @class QueryExecutor
 */
export default class QueryExecutor {
  private name: string;
  private config: IConfigSchemas;
  private queries2Exec: string[] = [];
  private loadedSchema!: GraphQLSchema;
  private isLoadingSchema: Promise<void>;
  private logger: Logger;
  private lastSuccessfulRun = Math.round(new Date().getTime() / 1000);

  constructor(name: string, config: IConfigSchemas) {
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
   * @param {IGraphqlVariables} [variables]
   * @return {*}  {Promise<Object[]>}
   * @memberof QueryExecutor
   */
  public execQueries(variables?: IGraphqlVariables): Promise<Object[]> {
    return new Promise(async (resolve, reject) => {
      if (!variables) {
        variables = {};
      }
      if (!variables.lastRun) {
        variables.lastRun = this.lastSuccessfulRun;
      }

      await this.isLoadingSchema;
      const graphqlPromises: Array<Promise<ExecutionResult>> = [];
      for (const query of this.queries2Exec) {
        const queryPromise = this.executeQuery(query, variables);
        queryPromise
          .then(() => {
            this.logger.debug(`${query} executed successfully`);
          })
          .catch((e) => {
            this.logger.error(`Failed executing ${query} query with`, e);
          });
        graphqlPromises.push(queryPromise);
      }

      const filtered = this.filterFailedPromises(
        await Promise.allSettled(graphqlPromises)
      );
      resolve(await this.handleQueryResults(filtered, variables));
      const timestamp = Math.round(new Date().getTime() / 1000);
      if (this.lastSuccessfulRun < timestamp) {
        this.lastSuccessfulRun = timestamp;
      }
    });
  }

  /**
   * Executes the query and returns the result
   *
   * @private
   * @param {string} query
   * @param {IGraphqlVariables} variables
   * @return {*}  {Promise<ExecutionResult>}
   * @memberof QueryExecutor
   */
  private async executeQuery(
    query: string,
    variables: IGraphqlVariables
  ): Promise<ExecutionResult> {
    this.logger.debug(
      `Executing ${query} query wit variables`,
      JSON.stringify(variables)
    );
    const queries = (
      await fs.readFile(`./queries/${this.name}/${query}`)
    ).toString();
    const queryPromise = graphql(
      this.loadedSchema,
      queries,
      undefined,
      undefined,
      variables
    );
    return queryPromise;
  }

  /**
   * Returns only fulfilled promises with results not null
   *
   * @private
   * @param {PromiseSettledResult<ExecutionResult>[]} promises
   * @return {*}  {ExecutionResult[]}
   * @memberof QueryExecutor
   */
  private filterFailedPromises(
    promises: PromiseSettledResult<ExecutionResult>[]
  ): ExecutionResult[] {
    return promises
      .filter((promise) => promise.status === "fulfilled")
      .filter(
        (result) =>
          (result as PromiseFulfilledResult<ExecutionResult>).value !== null
      )
      .map(
        (result) => (result as PromiseFulfilledResult<ExecutionResult>).value
      );
  }

  /**
   * Helper function to handle the query results
   * and retries the queries if one failed
   *
   * @private
   * @param {ExecutionResult[]} results
   * @param {IGraphqlVariables} variables
   * @return {*}  {Promise<Object[]>}
   * @memberof QueryExecutor
   */
  private async handleQueryResults(
    results: ExecutionResult[],
    variables: IGraphqlVariables
  ): Promise<Object[]> {
    for (const result of results) {
      if (result.errors && result.errors.length > 0) {
        this.logger.warn(
          `Errors from API received. retrying in 5secs, Errors: `,
          JSON.stringify(result.errors)
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
        this.logger.debug(`Retrying with variables`, JSON.stringify(variables));
        const retryResults = await this.execQueries(variables);
        return retryResults;
      }
    }
    return results.map((result) => result.data as Object);
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
