package com.claimo.api.exceptions;

public class ResponseDtos {
    public record ErrorResponse(int status, String message) {}
}