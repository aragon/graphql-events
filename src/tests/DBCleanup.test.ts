import DBCleanup from "../services/DBCleanup";

describe("DBCleanup", () => {
  let cleanUpSpy: jest.SpyInstance;

  beforeAll(() => {
    // set to any because it is a private function
    cleanUpSpy = jest.spyOn(DBCleanup.prototype as any, "cleanUp").mockRejectedValue({});
  });

  afterAll(() => {
    cleanUpSpy.mockRestore();
  });

  it("should create an interval", () => {
    const dbCleanup = new DBCleanup();
    expect(setInterval).toBeCalledTimes(1);
    dbCleanup.destroy()
  });

  it("should call cleanUp after the interval", () => {
    const dbCleanup = new DBCleanup();

    // ignore typescript erros because interval is a private property
    // @ts-ignore
    jest.advanceTimersByTime(dbCleanup.interval);
    expect(cleanUpSpy).toBeCalledTimes(1);
  });
});
