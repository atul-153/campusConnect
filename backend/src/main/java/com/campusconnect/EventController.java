package com.campusconnect;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api")
class EventController {
    private final EventRepository events;
    private final UserRepository users;

    EventController(EventRepository events, UserRepository users) { this.events = events; this.users = users; }

    @GetMapping("/events")
    List<Dtos.EventView> list(@AuthenticationPrincipal String email) {
        UserEntity user = user(email);
        List<EventEntity> results = user.role == Role.ADMIN
            ? events.findAllByOrderByStartsAtAsc() : events.findByStartsAtAfterOrderByStartsAtAsc(Instant.now());
        return results.stream().map(this::view).toList();
    }

    @PostMapping("/admin/events")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    Dtos.EventView create(@Valid @RequestBody Dtos.EventRequest request, @AuthenticationPrincipal String email) {
        return view(events.save(new EventEntity(request.title().trim(), request.description().trim(), request.location().trim(),
            request.category().trim(), request.startsAt(), user(email))));
    }

    @PutMapping("/admin/events/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    Dtos.EventView update(@PathVariable Long id, @Valid @RequestBody Dtos.EventRequest request) {
        EventEntity event = event(id);
        event.title = request.title().trim();
        event.description = request.description().trim();
        event.location = request.location().trim();
        event.category = request.category().trim();
        event.startsAt = request.startsAt();
        return view(event);
    }

    @DeleteMapping("/admin/events/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) { events.delete(event(id)); }

    private Dtos.EventView view(EventEntity event) {
        return new Dtos.EventView(event.id, event.title, event.description, event.location, event.category, event.startsAt);
    }
    private EventEntity event(Long id) { return events.findById(id).orElseThrow(() -> ApiException.notFound("Event not found")); }
    private UserEntity user(String email) { return users.findByEmail(email).orElseThrow(() -> ApiException.notFound("User not found")); }
}
