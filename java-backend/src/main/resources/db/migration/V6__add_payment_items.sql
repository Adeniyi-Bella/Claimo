CREATE TABLE payment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES project_models(id) ON DELETE CASCADE,
    category VARCHAR(255) NOT NULL,
    contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contract_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    attached_element_ids TEXT,
    job_status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'NONE',
    payment_confirmation_pending BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE payment_item_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_item_id UUID NOT NULL REFERENCES payment_items(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    submitted_by VARCHAR(255) NOT NULL,
    submitted_by_id VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    decided_by VARCHAR(255),
    decided_by_id VARCHAR(255),
    decided_at TIMESTAMP WITH TIME ZONE,
    decision_note TEXT,
    paid_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE payment_item_audit_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_item_id UUID NOT NULL REFERENCES payment_items(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    actor_id VARCHAR(255) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action TEXT NOT NULL,
    field VARCHAR(50) NOT NULL,
    from_value TEXT,
    to_value TEXT
);
