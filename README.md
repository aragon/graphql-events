# Graphql Events
## Introduction
This service is used to query graphql APIs and publish the results into Googles Pub/Sub

## Configuratin
The configuration is done in the `src/configs/graphs.json` file.
The structure of the json enforces a unique name for each subgraph to query

| Field | Description |
| --- | --- |
| key | The name used internally and as type in the pub/sub message |
| schema | URL to the graphql API (introspection has to be enabled) |
| interval | Interval in which the API has to be queried in ms |

Example config for a :
```json
{
  "Court-Rinkeby": {
    "schema": "https://api.thegraph.com/subgraphs/name/aragon/aragon-court-rinkeby",
    "interval": 60000
  }
}
```

## Queries
The queries can be stored in the queries folder.
The folder structure is the following:
queries -> (The name set as key in the config.json) -> .graphql

You can add multiple queries per API and all of them will be executed in the defined interval on a best effort basis.

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