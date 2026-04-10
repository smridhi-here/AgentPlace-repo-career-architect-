package com.careerarchitect.controller;

import com.careerarchitect.models.User;
import com.careerarchitect.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email already registered");
        }
        user.setPro(false); 
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            User user = userOpt.get();

            // Check for Expired Pro Users
            if (user.isPro() && user.getProExpiry() != null) {
                if (user.getProExpiry().isBefore(LocalDateTime.now())) {
                    user.setPro(false);
                    userRepository.save(user);
                    return ResponseEntity.ok(user); 
                }
            }
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
    }

    // ✅ FIXED — respects monthly/quarterly/yearly plan
@PostMapping("/upgrade")
public ResponseEntity<?> upgrade(@RequestBody Map<String, String> request) {
    String email = request.get("email");
    String plan = request.getOrDefault("plan", "monthly");
    
    Optional<User> userOpt = userRepository.findByEmail(email);
    if (userOpt.isPresent()) {
        User user = userOpt.get();
        user.setPro(true);
        
        int days = switch (plan) {
            case "quarterly" -> 90;
            case "yearly"    -> 365;
            default          -> 30;   // monthly
        };
        user.setProExpiry(LocalDateTime.now().plusDays(days));
        return ResponseEntity.ok(userRepository.save(user));
    }
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
}
}