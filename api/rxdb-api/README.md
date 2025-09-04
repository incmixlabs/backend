# RxDB API

This API provides synchronization endpoints for RxDB clients to sync data with the server.

## API Structure

### Labels API (`/labels`)
- **POST** `/pull` - Pull labels from server with optional `lastPulledAt` timestamp
- **POST** `/push` - Push label changes to server

### Tasks API (`/tasks`)
- **POST** `/pull` - Pull tasks from server with optional `lastPulledAt` timestamp
- **POST** `/push` - Push task changes to server

### Projects API (`/projects`)
- **POST** `/pull` - Pull projects from server with optional `lastPulledAt` timestamp
- **POST** `/push` - Push project changes to server

## Data Flow

### Pull Endpoints
- Retrieve data that has been updated since the last pull
- Return data in RxDB sync protocol format with documents and checkpoint
- Include user profile information for created/updated by fields
- Filter data based on user permissions (project membership, org membership)

### Push Endpoints
- Accept changes from client in RxDB change format
- Validate user permissions for each document
- Handle conflicts by comparing assumed vs. actual server state
- Return conflicts to client for resolution
- Support both create and update operations

## Authentication
All endpoints require valid user authentication via session cookies.

## Data Models

### Labels
- Project-scoped labels for status, priority, and tags
- Include color, order, and description
- Track creation and modification metadata

### Tasks
- Project-scoped tasks with status, priority, and assignment
- Support subtasks, dates, acceptance criteria, and attachments
- Include checklist and label tagging

### Projects
- Organization-scoped projects with status, dates, and budget
- Include member management and role assignment
- Support company information and logo

## Sync Protocol
Follows RxDB sync protocol with:
- `changeRows` array for push operations
- `documents` array and `checkpoint` for pull operations
- Conflict resolution via `assumedMasterState` comparison
- Timestamp-based incremental synchronization
