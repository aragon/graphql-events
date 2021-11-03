import { ethers } from "ethers";
import Logger from "../helpers/Logger";
import Web3 from "../services/Web3";

jest.mock("../helpers/Logger");
jest.mock("ethers");

describe("Web3", () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    let subscribeToNewBlockSpy: jest.SpyInstance;

    beforeAll(() => {
      // set to any because it is a private function
      subscribeToNewBlockSpy = jest.spyOn(
        Web3.prototype as any,
        "subscribeToNewBlock"
      );
    });

    afterAll(() => {
      subscribeToNewBlockSpy.mockRestore();
    });

    it("should create a Logger on creation", () => {
      new Web3("test", "endpoint");
      expect(Logger).toHaveBeenCalledTimes(1);
      expect(Logger).toHaveBeenCalledWith("test");
    });

    it("should create a new websocket provider", () => {
      new Web3("test", "endpoint");
      expect(ethers.providers.WebSocketProvider).toHaveBeenCalledTimes(1);
      expect(ethers.providers.WebSocketProvider).toHaveBeenCalledWith(
        "endpoint"
      );
    });

    it("should call subscribeToNewBlock", () => {
      new Web3("test", "endpoint");
      expect(subscribeToNewBlockSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("subscribeToNewBlock", () => {
    let onSpy: jest.SpyInstance;

    beforeAll(() => {
      onSpy = jest.spyOn(ethers.providers.WebSocketProvider.prototype, "on");
    });

    afterAll(() => {
      onSpy.mockRestore();
    });

    it("should subscribe to new blocks", async () => {
      new Web3("test", "endpoint");
      expect(onSpy).toHaveBeenCalledTimes(1);
      expect(onSpy).toHaveBeenCalledWith("block", expect.any(Function));
    });

    it("should call emit on new block", () => {
      // set to any because it is a private function
      const emitSpy = jest.spyOn(Web3.prototype as any, "emit");
      new Web3("test", "endpoint");
      onSpy.mock.calls[0][1](123);
      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith("block", 123);
      emitSpy.mockRestore();
    });
  });
});
