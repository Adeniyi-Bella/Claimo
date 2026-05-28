package com.claimo.api.company.dto.requests;

import com.claimo.api.company.enums.CompanyRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CompanyRequests {

    public record InviteMember(
            @NotBlank(message = "Name is required") String name,
            @NotBlank(message = "Email is required") @Email(message = "Invalid email") String email,
            @NotNull(message = "Role is required") CompanyRole role) {
    }
}
