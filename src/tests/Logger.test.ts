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
      // with modern timers we can fake the time
      jest
        .useFakeTimers("modern")
        .setSystemTime(new Date("2020-01-01").getTime());

      const logger = new Logger("Test");
      logger.error("Hello World");

      expect(logSpy).toBeCalledTimes(1);
      expect(logSpy).toHaveBeenNthCalledWith(
        1,
        `[${new Date("2020-01-01").toISOString()}] [ERROR] [Test]`,
        "Hello World"
      );

      jest.useFakeTimers("legacy");
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
      jest
        .useFakeTimers("modern")
        .setSystemTime(new Date("2020-01-01").getTime());

      const logger = new Logger("Test");
      logger.debug("Hello World");

      expect(logSpy).toBeCalledTimes(1);
      expect(logSpy).toHaveBeenNthCalledWith(
        1,
        `[${new Date("2020-01-01").toISOString()}] [DEBUG] [Test]`,
        "Hello World"
      );

      jest.useFakeTimers("legacy");
    });
    it("should log a info message", () => {
      jest
        .useFakeTimers("modern")
        .setSystemTime(new Date("2020-01-01").getTime());

      const logger = new Logger("Test");
      logger.info("Hello World");

      expect(logSpy).toBeCalledTimes(1);
      expect(logSpy).toHaveBeenNthCalledWith(
        1,
        `[${new Date("2020-01-01").toISOString()}] [INFO] [Test]`,
        "Hello World"
      );

      jest.useFakeTimers("legacy");
    });
    it("should log a warn message", () => {
      jest
        .useFakeTimers("modern")
        .setSystemTime(new Date("2020-01-01").getTime());

      const logger = new Logger("Test");
      logger.warn("Hello World");

      expect(logSpy).toBeCalledTimes(1);
      expect(logSpy).toHaveBeenNthCalledWith(
        1,
        `[${new Date("2020-01-01").toISOString()}] [WARN] [Test]`,
        "Hello World"
      );

      jest.useFakeTimers("legacy");
    });
    it("should log a error message", () => {
      jest
        .useFakeTimers("modern")
        .setSystemTime(new Date("2020-01-01").getTime());

      const logger = new Logger("Test");
      logger.error("Hello World");

      expect(logSpy).toBeCalledTimes(1);
      expect(logSpy).toHaveBeenNthCalledWith(
        1,
        `[${new Date("2020-01-01").toISOString()}] [ERROR] [Test]`,
        "Hello World"
      );

      jest.useFakeTimers("legacy");
    });
  });
});
