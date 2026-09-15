package com.example.smssimulator.model;

import jakarta.validation.constraints.NotBlank;

public record SmsRequest(
    @NotBlank String appName,
    @NotBlank String msisdn,
    @NotBlank String sms
) {}
