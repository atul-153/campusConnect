package com.campusconnect;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
class ComplaintController {
    private final ComplaintRepository complaints;
    private final UserRepository users;

    ComplaintController(ComplaintRepository complaints, UserRepository users) {
        this.complaints = complaints;
        this.users = users;
    }

    @PostMapping("/complaints")
    @PreAuthorize("hasRole('STUDENT')")
    @ResponseStatus(HttpStatus.CREATED)
    Dtos.ComplaintView submit(@Valid @RequestBody Dtos.ComplaintRequest request, @AuthenticationPrincipal String email) {
        UserEntity author = user(email);
        return view(complaints.save(new ComplaintEntity(author, request.subject().trim(), request.description().trim())));
    }

    @GetMapping("/admin/complaints")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    List<Dtos.ComplaintView> list() { return complaints.findAllWithAuthors().stream().map(this::view).toList(); }

    @PatchMapping("/admin/complaints/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    Dtos.ComplaintView updateStatus(@PathVariable Long id, @Valid @RequestBody Dtos.ComplaintStatusRequest request) {
        ComplaintEntity complaint = complaints.findById(id).orElseThrow(() -> ApiException.notFound("Complaint not found"));
        complaint.status = request.status();
        return view(complaint);
    }

    @DeleteMapping("/admin/complaints/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) {
        complaints.delete(complaints.findById(id).orElseThrow(() -> ApiException.notFound("Complaint not found")));
    }

    private Dtos.ComplaintView view(ComplaintEntity complaint) {
        return new Dtos.ComplaintView(complaint.id, complaint.subject, complaint.description,
            complaint.author.name, complaint.status, complaint.createdAt);
    }
    private UserEntity user(String email) { return users.findByEmail(email).orElseThrow(() -> ApiException.notFound("User not found")); }
}
