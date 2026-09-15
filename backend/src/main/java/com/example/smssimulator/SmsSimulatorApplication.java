package com.example.smssimulator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmsSimulatorApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmsSimulatorApplication.class, args);
    }
}
