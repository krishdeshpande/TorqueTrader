"""Store listing enum values instead of Python enum member names.

Revision ID: 003_store_listing_enum_values
Revises: 002_add_listing_spec_fields
Create Date: 2026-09-20

PostgreSQL enum-label renames preserve rows; no table data is deleted or
rewritten. SQLite does not use native enum types, so it needs no operation.
"""

from alembic import op


revision = "003_store_listing_enum_values"
down_revision = "002_add_listing_spec_fields"
branch_labels = None
depends_on = None


_ENUM_RENAMES = {
    "listing_status_enum": {
        "DRAFT": "draft",
        "PENDING_VERIFICATION": "pending_verification",
        "ACTIVE": "active",
        "SOLD": "sold",
        "REJECTED": "rejected",
    },
    "engine_config_enum": {
        "INLINE_4": "Inline-4",
        "V_TWIN": "V-Twin",
        "L_TWIN": "L-Twin",
        "TRIPLE": "Triple",
        "BOXER": "Boxer",
        "OTHER": "Other",
    },
    "body_type_enum": {
        "SUPERSPORT": "Supersport",
        "NAKED": "Naked",
        "ADV": "ADV",
        "CRUISER": "Cruiser",
        "MODERN_CLASSIC": "Modern Classic",
    },
}


def _rename_labels(mapping: dict[str, dict[str, str]]) -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    for enum_name, labels in mapping.items():
        for old_label, new_label in labels.items():
            op.execute(
                f"""
                DO $$
                BEGIN
                    IF to_regtype('{enum_name}') IS NOT NULL
                       AND EXISTS (
                           SELECT 1 FROM pg_enum
                           WHERE enumtypid = '{enum_name}'::regtype
                             AND enumlabel = '{old_label}'
                       )
                       AND NOT EXISTS (
                           SELECT 1 FROM pg_enum
                           WHERE enumtypid = '{enum_name}'::regtype
                             AND enumlabel = '{new_label}'
                       ) THEN
                        ALTER TYPE {enum_name} RENAME VALUE '{old_label}' TO '{new_label}';
                    END IF;
                END $$;
                """
            )


def upgrade() -> None:
    _rename_labels(_ENUM_RENAMES)


def downgrade() -> None:
    _rename_labels(
        {
            enum_name: {new_label: old_label for old_label, new_label in labels.items()}
            for enum_name, labels in _ENUM_RENAMES.items()
        }
    )
