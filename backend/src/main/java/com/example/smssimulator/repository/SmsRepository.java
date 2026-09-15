package com.example.smssimulator.repository;

import com.example.smssimulator.model.SmsMessage;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

@Repository
public class SmsRepository {
    private final JdbcTemplate jdbc;

    public SmsRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public SmsMessage save(String appName, String msisdn, String message, Instant receivedAt) {
        jdbc.update(
            "INSERT INTO sms_messages(app_name, msisdn, message, received_at) VALUES (?, ?, ?, ?)",
            appName, msisdn, message, Timestamp.from(receivedAt)
        );
        Long id = jdbc.queryForObject("SELECT last_insert_rowid()", Long.class);
        return new SmsMessage(id, appName, msisdn, message, receivedAt);
    }

    public List<SmsMessage> find(String search, String appName, String msisdn, int limit) {
        StringBuilder sql = new StringBuilder("""
            SELECT id, app_name, msisdn, message, received_at
            FROM sms_messages WHERE 1=1
            """);
        java.util.ArrayList<Object> params = new java.util.ArrayList<>();

        if (search != null && !search.isBlank()) {
            sql.append(" AND (LOWER(app_name) LIKE ? OR msisdn LIKE ? OR LOWER(message) LIKE ?)");
            String s = "%" + search.toLowerCase() + "%";
            params.add(s); params.add("%" + search + "%"); params.add(s);
        }
        if (appName != null && !appName.isBlank()) {
            sql.append(" AND LOWER(app_name) LIKE ?");
            params.add("%" + appName.toLowerCase() + "%");
        }
        if (msisdn != null && !msisdn.isBlank()) {
            sql.append(" AND msisdn LIKE ?");
            params.add("%" + msisdn + "%");
        }

        sql.append(" ORDER BY received_at DESC LIMIT ").append(Math.max(1, Math.min(limit, 5000)));

        return jdbc.query(sql.toString(), params.toArray(), (rs, n) ->
            new SmsMessage(
                rs.getLong("id"),
                rs.getString("app_name"),
                rs.getString("msisdn"),
                rs.getString("message"),
                rs.getTimestamp("received_at").toInstant()
            )
        );
    }

    public long count() {
        Long v = jdbc.queryForObject("SELECT COUNT(*) FROM sms_messages", Long.class);
        return v == null ? 0 : v;
    }

    public long applicationCount() {
        Long v = jdbc.queryForObject("SELECT COUNT(DISTINCT app_name) FROM sms_messages", Long.class);
        return v == null ? 0 : v;
    }

    public long recipientCount() {
        Long v = jdbc.queryForObject("SELECT COUNT(DISTINCT msisdn) FROM sms_messages", Long.class);
        return v == null ? 0 : v;
    }

    public List<SmsMessage> allForExport() {
        return find(null, null, null, 5000);
    }

    public void clear() {
        jdbc.update("DELETE FROM sms_messages");
        jdbc.update("DELETE FROM sqlite_sequence WHERE name = 'sms_messages'");
    }

    public void deleteOlderThan(Instant cutoff) {
        jdbc.update("DELETE FROM sms_messages WHERE received_at < ?", Timestamp.from(cutoff));
    }

    public void trimTo(int maxMessages) {
        jdbc.update("""
            DELETE FROM sms_messages
            WHERE id NOT IN (
                SELECT id FROM sms_messages ORDER BY received_at DESC LIMIT ?
            )
            """, maxMessages);
    }
}
