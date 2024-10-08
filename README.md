# rush hour

## prerequistise

- node
  - nestjs
- yarn (or npm, etc)
- docker

## repo layout

- *.yaml - docker compose yaml
- apps/api - rest API
- apps/solver - backend solver
- apps/janitor - cronjob to cleanup stuff (nothing to do yet as the game state has expiry set in redis)

## db migration

[go-migrate](https://github.com/golang-migrate/migrate)

create next sequence migration .sql, last parameter is the file name
```bash
migrate create -ext sql -seq -digits 5 -dir db/migration rush_hour
```

apply the migration
```bash
# set network to correct one
docker run -v ./db/migration:/migration --network host migrate/migrate -path=/migration/ -database postgres://127.0.0.1:5432/rush_hour\?user=rush\&password=hour\&sslmode=disable up
```

## api

game state is stored in redis
- key=`game:` + _ulid_
- value
  ```json
  {
    "boardId": "..."
  }
  ```

### openapi doc

Generated by nestjs:swagger
- /docs for viewing in browser
- /docs/json and /docs/yaml for corresponding swagger.json and swagger.yaml

> REMINDER: yarn run generate:api:metadata after you have updated dtos OR watch the changes

## e2e testing

install browser, e.g. chromium
```bash
$(cd automated_test && yarn playwright install chromium)
```

to run e2e tests
```bash
yarn run test:e2e

# or run in automated_test folder 
cd automated_test
yarn playwright test
```

## handy UIs

- [redis ui](http://localhost:9379)
- [postgres ui](http://localhost:9432) _only if you have uncommented the pgadmin in [infra.yaml](./infra.yaml)
  - connects to `localhost:5432`
- [kafka ui](http://localhost:9992)
  - connects to `kafka:9094`

## known issue

- [connecting to kafka is taking too long...](https://github.com/tulios/kafkajs/issues/807)
