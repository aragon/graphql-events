import Web3 from "../services/Web3";

export enum Networks {
  MAINNET = 'mainnet',
  RINKEBY = 'rinkeby',
  POLYGON = 'polygon',
  MUMBAI = 'mumbai',
}

export type Web3Connections = {
  [key in Networks]: Web3;
}