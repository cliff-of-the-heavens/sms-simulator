package com.example.smssimulator.controller;

import com.example.smssimulator.model.SmsRequest;
import com.example.smssimulator.model.SmsResponse;
import com.example.smssimulator.service.SmsEventPublisher;
import com.example.smssimulator.service.SmsService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/sms")
public class SmsController {
    private final SmsService service;
    private final SmsEventPublisher publisher;

    public SmsController(SmsService service, SmsEventPublisher publisher) {
        this.service = service;
        this.publisher = publisher;
    }

    @GetMapping("/send")
    public SmsResponse send(
        @RequestParam("AppName") String appName,
        @RequestParam("MSISDN") String msisdn,
        @RequestParam("SMS") String sms
    ) {
        return service.receive(appName, msisdn, sms);
    }

    @PostMapping("/send")
    public SmsResponse sendJson(@Valid @RequestBody SmsRequest request) {
        return service.receive(request.appName(), request.msisdn(), request.sms());
    }

    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter events() {
        return publisher.subscribe();
    }
}
