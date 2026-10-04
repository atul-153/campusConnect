package com.campusconnect;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
class JwtService {
    private final SecretKey key;
    private final long expirationHours;

    JwtService(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.expiration-hours}") long expirationHours) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationHours = expirationHours;
    }

    String issue(UserEntity user) {
        Instant now = Instant.now();
        return Jwts.builder().subject(user.email).claim("role", user.role.name())
            .issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(expirationHours * 3600)))
            .signWith(key).compact();
    }

    Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
