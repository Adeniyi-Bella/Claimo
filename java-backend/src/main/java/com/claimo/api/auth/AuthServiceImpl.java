package com.claimo.api.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String CLAIM_SUB = "sub";
    private static final String CLAIM_EMAIL = "email";

    private final PrincipalValidator principalValidator;

    @Override
    public AuthenticatedPrincipal extractPrincipal(Jwt jwt) {
        String oid = jwt.getClaimAsString(CLAIM_SUB);
        String email = jwt.getClaimAsString(CLAIM_EMAIL);
        String username = email;

        AuthenticatedPrincipal principal = AuthenticatedPrincipal.builder()
                .oid(oid)
                .email(email)
                .username(username)
                .build();

        principalValidator.validate(principal);
        return principal;
    }
}
