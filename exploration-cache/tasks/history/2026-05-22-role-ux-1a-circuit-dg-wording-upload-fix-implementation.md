# ROLE-UX-1A Circuit DG Wording + Upload Fix

Completed implementation pass on 2026-05-22.

Summary: replaced digital-send wording with physical circuit wording and fixed the pre-evaluation DG return multipart field mismatch by sending `file` only for pre-evaluation tasks and `returnedScannedDocument` only for initial request tasks.

Verification: API build PASS, admin typecheck PASS, admin build PASS after known outside-sandbox Tailwind native binary rerun. Live upload validation pending.
