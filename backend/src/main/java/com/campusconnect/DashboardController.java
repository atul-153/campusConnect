package com.campusconnect;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
class DashboardController {
    private final UserRepository users;
    private final VoteRepository votes;
    private final SuggestionRepository suggestions;
    private final ComplaintRepository complaints;
    private final EventRepository events;

    DashboardController(UserRepository users, VoteRepository votes, SuggestionRepository suggestions,
                        ComplaintRepository complaints, EventRepository events) {
        this.users = users;
        this.votes = votes;
        this.suggestions = suggestions;
        this.complaints = complaints;
        this.events = events;
    }

    @GetMapping
    Map<String, Long> stats(@AuthenticationPrincipal String email) {
        UserEntity user = users.findByEmail(email).orElseThrow(() -> ApiException.notFound("User not found"));
        Map<String, Long> result = new HashMap<>();
        result.put("totalSuggestions", suggestions.count());
        result.put("myVotes", votes.countByUserId(user.id));
        if (user.role == Role.ADMIN) {
            result.put("totalStudents", users.countByRole(Role.STUDENT));
            result.put("totalVotes", votes.count());
            result.put("totalComplaints", complaints.count());
            result.put("totalEvents", events.countByStartsAtAfter(Instant.now()));
        }
        return result;
    }
}
