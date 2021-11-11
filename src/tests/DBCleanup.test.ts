import typeorm, { LessThan } from "typeorm";
import { MessagesSent } from "../entities/MessagesSent";
import DBCleanup from "../services/DBCleanup";

jest.mock("typeorm", () => {
  const actual = jest.requireActual("typeorm");
  return {
    ...actual,
    getManager: jest.fn().mockReturnValue({
      getRepository: jest.fn().mockReturnValue({
        delete: jest.fn().mockResolvedValue({}),
      }),
    }),
  };
});
describe("DBCleanup", () => {
  describe("constructor", () => {
    let cleanUpSpy: jest.SpyInstance;

    beforeAll(() => {
      // set to any because it is a private function
      cleanUpSpy = jest
        .spyOn(DBCleanup.prototype as any, "cleanUp")
        .mockRejectedValue({});
    });

    afterAll(() => {
      cleanUpSpy.mockRestore();
    });

    it("should create an interval", () => {
      const dbCleanup = new DBCleanup();
      expect(setInterval).toBeCalledTimes(1);
      dbCleanup.destroy();
    });

    it("should call cleanUp after the interval", () => {
      const dbCleanup = new DBCleanup();
      cleanUpSpy.mockResolvedValueOnce({});

      // ignore typescript erros because interval is a private property
      // @ts-ignore
      jest.advanceTimersByTime(dbCleanup.interval);
      expect(cleanUpSpy).toBeCalledTimes(1);
    });
  });

  describe("cleanUp", () => {
    // set as any to access private functions and properties
    let dbCleanup: any;

    beforeAll(() => {
      dbCleanup = new DBCleanup();
    });

    afterAll(() => {
      dbCleanup.destroy();
    });

    it("should delete old messages", async () => {
      jest
        .useFakeTimers("modern")
        .setSystemTime(new Date("2020-01-01").getTime());

      await dbCleanup.cleanUp();

      expect(typeorm.getManager().getRepository).toBeCalledTimes(1);
      expect(typeorm.getManager().getRepository).toHaveBeenNthCalledWith(
        1,
        MessagesSent
      );
      expect(
        typeorm.getManager().getRepository(MessagesSent).delete
      ).toBeCalledTimes(1);
      expect(
        typeorm.getManager().getRepository(MessagesSent).delete
      ).toHaveBeenNthCalledWith(1, {
        createdAt: LessThan(
          new Date(new Date("2020-01-01").getTime() - dbCleanup.keepUntil)
        ),
      });

      jest.useFakeTimers("legacy");
    });
  });
});
