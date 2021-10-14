# Graphql Events
## Introduction
This service is used to query graphql APIs and publish the results into Googles Pub/Sub

## Configuration
The configuration is done in the `src/configs/graphs.json` file.
The structure of the json enforces a unique name for each subgraph to query.  
Network or interval is required.


| Field | Description |
| --- | --- |
| key | The name used internally and as type in the pub/sub message |
| schema | URL to the graphql API (introspection has to be enabled) |
| interval (optional) | Interval in which the API has to be queried in ms |
| network (optional) | Defines the network to listen on and triggers the query on each new block |

Example config for a :
```json
{
  "new-daos-govern": {
    "schemas": [
      {
        "schema": "https://api.thegraph.com/subgraphs/name/aragon/aragon-govern-rinkeby",
        "interval": 10000
      }
    ]
  }
}
```

## Queries
The queries can be stored in the queries folder.
The folder structure is the following:
queries -> (The name set as key in the config.json) -> .graphql

You can add multiple queries per API and all of them will be executed in the defined interval on a best effort basis.

### Variables
The query executor passed following variables to the queries:
| Name | Type | Description |
| --- | --- | --- |
| $lastRun | BigInt! | Epoch timestamp of the last successful run |
| $blocknumber | Int! | Number of the new block |

## Supported Networks
- ETH Mainnet
- Rinkeby
- Polygon Mainnet
- Mumbai

## Env variabels
| Variable | Possible values | Required | 
| --- | --- | --- |
| LOG_LEVEL | ERROR, WARN, INFO, DEBUG | no (default: ERROR) |
| GOOGLE_APPLICATION_CREDENTIALS | * | yes |
| TOPIC | * | no (default: graphql-events) |
| DB_DATABASE | * | no (default: graphql-events) |
| DB_HOST | * | no (default: 127.0.0.1) |
| DB_USERNAME | * | no (default: user) |
| DB_PASSWORD | * | no (default: password) |
| DB_PORT | * | no (default: 5432) |
| RPC_MAINNET | ws endpoints | no |
| RPC_RINKEBY | ws endpoints | no |
| RPC_POLYGON | ws endpoints | no |
| RPC_MUMBAI | ws endpoints | no |
| CACHE_RETENTION | number in ms | no (default: 604800000 = 7 days) |
