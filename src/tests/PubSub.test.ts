import "../entities/MessagesSent";
import PubSub from "../services/PubSub";
import Logger from "../helpers/Logger";
import typeorm from "typeorm";
import { MessagesSent } from "../entities/MessagesSent";
import crypto from "crypto";

jest.mock("@google-cloud/pubsub", () => {
  return {
    PubSub: jest.fn(() => {
      return {
        topic: jest.fn(() => {
          return {
            publishJSON: jest.fn(() => {}),
          };
        }),
      };
    }),
    Topic: jest.fn(() => {
      return {
        publishJSON: jest.fn(() => {}),
      };
    }),
  };
});
jest.mock("../helpers/Logger");
jest.mock("typeorm", () => {
  const actual = jest.requireActual("typeorm");
  return {
    ...actual,
    getManager: jest.fn().mockReturnValue({
      getRepository: jest.fn().mockReturnValue({
        save: jest.fn().mockReturnValue([]),
        findOne: jest.fn().mockReturnValue({}),
      }),
    }),
  };
});
jest.mock("crypto", () => {
  return {
    createHmac: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        digest: jest.fn().mockReturnValue(""),
      }),
    }),
  };
});

describe("PubSub", () => {
  it("should create a Logger on creation", () => {
    new PubSub("test");
    expect(Logger).toHaveBeenCalledTimes(1);
    expect(Logger).toHaveBeenCalledWith("PubSub/test");
  });

  it("should call publish for each message", () => {
    const publishSpy = jest
      .spyOn(PubSub.prototype, "publish")
      .mockResolvedValue();
    const messages = [{ test: "test" }, { test: "test2" }];
    const pubSub = new PubSub("test");
    pubSub.publishBatch("test", messages, {
      schema: "testURI",
      interval: 60000,
    });
    expect(publishSpy).toHaveBeenCalledTimes(2);
    expect(publishSpy).toHaveBeenNthCalledWith(1, "test", messages[0], {
      schema: "testURI",
      interval: 60000,
    });
    expect(publishSpy).toHaveBeenNthCalledWith(2, "test", messages[1], {
      schema: "testURI",
      interval: 60000,
    });
    publishSpy.mockRestore();
  });

  it("should create a sha256 hash", () => {
    const pubSub = new PubSub("test");
    // set to any because it is a private function
    (pubSub as any).hashData("test");
    expect(crypto.createHmac).toHaveBeenNthCalledWith(1, "sha256", "secret");
    expect(crypto.createHmac).toHaveBeenCalledTimes(1);

    const hmac = crypto.createHmac("sha256", "secret");
    expect(hmac.update).toHaveBeenNthCalledWith(1, JSON.stringify("test"));
    expect(hmac.update).toHaveBeenCalledTimes(1);

    const update = hmac.update(JSON.stringify("test"));
    expect(update.digest).toHaveBeenNthCalledWith(1, "hex");
    expect(update.digest).toHaveBeenCalledTimes(1);
  });

  describe("publish", () => {
    // set to any because it is a private function
    let isNewSpy: jest.SpyInstance;
    let hashDataSpy: jest.SpyInstance;

    beforeAll(() => {
      // set to any because it is a private function
      isNewSpy = jest.spyOn(PubSub.prototype as any, "isNew");
      hashDataSpy = jest.spyOn(PubSub.prototype as any, "hashData");
    });

    afterEach(() => {
      isNewSpy.mockReset();
      hashDataSpy.mockReset();
    });

    afterAll(() => {
      isNewSpy.mockRestore();
      hashDataSpy.mockRestore();
    });

    it("should call isNew", async () => {
      isNewSpy.mockResolvedValueOnce(false);
      const pubSub = new PubSub("test");
      await pubSub.publish(
        "test",
        { test: "test" },
        {
          schema:
            "https://api.thegraph.com/subgraphs/name/aragon/aragon-govern-rinkeby",
          interval: 60000,
          additionalFields: {
            network: "rinkeby",
          },
        }
      );
      expect(isNewSpy).toHaveBeenCalledTimes(1);
      expect(isNewSpy).toHaveBeenCalledWith({ test: "test" }, "test");
    });

    it("should do nothing if the message isn't new", async () => {
      isNewSpy.mockResolvedValueOnce(false);
      const pubSub = new PubSub("test");
      await pubSub.publish(
        "test",
        { test: "test" },
        {
          schema:
            "https://api.thegraph.com/subgraphs/name/aragon/aragon-govern-rinkeby",
          interval: 60000,
          additionalFields: {
            network: "rinkeby",
          },
        }
      );
      expect(isNewSpy).toHaveBeenCalledTimes(1);
      expect(isNewSpy).toHaveBeenCalledWith({ test: "test" }, "test");
      expect((pubSub as any).client.publishJSON).not.toHaveBeenCalled();
    });

    it("should save MessagesSent", async () => {
      isNewSpy.mockResolvedValueOnce(true);
      const pubSub = new PubSub("test");
      await pubSub.publish(
        "test",
        { test: "test" },
        {
          schema:
            "https://api.thegraph.com/subgraphs/name/aragon/aragon-govern-rinkeby",
          interval: 60000,
          additionalFields: {
            network: "rinkeby",
          },
        }
      );
      expect(typeorm.getManager).toHaveBeenCalledTimes(1);
      expect(typeorm.getManager().getRepository).toHaveBeenCalledTimes(1);
      expect(typeorm.getManager().getRepository).toHaveBeenCalledWith(
        MessagesSent
      );
      expect(
        typeorm.getManager().getRepository(MessagesSent).save
      ).toHaveBeenCalledTimes(1);
    });

    it("should do send the message to Pub/Sub", async () => {
      isNewSpy.mockResolvedValueOnce(true);
      const pubSub = new PubSub("test");
      await pubSub.publish(
        "test",
        { test: "test" },
        {
          schema:
            "https://api.thegraph.com/subgraphs/name/aragon/aragon-govern-rinkeby",
          interval: 60000,
          additionalFields: {
            network: "rinkeby",
          },
        }
      );
      expect((pubSub as any).client.publishJSON).toHaveBeenCalledTimes(1);
      expect((pubSub as any).client.publishJSON).toHaveBeenNthCalledWith(1, {
        source: "graphql-events",
        type: "test",
        additionalFields: {
          network: "rinkeby",
        },
        message: { test: "test" },
      });
    });
  });

  describe("isNew", () => {
    it("should return false if no message is given", async () => {
      // set to any because isNew is a private function
      const pubSub = new PubSub("test") as any;
      expect(await pubSub.isNew(undefined, "test")).toBe(false);
    });

    it("should call hashData", async () => {
      // set to any because isNew is a private function
      const pubSub = new PubSub("test") as any;
      pubSub.hashData = jest.fn();
      await pubSub.isNew({ test: "test" }, "test");
      expect(pubSub.hashData).toBeCalledTimes(1);
      expect(pubSub.hashData).toBeCalledWith({ test: "test" });
    });

    it("should return true", async () => {
      (
        typeorm.getManager().getRepository(MessagesSent).findOne as jest.Mock
      ).mockResolvedValueOnce(undefined);
      const pubSub = new PubSub("test") as any;
      expect(pubSub.isNew({ test: "test" }, "test")).resolves.toBe(true);
    });

    it("should return false", async () => {
      const pubSub = new PubSub("test") as any;
      expect(pubSub.isNew({ test: "test" }, "test")).resolves.toBe(false);
    });
  });
});
