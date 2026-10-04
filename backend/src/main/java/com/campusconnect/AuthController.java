package com.campusconnect;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
class AuthController {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final JwtService jwtService;

    AuthController(UserRepository users, PasswordEncoder passwords, JwtService jwtService) {
        this.users = users;
        this.passwords = passwords;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    Dtos.AuthResponse register(@Valid @RequestBody Dtos.RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (users.findByEmail(email).isPresent()) throw ApiException.conflict("An account already exists for this email");
        UserEntity user = users.save(new UserEntity(request.name().trim(), email, passwords.encode(request.password()), Role.STUDENT));
        return response(user);
    }

    @PostMapping("/login")
    Dtos.AuthResponse login(@Valid @RequestBody Dtos.LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        UserEntity user = users.findByEmail(email).orElseThrow(() -> ApiException.badRequest("Email or password is incorrect"));
        if (!passwords.matches(request.password(), user.passwordHash)) throw ApiException.badRequest("Email or password is incorrect");
        return response(user);
    }

    private Dtos.AuthResponse response(UserEntity user) {
        return new Dtos.AuthResponse(jwtService.issue(user), user.name, user.email, user.role.name());
    }
}
