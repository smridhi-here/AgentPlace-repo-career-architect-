package com.careerarchitect.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonProperty;
// ✅ ADD THIS NEW IMPORT HERE
import com.fasterxml.jackson.annotation.JsonFormat; 
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100)
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Email is required")
    @Email
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @NotBlank(message = "Password is required")
    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Column(nullable = false)
    private boolean isPro = false;

    // ✅ ADD THE @JsonFormat LINE RIGHT HERE, ABOVE THE @Column
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // NEW: Optional - Track when Pro expires (e.g., after 30 days)
    @Column(name = "pro_expiry")
    private LocalDateTime proExpiry;

    public User() {
        // Automatically set the join date when a new user is created
        this.createdAt = LocalDateTime.now();
    }

    // --- Standard Getters/Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    // Pro Status Logic
    public boolean isPro() { return isPro; }
    public void setPro(boolean pro) { this.isPro = pro; }

    // Join Date Logic (For the 2-hour trial)
    public LocalDateTime getCreatedAt() { return createdAt; }
    
    // Expiry Logic
    public LocalDateTime getProExpiry() { return proExpiry; }
    public void setProExpiry(LocalDateTime proExpiry) { this.proExpiry = proExpiry; }
}