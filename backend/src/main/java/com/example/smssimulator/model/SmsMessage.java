package com.example.smssimulator.model;

import java.time.Instant;

public record SmsMessage(long id, String appName, String msisdn, String message, Instant receivedAt) {}
