# UI Patterns

Last reviewed: 2026-05-05

## Common patterns used
- page-container / page-header / page-title / page-subtitle utility classes (apps/admin/src/index.css)
- Card-based sections for grouped information
- Badge statuses for operational states
- Table-first list pages for admin views
- SkeletonCard + ErrorState + EmptyState for loading/error/empty states
- Query-driven data refresh via react-query hooks

## Portal-specific patterns
- Simplified wording for external-facing statuses
- Tabs to group details by user intent (docs/payments/meetings/notifications/certificate)
- Clear read-only banner and no admin action controls
