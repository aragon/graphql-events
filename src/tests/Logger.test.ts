import Logger from "../helpers/Logger";

describe("Logger", () => {
  describe("Testing filtering", () => {
    let logSpy: jest.SpyInstance;

    beforeAll(() => {
      process.env.LOG_LEVEL = "WARN";
      logSpy = jest.spyOn(console, "log");
    });

    afterEach(() => {
      logSpy.mockClear();
    });

    afterAll(() => {
      process.env.LOG_LEVEL = "";
      logSpy.mockRestore();
    });

    it("should show the message", () => {
      const logger = new Logger("Test");
      logger.error("Hello World");

      expect(logSpy).toBeCalledTimes(1);
      expect(logSpy).toBeCalledWith("Hello World");
    });

    it("should not show the message", () => {
      const logger = new Logger("Test");
      logger.info("Hello World");

      expect(logSpy).toBeCalledTimes(0);
    });
  });

  describe("Testing messages", () => {
    let logSpy: jest.SpyInstance;

    beforeAll(() => {
      process.env.LOG_LEVEL = "DEBUG";
      logSpy = jest.spyOn(console, "log");
    });

    afterEach(() => {
      logSpy.mockClear();
    });

    afterAll(() => {
      process.env.LOG_LEVEL = "";
      logSpy.mockRestore();
    });

    it("should log a debug message", () => {
      const logger = new Logger("Test");
      logger.debug("Hello World");

      expect(logSpy).toBeCalledTimes(1);
      expect(logSpy.mock.calls[0].join("")).toContain("[DEBUG]");
      expect(logSpy.mock.calls[0].join("")).toContain("[Test]");
      expect(logSpy.mock.calls[0].join("")).toContain("Hello World");
    });
    it("should log a info message", () => {
      const logSpy = jest.spyOn(console, "log");
      const logger = new Logger("Test");
      logger.info("Hello World");

      expect(logSpy).toBeCalledTimes(1);
      expect(logSpy.mock.calls[0].join("")).toContain("[INFO]");
      expect(logSpy.mock.calls[0].join("")).toContain("[Test]");
      expect(logSpy.mock.calls[0].join("")).toContain("Hello World");
    });
    it("should log a warn message", () => {
      const logSpy = jest.spyOn(console, "log");
      const logger = new Logger("Test");
      logger.warn("Hello World");

      expect(logSpy).toBeCalledTimes(1);
      expect(logSpy.mock.calls[0].join("")).toContain("[WARN]");
      expect(logSpy.mock.calls[0].join("")).toContain("[Test]");
      expect(logSpy.mock.calls[0].join("")).toContain("Hello World");
    });
    it("should log a error message", () => {
      const logSpy = jest.spyOn(console, "log");
      const logger = new Logger("Test");
      logger.error("Hello World");

      expect(logSpy).toBeCalledTimes(1);
      expect(logSpy.mock.calls[0].join("")).toContain("[ERROR]");
      expect(logSpy.mock.calls[0].join("")).toContain("[Test]");
      expect(logSpy.mock.calls[0].join("")).toContain("Hello World");
    });
  });
});
