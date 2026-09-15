package com.example.smssimulator.model;

import java.time.Instant;

public record SmsResponse(boolean success, long messageId, Instant receivedAt) {}
