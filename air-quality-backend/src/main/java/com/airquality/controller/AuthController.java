package com.airquality.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.airquality.entity.AdminUser;
import com.airquality.entity.LimitValue;
import com.airquality.repository.AdminUserRepository;
import com.airquality.repository.LimitRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private LimitRepository limitRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        Optional<AdminUser> user = adminUserRepository.findByUsername(username);

        if (user.isPresent() && user.get().getPassword().equals(password)) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Login successful"));
        }

        return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid username or password"));
    }

    // GET /api/auth/limits → returns all limit rows
    @GetMapping("/limits")
    public List<LimitValue> getLimits() {
        return limitRepository.findAll();
    }

    // PUT /api/auth/limits → body: [{pollutantId, safeLimit}, ...]
    @PutMapping("/limits")
    public ResponseEntity<?> updateLimits(@RequestBody List<LimitValue> limits) {
        for (LimitValue incoming : limits) {
            Optional<LimitValue> existing = limitRepository.findByPollutantId(incoming.getPollutantId());
            if (existing.isPresent()) {
                LimitValue lv = existing.get();
                lv.setSafeLimit(incoming.getSafeLimit());
                limitRepository.save(lv);
            } else {
                limitRepository.save(incoming);
            }
        }
        return ResponseEntity.ok(Map.of("success", true));
    }
}
