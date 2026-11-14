# Graph Report - vantage-backend  (2026-11-14)

## Corpus Check
- 45 files · ~32,733 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 4, .ini 2, .example 1)

## Summary
- 426 nodes · 1048 edges · 19 communities (15 shown, 4 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `51d7a197`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ApiResponse
- test_api.py
- routes/auth.py
- models/__init__.py
- applications.py
- main.py
- package.json
- api
- services
- compilerOptions
- App.tsx
- dependencies
- vite.config.ts
- DatabaseSchemaView.tsx
- scripts

## God Nodes (most connected - your core abstractions)
1. `ApiResponse` - 29 edges
2. `Base` - 25 edges
3. `Application` - 19 edges
4. `Job` - 17 edges
5. `ApplicationStatus` - 17 edges
6. `JobStatus` - 16 edges
7. `log_mutation_details()` - 16 edges
8. `compilerOptions` - 16 edges
9. `log_query_details()` - 15 edges
10. `seed_category()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `quick_apply()` --uses--> `Job`  [INFERRED]
  backend/app/api/routes/applications.py → backend/app/models/job.py
- `seed_job()` --uses--> `JobStatus`  [INFERRED]
  backend/tests/test_api.py → backend/app/models/job.py
- `test_admin_delete_and_archive_job()` --uses--> `JobStatus`  [INFERRED]
  backend/tests/test_api.py → backend/app/models/job.py
- `get_candidate_resumes()` --uses--> `ApiResponse`  [INFERRED]
  backend/app/api/routes/applications.py → backend/app/schemas/response.py
- `quick_apply()` --uses--> `ApiResponse`  [INFERRED]
  backend/app/api/routes/applications.py → backend/app/schemas/response.py

## Import Cycles
- None detected.

## Communities (19 total, 4 thin omitted)

### Community 0 - "ApiResponse"
Cohesion: 0.07
Nodes (39): add_ats_note(), delete_or_archive_job(), get_admin_profile(), get_ats_dashboard_stats(), get_logging_status(), list_ats_applications(), update_application_status(), update_job() (+31 more)

### Community 1 - "test_api.py"
Cohesion: 0.10
Nodes (47): Application, ApplicationStatus, _create_candidate(), seed_category(), seed_job(), test_add_ats_note(), test_admin_delete_and_archive_job(), test_admin_hard_delete_job() (+39 more)

### Community 2 - "routes/auth.py"
Cohesion: 0.07
Nodes (16): login(), LoginPayload, verify_token(), AdminUser, create_access_token(), decode_jwt_token(), get_current_admin(), TokenResponse (+8 more)

### Community 3 - "models/__init__.py"
Cohesion: 0.16
Nodes (12): do_run_migrations(), run_async_migrations(), run_migrations_online(), create_employer_inquiry(), create_service_request(), Base, AdminUser, ATSNote (+4 more)

### Community 4 - "applications.py"
Cohesion: 0.15
Nodes (11): get_candidate_resumes(), quick_apply(), quick_apply_multipart(), upload_application_document(), Candidate, CandidateResume, ResumeSource, CandidateApplicationCreate (+3 more)

### Community 5 - "main.py"
Cohesion: 0.07
Nodes (13): AdminLogTogglePayload, toggle_logging(), health_check(), Settings, Config, _format_json_safely(), is_detailed_logging_enabled(), log_http_request() (+5 more)

### Community 6 - "package.json"
Cohesion: 0.12
Nodes (23): devDependencies, autoprefixer@^10.4.21, esbuild@^0.25.0, tailwindcss@^4.3.3, tsx@^4.21.0, @types/express@^4.17.21, @types/node@^22.14.0, @types/react@^19.3.0 (+15 more)

### Community 7 - "api"
Cohesion: 0.10
Nodes (20): build, container_name, depends_on, environment, ports, restart, POSTGRES_DB, POSTGRES_PASSWORD (+12 more)

### Community 8 - "services"
Cohesion: 0.10
Nodes (19): generateValue, key, sync, value, destination, source, type, services (+11 more)

### Community 9 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+9 more)

### Community 10 - "App.tsx"
Cohesion: 0.19
Nodes (11): lucide-react@^0.546.0, react@^19.0.1, lucide-react, react, AdminDashboardView(), ATSApplication, INITIAL_APPLICATIONS, App() (+3 more)

### Community 13 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, dotenv@^17.2.3, express@^4.21.2, @google/genai@^2.4.0, motion@^12.23.24, react-dom@^19.0.1, dotenv, express (+3 more)

### Community 14 - "vite.config.ts"
Cohesion: 0.25
Nodes (6): @tailwindcss/vite@^4.3.3, vite@^8.3.0, @vitejs/plugin-react@^6.1.1, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 15 - "DatabaseSchemaView.tsx"
Cohesion: 0.25
Nodes (7): ALL_TABLES, ColumnDef, DatabaseSchemaViewProps, ENUMS_INFO, INDEXES_INFO, STORAGE_BUCKETS, TableDef

### Community 17 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, clean, dev, lint, preview

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiResponse` connect `ApiResponse` to `routes/auth.py`, `models/__init__.py`, `applications.py`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `ApiResponse` (e.g. with `add_ats_note()` and `delete_or_archive_job()`) actually correct?**
  _`ApiResponse` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Should `ApiResponse` be split into smaller, more focused modules?**
  _Cohesion score 0.07025316455696203 - nodes in this community are weakly interconnected._
- **Why does `Application` connect `test_api.py` to `ApiResponse`, `models/__init__.py`, `applications.py`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `Application` (e.g. with `add_ats_note()` and `get_ats_dashboard_stats()`) actually correct?**
  _`Application` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Should `test_api.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09803921568627451 - nodes in this community are weakly interconnected._
- **Should `routes/auth.py` be split into smaller, more focused modules?**
  _Cohesion score 0.0700354609929078 - nodes in this community are weakly interconnected._