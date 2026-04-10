package com.careerarchitect.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
// Using "*" and "allowedHeaders" ensures no browser blocks the demo
@CrossOrigin(origins = "*", allowedHeaders = "*") 
public class HealthController {

    @GetMapping("/health")
    public Map<String, String> health() {
        // This simple Map returns exactly {"status": "UP"}
        return Map.of("status", "UP");
    }
}