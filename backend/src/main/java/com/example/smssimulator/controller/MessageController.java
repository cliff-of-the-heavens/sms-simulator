package com.example.smssimulator.controller;

import com.example.smssimulator.model.SmsMessage;
import com.example.smssimulator.service.SmsEventPublisher;
import com.example.smssimulator.service.SmsService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
public class MessageController {
    private final SmsService service;
    private final SmsEventPublisher publisher;

    public MessageController(SmsService service, SmsEventPublisher publisher) {
        this.service = service;
        this.publisher = publisher;
    }

    @GetMapping
    public List<SmsMessage> messages(
        @RequestParam(required=false) String search,
        @RequestParam(required=false) String appName,
        @RequestParam(required=false) String msisdn,
        @RequestParam(defaultValue="500") int limit
    ) {
        return service.find(search, appName, msisdn, limit);
    }

    @GetMapping("/events")
    public SseEmitter events() { return publisher.subscribe(); }

    @GetMapping("/stats")
    public Stats stats() {
        return new Stats(service.count(), service.applicationCount(), service.recipientCount());
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(@RequestParam(defaultValue="csv") String format) {
        List<SmsMessage> messages = service.export();
        if ("json".equalsIgnoreCase(format)) {
            String json = messages.stream()
                .map(m -> "{\"id\":" + m.id()
                    + ",\"appName\":\"" + esc(m.appName())
                    + "\",\"msisdn\":\"" + esc(m.msisdn())
                    + "\",\"message\":\"" + esc(m.message())
                    + "\",\"receivedAt\":\"" + m.receivedAt() + "\"}")
                .collect(Collectors.joining(",", "[", "]"));
            return file(json.getBytes(StandardCharsets.UTF_8), "sms-messages.json", MediaType.APPLICATION_JSON);
        }

        StringBuilder csv = new StringBuilder("id,app_name,msisdn,message,received_at\n");
        for (SmsMessage m : messages) {
            csv.append(m.id()).append(',')
               .append(csv(m.appName())).append(',')
               .append(csv(m.msisdn())).append(',')
               .append(csv(m.message())).append(',')
               .append(csv(m.receivedAt().toString())).append('\n');
        }
        return file(csv.toString().getBytes(StandardCharsets.UTF_8), "sms-messages.csv", MediaType.parseMediaType("text/csv"));
    }

    @DeleteMapping
    public void clear() { service.clear(); }

    public record Stats(long messages, long applications, long recipients) {}

    private ResponseEntity<byte[]> file(byte[] body, String name, MediaType type) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(type);
        h.setContentDisposition(ContentDisposition.attachment().filename(name).build());
        return ResponseEntity.ok().headers(h).body(body);
    }

    private static String csv(String s) { return "\"" + s.replace("\"", "\"\"") + "\""; }
    private static String esc(String s) {
        return s.replace("\\","\\\\").replace("\"","\\\"").replace("\r","\\r").replace("\n","\\n");
    }
}
