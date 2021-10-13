export interface IConfigEntry {
  schema: string;
  interval: number;
}

export interface IConfig {
  [index: string]: IConfigEntry;
}
