CREATE TABLE company_invites (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    clerk_invitation_id VARCHAR(255) UNIQUE,
    company_id UUID NOT NULL REFERENCES companies(id),
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    accepted_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_company_invites_email ON company_invites(email);
CREATE UNIQUE INDEX idx_company_invites_clerk_invitation_id ON company_invites(clerk_invitation_id);
