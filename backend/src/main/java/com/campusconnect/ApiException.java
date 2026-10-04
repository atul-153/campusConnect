package com.campusconnect;

import org.springframework.http.HttpStatus;

class ApiException extends RuntimeException {
    final HttpStatus status;
    ApiException(HttpStatus status, String message) { super(message); this.status = status; }
    static ApiException badRequest(String message) { return new ApiException(HttpStatus.BAD_REQUEST, message); }
    static ApiException notFound(String message) { return new ApiException(HttpStatus.NOT_FOUND, message); }
    static ApiException conflict(String message) { return new ApiException(HttpStatus.CONFLICT, message); }
}
