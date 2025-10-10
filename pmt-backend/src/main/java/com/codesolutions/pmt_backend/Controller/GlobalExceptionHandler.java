package com.codesolutions.pmt_backend.Controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Handler global des erreurs REST.
 * - Mappe "…non trouvé…" / "…not found…" en 404
 * - DataIntegrityViolation => 400
 * - Sinon 400 par défaut
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<Map<String, Object>> build(HttpStatus status, String message, HttpServletRequest req) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("path", req.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex,
                                                                   HttpServletRequest req) {
        String msg = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        return build(HttpStatus.BAD_REQUEST, msg, req);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAny(Exception ex, HttpServletRequest req) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "Erreur";
        String lower = msg.toLowerCase();
        HttpStatus status =
                (lower.contains("non trouvé") || lower.contains("not found")) ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
        return build(status, msg, req);
    }
}
