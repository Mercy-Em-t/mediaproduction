# Media Production Platform

A lightweight prototype for collaborative media production workflows with strict project isolation.

## Repository Structure

```text
/backend   # Node.js prototype API for uploads, roles, projects, scenes, and tasks
/frontend  # Reserved for UI implementation (upload dashboard, switcher, review tools)
/docs      # Product and architecture notes
/tests     # Cross-layer/system test space
```

## Core Capabilities Implemented (Prototype)

- Project buckets: each project has isolated storage under `backend/storage/<projectId>`.
- Roles and permissions:
  - `project_manager`: create projects, members, tasks.
  - `scene_director`: create scenes, review readiness.
  - `contributor`: upload/update media versions.
  - `viewer`: track outputs and progress.
- Upload & retrieval:
  - Supports image/video/audio/model and zip/archive MIME categories.
  - Versioned uploads (`raw`, `edited`, `final`).
  - File list, download, and preview endpoint for common formats (JPEG/PNG/WEBP, MP4, MP3/WAV).
- Production workflow primitives:
  - Scene creation endpoint.
  - Task creation endpoint with deadline/expiry fields.

## Quick Start

```bash
cd backend
npm install
npm test
npm start
```

### API Overview

- `POST /api/projects`
- `POST /api/projects/:projectId/members`
- `POST /api/projects/:projectId/scenes`
- `POST /api/projects/:projectId/tasks`
- `POST /api/projects/:projectId/files/upload` (multipart, field `files`, field `versionStage`)
- `GET /api/projects/:projectId/files`
- `GET /api/projects/:projectId/files/:fileId/download`
- `GET /api/projects/:projectId/files/:fileId/preview`

All endpoints require:

- `x-user-id`
- `x-user-signature` (HMAC-SHA256 hex digest of `x-user-id` using `AUTH_HMAC_SECRET`)

For local development, set `AUTH_HMAC_SECRET` before starting the server.

## Roadmap

1. Build the React/Vue upload dashboard with drag-and-drop and upload progress bars.
2. Add project switcher UI and timeline view with expiry alerts.
3. Add rubric and peer review scoring workflow.
4. Move metadata persistence from memory to PostgreSQL/MongoDB.
5. Integrate object storage provider (AWS S3/Google Cloud Storage).
6. Add OAuth/JWT authentication and production-grade audit logging.
