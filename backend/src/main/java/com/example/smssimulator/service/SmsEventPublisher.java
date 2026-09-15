package com.example.smssimulator.service;

import com.example.smssimulator.model.SmsMessage;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class SmsEventPublisher {
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        return emitter;
    }

    public void publish(SmsMessage sms) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("sms").data(sms));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }

    public void publishClear() {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("clear").data("cleared"));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }
}
