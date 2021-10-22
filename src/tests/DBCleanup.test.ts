import DBCleanup from "../services/DBCleanup";

describe("DBCleanup", () => {
  let cleanUpSpy: jest.SpyInstance;

  beforeAll(() => {
    // set to any because it is a private function
    cleanUpSpy = jest
      .spyOn(DBCleanup.prototype as any, "cleanUp")
      .mockImplementation(async () => {});
    jest.useFakeTimers("legacy");
  });

  afterEach(() => {
    jest.useFakeTimers("legacy");
    jest.resetAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
    cleanUpSpy.mockRestore();
  });

  it("should create an interval", () => {
    new DBCleanup();
    expect(setInterval).toBeCalledTimes(1);
  });

  it("should call cleanUp after the interval", () => {
    const dbCleanup = new DBCleanup();

    // ignore typescript erros because interval is a private property
    // @ts-ignore
    jest.advanceTimersByTime(dbCleanup.interval + 10);
    expect(cleanUpSpy).toBeCalledTimes(1);
  });
});
