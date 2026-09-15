package com.example.smssimulator.service;

import com.example.smssimulator.model.SmsMessage;
import com.example.smssimulator.model.SmsResponse;
import com.example.smssimulator.repository.SmsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class SmsService {
    private final SmsRepository repository;
    private final SmsEventPublisher publisher;

    @Value("${sms.retention.enabled:true}") private boolean retentionEnabled;
    @Value("${sms.retention.days:1}") private int retentionDays;
    @Value("${sms.max-messages:10000}") private int maxMessages;

    public SmsService(SmsRepository repository, SmsEventPublisher publisher) {
        this.repository = repository;
        this.publisher = publisher;
    }

    public SmsResponse receive(String appName, String msisdn, String message) {
        SmsMessage sms = repository.save(appName.trim(), msisdn.trim(), message, Instant.now());
        repository.trimTo(maxMessages);
        publisher.publish(sms);
        return new SmsResponse(true, sms.id(), sms.receivedAt());
    }

    public List<SmsMessage> find(String search, String appName, String msisdn, int limit) {
        return repository.find(search, appName, msisdn, limit);
    }

    public long count() { return repository.count(); }
    public long applicationCount() { return repository.applicationCount(); }
    public long recipientCount() { return repository.recipientCount(); }
    public List<SmsMessage> export() { return repository.allForExport(); }

    public void clear() {
        repository.clear();
        publisher.publishClear();
    }

    @Scheduled(fixedDelay = 3600000)
    public void cleanup() {
        if (!retentionEnabled) return;
        repository.deleteOlderThan(Instant.now().minus(retentionDays, ChronoUnit.DAYS));
        repository.trimTo(maxMessages);
    }
}
