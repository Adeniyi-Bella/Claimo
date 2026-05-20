# claimo
Submit, track and approve construction payment claims in one place. From subcontractor to main contractor to client, every claim is visible, traceable and resolved faster.

## Database Architecture

The frontend is still persisting most of this in `sessionStorage` for now, but the data model it already expects is:

- company-level members in settings
- company role and project role are separate
- projects owned by a company
- project members with their own project roles
- uploaded BIM models with thumbnails and geometry JSON
- model-level cost tracking for the whole building or building segment
- payment items attached to a model and to selected geometry elements
- claim history attached to each payment item

```mermaid
erDiagram
    USERS ||--o{ COMPANIES : owns
    USERS ||--o{ COMPANY_MEMBERS : joins
    USERS ||--o{ COMPANY_INVITES : invited_by
    USERS ||--o{ PROJECTS : creates
    USERS ||--o{ PROJECT_MEMBERS : assigned_to
    USERS ||--o{ PROJECT_INVITES : invited_by
    USERS ||--o{ PROJECT_MODELS : uploaded_by
    USERS ||--o{ PAYMENT_ITEMS : contractor
    USERS ||--o{ PAYMENT_ITEMS : approver
    USERS ||--o{ CLAIMS : submitted_by
    USERS ||--o{ CLAIMS : decided_by

    COMPANIES ||--o{ COMPANY_MEMBERS : has
    COMPANIES ||--o{ COMPANY_INVITES : tracks
    COMPANIES ||--o{ PROJECTS : contains

    PROJECTS ||--o{ PROJECT_MEMBERS : has
    PROJECTS ||--o{ PROJECT_INVITES : tracks
    PROJECTS ||--o{ PROJECT_MODELS : contains

    PROJECT_MODELS ||--o{ PAYMENT_ITEMS : groups
    PAYMENT_ITEMS ||--o{ CLAIMS : has
    PAYMENT_ITEMS ||--o{ PAYMENT_ITEM_ELEMENTS : tags
    PROJECT_MODELS ||--o{ PROJECT_MODEL_ELEMENTS : contains

    USERS {
        uuid id PK
        string clerk_user_id
        string email
        string full_name
        string avatar_url
    }

    COMPANIES {
        uuid id PK
        uuid owner_id FK
        string name
        timestamp created_at
    }

    COMPANY_MEMBERS {
        uuid company_id PK, FK
        uuid user_id PK, FK
        string role
        string status
        timestamp invited_at
        timestamp accepted_at
    }

    COMPANY_INVITES {
        uuid id PK
        uuid company_id FK
        uuid invited_by FK
        string email
        string role
        string status
        string clerk_invitation_id
        timestamp created_at
    }

    PROJECTS {
        uuid id PK
        uuid company_id FK
        uuid created_by FK
        string name
        string description
        string location
        date start_date
        string status
        timestamp created_at
    }

    PROJECT_MEMBERS {
        uuid project_id PK, FK
        uuid user_id PK, FK
        string role
        timestamp joined_at
    }

    PROJECT_INVITES {
        uuid id PK
        uuid project_id FK
        uuid invited_by FK
        string email
        string role
        string status
        timestamp created_at
    }

    PROJECT_MODELS {
        uuid id PK
        uuid project_id FK
        uuid uploaded_by FK
        string name
        json geometry_json
        text thumbnail_url
        decimal total_cost
        decimal approved_cost
        decimal submitted_cost
        decimal rejected_cost
        decimal remaining_cost
        string storage_type
        timestamp uploaded_at
    }

    PAYMENT_ITEMS {
        uuid id PK
        uuid project_model_id FK
        uuid contractor_id FK
        uuid approver_id FK
        string category
        string scope_name
        string model_name
        string contractor_name
        string approver_name
        decimal contract_value
        text description
        timestamp created_at
        timestamp updated_at
    }

    PAYMENT_ITEM_ELEMENTS {
        uuid payment_item_id PK, FK
        uuid model_element_id PK, FK
        uuid tagged_by FK
        timestamp created_at
    }

    PROJECT_MODEL_ELEMENTS {
        uuid id PK
        uuid project_model_id FK
        string element_key
        string element_name
        string category
        json metadata
        timestamp created_at
    }

    CLAIMS {
        uuid id PK
        uuid payment_item_id FK
        int sequence
        decimal amount
        text description
        string status
        uuid submitted_by FK
        uuid decided_by FK
        timestamp submitted_at
        timestamp decided_at
        text decision_note
        timestamp paid_at
    }
```

### How To Read It

- `users` is the auth/profile table backing Clerk users.
- `companies` is the workspace boundary.
- `company_members` stores company access and company-level `role` for the settings page.
- `projects` are owned by a company and created by a user.
- `project_members` stores who can access each project and what project `role` they have in that project.
- `project_invites` is optional future support for invite-based project onboarding. The current frontend’s project invite modal can also write directly to `project_members`.
- `project_models` stores the uploaded BIM JSON plus the generated thumbnail and the model-level cost totals. For now the JSON model can live in PostgreSQL, while Azure Blob Storage is the future file-storage target.
- `project_model_elements` is the element index for a model. It gives the viewer a stable place to store element IDs and metadata for manual tagging.
- `payment_items` are attached to a single model and point at the assigned contractor and approver. They are repeatable work scopes, so the same category or label can appear more than once for different parts of the model.
- `payment_item_elements` stores the many-to-many link between a payment item and the specific model elements the user tagged in the viewer.
- `claims` is the audit trail for each payment item. Status, sequence, decision note, and payment timestamps all live here.

### Important Rule

- Company membership and project membership are separate.
- Company roles come from `CompanyRole` and only control company-level access.
- Project roles come from `ProjectRole` and only control project-level access.
- Company admins and account owners can see all projects in their company.
- The project detail screen can be served entirely from project, model, payment item, and claim endpoints once those records exist server-side.
- Model storage can start in PostgreSQL as JSON and later move to Azure Blob Storage without changing the project or payment relationships.
- Model totals should be stored or derived at the model level so the whole building or building segment has its own cost tracking.
- Payment item totals should roll up into the model totals, while claims roll up into the payment item totals.
- Derived values like `projectSummary`, `modelSummary`, `itemTotals`, and `derivedStatus` should be computed from the stored records, not duplicated as source-of-truth columns.
