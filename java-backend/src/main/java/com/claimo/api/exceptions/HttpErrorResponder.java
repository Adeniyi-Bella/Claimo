package com.claimo.api.exceptions;

import com.claimo.api.exceptions.ResponseDtos.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.http.HttpStatus;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class HttpErrorResponder {

    private final ObjectMapper objectMapper;
    private final ErrorMessageResolver errorMessageResolver;

    public void write(HttpServletResponse response, int status, String message) throws IOException {
        ErrorResponse error = new ResponseDtos.ErrorResponse(
                status,
                errorMessageResolver.resolve(message, ErrorMessages.defaultMessage(HttpStatus.valueOf(status))));

        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(CustomApiResponse.error(error)));
    }
}
