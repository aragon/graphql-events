import { Networks } from "./Web3Connections";

export interface IConfigEntry {
  schemas: IConfigSchemas[];
}

export interface IConfig {
  [index: string]: IConfigEntry;
}

export interface IConfigSchemas {
  schema: string;
  network?: Networks;
  interval?: number;
}
