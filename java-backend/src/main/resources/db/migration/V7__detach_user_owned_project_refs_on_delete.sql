ALTER TABLE projects
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE project_models
  ALTER COLUMN uploaded_by DROP NOT NULL;

ALTER TABLE payment_items
  ALTER COLUMN contractor_id DROP NOT NULL,
  ALTER COLUMN approver_id DROP NOT NULL;

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_created_by_fkey;

ALTER TABLE projects
  ADD CONSTRAINT projects_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE project_models
  DROP CONSTRAINT IF EXISTS project_models_uploaded_by_fkey;

ALTER TABLE project_models
  ADD CONSTRAINT project_models_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE payment_items
  DROP CONSTRAINT IF EXISTS payment_items_contractor_id_fkey;

ALTER TABLE payment_items
  ADD CONSTRAINT payment_items_contractor_id_fkey
  FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE payment_items
  DROP CONSTRAINT IF EXISTS payment_items_approver_id_fkey;

ALTER TABLE payment_items
  ADD CONSTRAINT payment_items_approver_id_fkey
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL;
