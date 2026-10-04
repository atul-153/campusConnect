package com.campusconnect;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api")
class SuggestionController {
    private final SuggestionRepository suggestions;
    private final ReactionRepository reactions;
    private final UserRepository users;

    SuggestionController(SuggestionRepository suggestions, ReactionRepository reactions, UserRepository users) {
        this.suggestions = suggestions;
        this.reactions = reactions;
        this.users = users;
    }

    @GetMapping("/suggestions")
    @Transactional(readOnly = true)
    List<Dtos.SuggestionView> list() {
        return suggestions.findAllWithAuthors().stream().map(this::view)
            .sorted(Comparator.comparingLong(Dtos.SuggestionView::score).reversed()
                .thenComparing(Dtos.SuggestionView::createdAt, Comparator.reverseOrder())).toList();
    }

    @PostMapping("/suggestions")
    @PreAuthorize("hasRole('STUDENT')")
    @ResponseStatus(HttpStatus.CREATED)
    Dtos.SuggestionView create(@Valid @RequestBody Dtos.SuggestionRequest request, @AuthenticationPrincipal String email) {
        UserEntity author = user(email);
        return view(suggestions.save(new SuggestionEntity(request.title().trim(), request.content().trim(), author)));
    }

    @PutMapping("/suggestions/{id}/reaction")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    Dtos.SuggestionView react(@PathVariable Long id, @Valid @RequestBody Dtos.ReactionRequest request,
                              @AuthenticationPrincipal String email) {
        SuggestionEntity suggestion = suggestion(id);
        UserEntity user = user(email);
        ReactionEntity reaction = reactions.findBySuggestionIdAndUserId(id, user.id)
            .orElseGet(() -> new ReactionEntity(suggestion, user, request.liked()));
        reaction.liked = request.liked();
        reaction.updatedAt = Instant.now();
        reactions.save(reaction);
        return view(suggestion);
    }

    @PatchMapping("/admin/suggestions/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    Dtos.SuggestionView updateStatus(@PathVariable Long id, @Valid @RequestBody Dtos.SuggestionStatusRequest request) {
        SuggestionEntity suggestion = suggestion(id);
        suggestion.status = request.status();
        return view(suggestion);
    }

    @DeleteMapping("/admin/suggestions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) {
        SuggestionEntity suggestion = suggestion(id);
        reactions.deleteAllBySuggestionId(id);
        suggestions.delete(suggestion);
    }

    private Dtos.SuggestionView view(SuggestionEntity suggestion) {
        return new Dtos.SuggestionView(suggestion.id, suggestion.title, suggestion.content,
            suggestion.author.name, suggestion.status, suggestion.createdAt, reactions.score(suggestion.id));
    }
    private SuggestionEntity suggestion(Long id) { return suggestions.findById(id).orElseThrow(() -> ApiException.notFound("Suggestion not found")); }
    private UserEntity user(String email) { return users.findByEmail(email).orElseThrow(() -> ApiException.notFound("User not found")); }
}
