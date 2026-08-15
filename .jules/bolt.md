## 2025-05-14 - Drizzle Aggregate Driver Casting
**Learning:** Drizzle ORM SQL aggregate functions (`count()`, `sum()`, `max()`) may return numerical values as strings or stringified ISO timestamps depending on the database driver (e.g., MySQL driver).
**Action:** Always wrap `sum`/`count` aggregate fields in `Number(...)` and `max` timestamp fields in `new Date(...)` at the data access layer to ensure robust type consistency.
