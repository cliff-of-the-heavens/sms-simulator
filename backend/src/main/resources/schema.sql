CREATE TABLE IF NOT EXISTS sms_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_name VARCHAR(100) NOT NULL,
    msisdn VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    received_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sms_app_name ON sms_messages(app_name);
CREATE INDEX IF NOT EXISTS idx_sms_msisdn ON sms_messages(msisdn);
CREATE INDEX IF NOT EXISTS idx_sms_received_at ON sms_messages(received_at);
