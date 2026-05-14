ALTER TABLE pending_invites
    ADD COLUMN clerk_invitation_id VARCHAR(255);

ALTER TABLE pending_invites
    ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDING';

ALTER TABLE pending_invites
    ADD COLUMN accepted_at TIMESTAMP WITH TIME ZONE;

CREATE UNIQUE INDEX idx_pending_invites_clerk_invitation_id
    ON pending_invites(clerk_invitation_id);
