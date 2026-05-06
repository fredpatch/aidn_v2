# Risk Register

Last reviewed: 2026-05-05

| Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- |
| Mock-only data diverges from real workflow behavior | High | Medium | Define backend contract and validation rules before production rollout |
| Portal currently shares admin auth context | High | High | Introduce separate external auth and authorization boundary |
| Phase closure not hard-validated by required evidence | Medium | Medium | Add backend validation and transition guards |
| Integration assumptions (email/storage) not implemented | Medium | High | Track as explicit backlog items with integration tests |
