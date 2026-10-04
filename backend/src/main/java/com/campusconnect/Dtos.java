package com.campusconnect;

import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;

public final class Dtos {
    private Dtos() {}
    public record RegisterRequest(@NotBlank @Size(min=2,max=120) String name, @NotBlank @Email @Pattern(regexp="(?i)^[a-z]+\\.[a-z]+_[a-z]+_[0-9]{2,4}@tsdcem\\.ac\\.in$", message="Email must look like firstname.lastname_branch_year@tsdcem.ac.in") @Size(max=190) String email, @NotBlank @Size(min=8,max=72) String password) {}
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record AuthResponse(String token, String name, String email, String role) {}
    public record ElectionRequest(@NotBlank @Size(max=180) String title, @NotBlank @Size(max=1200) String description, @NotNull ElectionCategory category) {}
    public record CandidateRequest(@NotBlank @Size(max=120) String name, @Size(max=1000) String platform) {}
    public record VoteRequest(@NotNull Long candidateId) {}
    public record ElectionStatusRequest(@NotNull ElectionStatus status) {}
    public record CandidateView(Long id, String name, String platform, Long votes) {}
    public record ElectionView(Long id, String title, String description, ElectionCategory category, ElectionStatus status, long voteCount, List<CandidateView> candidates) {}
    public record SuggestionRequest(@NotBlank @Size(max=180) String title, @NotBlank @Size(max=1200) String content) {}
    public record ReactionRequest(@NotNull Boolean liked) {}
    public record SuggestionStatusRequest(@NotNull SuggestionStatus status) {}
    public record SuggestionView(Long id, String title, String content, String authorName, SuggestionStatus status, Instant createdAt, long score) {}
    public record ComplaintRequest(@NotBlank @Size(max=180) String subject, @NotBlank @Size(max=3000) String description) {}
    public record ComplaintStatusRequest(@NotNull ComplaintStatus status) {}
    public record ComplaintView(Long id, String subject, String description, String authorName, ComplaintStatus status, Instant createdAt) {}
    public record EventRequest(@NotBlank @Size(max=180) String title, @NotBlank @Size(max=1200) String description, @NotBlank @Size(max=180) String location, @NotBlank @Size(max=80) String category, @NotNull Instant startsAt) {}
    public record EventView(Long id, String title, String description, String location, String category, Instant startsAt) {}
}
