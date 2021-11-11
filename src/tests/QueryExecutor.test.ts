import { IConfigSchemas } from "../interfaces/Config";
import Logger from "../helpers/Logger";
import { Networks } from "../interfaces/Web3Connections";
import QueryExecutor from "../services/QueryExecutor";
import { IGraphqlVariables } from "../interfaces/GaphqlVariables";
import { graphql } from "graphql";
import { promises as fs, existsSync } from "fs";
import { loadSchema } from "@graphql-tools/load";

jest.mock("../helpers/Logger");
jest.mock("graphql", () => ({
  ...jest.requireActual("graphql"),
  graphql: jest.fn(),
}));
jest.mock("fs", () => {
  return {
    ...jest.requireActual("fs"),
    promises: {
      readFile: jest.fn().mockResolvedValue(""),
      readdir: jest.fn().mockResolvedValue([]),
    },
    existsSync: jest.fn(),
  };
});
jest.mock("@graphql-tools/load", () => ({
  ...jest.requireActual("@graphql-tools/load"),
  loadSchema: jest.fn(),
}));

const config: IConfigSchemas = {
  schema: "schema",
  network: Networks.MAINNET,
  interval: 1000,
  additionalFields: {
    test: "test",
  },
};

describe("QueryExecutor", () => {
  beforeAll(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    let loadSchemaSpy: jest.SpyInstance;

    beforeAll(() => {
      // set to any to access private properties
      loadSchemaSpy = jest
        .spyOn(QueryExecutor.prototype as any, "loadSchema")
        .mockResolvedValue(true);
    });

    afterAll(() => {
      loadSchemaSpy.mockRestore();
    });

    it("should create a logger instance with name", () => {
      // set to any to access private properties
      const queryExecutor = new QueryExecutor("QueryExecutor", config) as any;
      expect(queryExecutor.logger).toBeInstanceOf(Logger);
      expect(Logger).toHaveBeenCalledWith("QueryExecutor");
    });

    it("should set name", () => {
      // set to any to access private properties
      const queryExecutor = new QueryExecutor("QueryExecutor", config) as any;
      expect(queryExecutor.name).toBe("QueryExecutor");
    });

    it("should set config", () => {
      // set to any to access private properties
      const queryExecutor = new QueryExecutor("QueryExecutor", config) as any;
      expect(queryExecutor.config).toBe(config);
    });

    it("should call loadSchema", () => {
      new QueryExecutor("QueryExecutor", config) as any;
      expect(loadSchemaSpy).toHaveBeenCalled();
    });

    it("should call findQueries", () => {
      // set to any to access private properties
      const findQueriesSpy = jest.spyOn(
        QueryExecutor.prototype as any,
        "findQueries"
      );
      new QueryExecutor("QueryExecutor", config) as any;
      expect(findQueriesSpy).toHaveBeenCalled();
      findQueriesSpy.mockRestore();
    });
  });

  describe("execQueries", () => {
    let executeQuerySpy: jest.SpyInstance;
    let handleQueryResultsSpy: jest.SpyInstance;
    let loadSchemaSpy: jest.SpyInstance;
    let queryExecutor: QueryExecutor;

    beforeAll(() => {
      // set to any to access private properties
      executeQuerySpy = jest
        .spyOn(QueryExecutor.prototype as any, "executeQuery")
        .mockResolvedValue({ data: [] });
      handleQueryResultsSpy = jest
        .spyOn(QueryExecutor.prototype as any, "handleQueryResults")
        .mockResolvedValue({});
      loadSchemaSpy = jest
        .spyOn(QueryExecutor.prototype as any, "loadSchema")
        .mockResolvedValue(true);

      queryExecutor = new QueryExecutor("test", config);
      // set to access private properties
      // @ts-ignore
      queryExecutor.queries2Exec = ["test"];
    });

    afterEach(() => {
      executeQuerySpy.mockReset().mockResolvedValue({ data: [] });
      handleQueryResultsSpy.mockReset().mockResolvedValue({});
    });

    afterAll(() => {
      executeQuerySpy.mockRestore();
      handleQueryResultsSpy.mockRestore();
      loadSchemaSpy.mockRestore();
    });

    it("should add lastRun", async () => {
      await queryExecutor.execQueries();

      expect(executeQuerySpy).toHaveBeenCalledTimes(1);
      const variables = executeQuerySpy.mock.calls[0][1] as IGraphqlVariables;
      // set to any to access private properties
      expect(variables.lastRun).toBe((queryExecutor as any).lastSuccessfulRun);
    });

    it("should keep variables", async () => {
      await queryExecutor.execQueries({ blocknumber: 123 });

      expect(executeQuerySpy).toHaveBeenCalledTimes(1);
      const variables = executeQuerySpy.mock.calls[0][1] as IGraphqlVariables;
      // set to any to access private properties
      expect(variables.lastRun).toBe((queryExecutor as any).lastSuccessfulRun);
      expect(variables.blocknumber).toBe(123);
    });

    it("should log error", async () => {
      executeQuerySpy.mockRejectedValueOnce(new Error("test"));
      await queryExecutor.execQueries();

      // set to any to access private properties
      expect((queryExecutor as any).logger.error).toHaveBeenCalledTimes(1);
      expect((queryExecutor as any).logger.error.mock.calls[0][0]).toBe(
        "Failed executing test query with"
      );
    });

    it("should filter out failed queries", async () => {
      // set to access private properties
      // @ts-ignore
      queryExecutor.queries2Exec = ["test", "test", "test"];
      executeQuerySpy
        .mockRejectedValue(new Error("test"))
        .mockResolvedValueOnce({
          data: [],
        })
        .mockRejectedValueOnce(new Error("test"));

      await queryExecutor.execQueries();

      expect(handleQueryResultsSpy).toHaveBeenCalledTimes(1);
      const filteredQueryResults = handleQueryResultsSpy.mock.calls[0][0];
      expect(filteredQueryResults).toHaveLength(1);

      // set to access private properties
      // @ts-ignore
      queryExecutor.queries2Exec = ["test"];
    });

    it("should pass variables to handleQueryResults", async () => {
      await queryExecutor.execQueries({ blocknumber: 123 });

      expect(executeQuerySpy).toHaveBeenCalledTimes(1);
      const variables = handleQueryResultsSpy.mock
        .calls[0][1] as IGraphqlVariables;
      // set to any to access private properties
      expect(variables.lastRun).toBe((queryExecutor as any).lastSuccessfulRun);
      expect(variables.blocknumber).toBe(123);
    });

    it("should update lastSuccessfulRun", async () => {
      const previous = (queryExecutor as any).lastSuccessfulRun;
      executeQuerySpy.mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { data: [] };
      });

      await queryExecutor.execQueries();

      // set to any to access private properties
      expect((queryExecutor as any).lastSuccessfulRun).toBeGreaterThan(
        previous
      );
    });
  });

  describe("executeQuery", () => {
    // set to any to access private properties
    let queryExecutor: any;

    beforeAll(() => {
      queryExecutor = new QueryExecutor("name", config) as any;
    });

    it("should try to read the query file", async () => {
      await queryExecutor.executeQuery("test.graphql", {});
      expect(fs.readFile).toHaveBeenCalledWith(`./queries/name/test.graphql`);
    });

    it("should call graphql", async () => {
      queryExecutor.loadedSchema = "Schema";
      const variables = { test: "test" };
      const query = `query test { test }`;
      const mockedFs = fs.readFile as jest.Mock;
      mockedFs.mockResolvedValueOnce(query);
      await queryExecutor.executeQuery("test.graphql", variables);
      expect(graphql).toBeCalledTimes(1);
      expect(graphql).toBeCalledWith(
        queryExecutor.loadedSchema,
        query,
        undefined,
        undefined,
        variables
      );
    });
  });

  describe("filterFailedPromises", () => {
    it("should filter out failed promises", async () => {
      const promises = [
        Promise.resolve({}),
        Promise.reject(new Error("test")),
        Promise.resolve({}),
      ];
      // set to any to access private properties
      const queryExecutor = new QueryExecutor("name", config) as any;
      const filteredPromises = queryExecutor.filterFailedPromises(
        await Promise.allSettled(promises)
      );
      expect(filteredPromises).toHaveLength(2);
    });

    it("should filter out promises with null", async () => {
      const promises = [
        Promise.resolve({}),
        Promise.reject(null),
        Promise.resolve({}),
      ];
      // set to any to access private properties
      const queryExecutor = new QueryExecutor("name", config) as any;
      const filteredPromises = queryExecutor.filterFailedPromises(
        await Promise.allSettled(promises)
      );
      expect(filteredPromises).toHaveLength(2);
    });
  });

  describe("handleQueryResults", () => {
    // set to any to access private properties
    let queryExecutor: any;
    let execQueriesSpy: jest.SpyInstance;

    beforeAll(() => {
      jest.useFakeTimers("legacy");
      execQueriesSpy = jest.spyOn(
        QueryExecutor.prototype as any,
        "execQueries"
      );
      queryExecutor = new QueryExecutor("name", config) as any;
    });

    afterAll(() => {
      execQueriesSpy.mockRestore();
    });

    it("should log errors", async () => {
      const error = new Error("test");
      const queryResults = [
        {
          errors: [error],
        },
        { data: [] },
        { data: [] },
      ];
      const resultPromise = queryExecutor.handleQueryResults(queryResults);
      jest.advanceTimersToNextTimer();
      resultPromise.then(() => {
        expect(queryExecutor.logger.warn).toHaveBeenCalledTimes(1);
      });
    });

    it("should retry after 5 seconds", async () => {
      const error = new Error("test");
      const queryResults = [
        {
          errors: [error],
        },
        { data: [] },
        { data: [] },
      ];
      queryExecutor.handleQueryResults(queryResults);
      setTimeout(() => {
        expect(queryExecutor.execQueries).toHaveBeenCalledTimes(0);
      }, 1500);

      setTimeout(() => {
        expect(queryExecutor.execQueries).toHaveBeenCalledTimes(0);
      }, 5500);
      expect(queryExecutor.execQueries).toHaveBeenCalledTimes(0);
      jest.advanceTimersByTime(2000);
      jest.advanceTimersByTime(5500);
    });
  });

  describe("findQueries", () => {
    it("should check if the folder exists", () => {
      new QueryExecutor("name", config) as any;
      expect(existsSync).toHaveBeenCalledTimes(1);
    });

    it("should log if folder doesn't exist", () => {
      const existsSyncMock = existsSync as jest.Mock;
      existsSyncMock.mockReturnValueOnce(false);
      const queryExecutor = new QueryExecutor("name", config) as any;
      expect(queryExecutor.logger.warn).toHaveBeenCalledTimes(1);
    });

    it("should store the read directory to queries2Exec", () => {
      const queryFiles = ["test.graphql", "test2.graphql"];
      const existsSyncMock = existsSync as jest.Mock;
      existsSyncMock.mockReturnValueOnce(true);
      const readdirMock = fs.readdir as jest.Mock;
      readdirMock.mockReturnValueOnce(queryFiles);

      const queryExecutor = new QueryExecutor("name", config) as any;
      setTimeout(() => {
        expect(queryExecutor.queries2Exec).toHaveLength(2);
        expect(queryExecutor.queries2Exec).toBe(queryFiles);
      }, 500);
    });
  });
});
