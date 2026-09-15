# SMS Simulator

A lightweight SMS gateway simulator for development and integration testing.

## Features
- GET endpoint: `/sms/send?AppName=MO626&MSISDN=265998866442&SMS=<text>`
- POST JSON endpoint
- Real-time inbox updates with SSE
- Search by AppName, MSISDN, or message
- Multiline SMS rendering
- CSV/JSON export
- Clear inbox
- SQLite persistence
- Configurable retention and message limit
- Single Docker container

## Docker

```bash
docker compose up -d --build
```

Open `http://localhost:8080`.

## Test

```bash
curl "http://localhost:8080/sms/send?AppName=MO626&MSISDN=265998866442&SMS=Payment%20successful.%0AAmount%3A%20MWK%2050%2C000"
```

POST alternative:

```bash
curl -X POST http://localhost:8080/sms/send \
  -H "Content-Type: application/json" \
  -d '{"appName":"MO626","msisdn":"265998866442","sms":"Line one\nLine two"}'
```

## Configuration

Environment variables:
- `SERVER_PORT` default `8080`
- `SMS_RETENTION_ENABLED` default `true`
- `SMS_RETENTION_DAYS` default `1`
- `SMS_MAX_MESSAGES` default `10000`
- `SMS_DATA_DIR` default `/data`
