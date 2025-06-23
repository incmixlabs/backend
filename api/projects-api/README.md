# Projects API

This API provides CRUD operations for projects, including project management, columns, checklists, and comments.

## Comment Endpoints

The following endpoints are available for managing project comments:

### Get Project Comments
- **GET** `/projects/{id}/comments`
- **Description**: Get all comments for a project
- **Response**: Returns an array of comments with user information
  ```json
  [
    {
      "id": "comment1",
      "content": "This is a comment",
      "userId": "user1",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "userAvatar": "https://example.com/avatar.jpg"
    }
  ]
  ```

### Add Comment to Project
- **POST** `/projects/{id}/comments`
- **Description**: Add a new comment to a project
- **Request Body**:
  ```json
  {
    "comment": {
      "content": "This is a comment"
    }
  }
  ```
- **Response**: Returns the updated project with all comments

### Update Project Comment
- **PUT** `/projects/comments/{commentId}`
- **Description**: Update an existing comment in a project
- **Request Body**:
  ```json
  {
    "comment": {
      "content": "Updated comment content"
    }
  }
  ```
- **Response**: Returns the updated project with all comments

### Remove Project Comment
- **DELETE** `/projects/{id}/comments`
- **Description**: Remove a comment from a project
- **Request Body**:
  ```json
  {
    "commentId": "comment1"
  }
  ```
- **Response**: Returns the updated project with remaining comments

## Authentication

All endpoints require authentication via cookie-based session.

## Error Handling

The API returns appropriate HTTP status codes and error messages:
- `401` - Unauthorized (not authenticated)
- `404` - Project or comment not found
- `500` - Internal server error

## Database Schema

Comments are stored in two tables:
- `comments` - Contains the comment content and metadata
- `projectComments` - Junction table linking comments to projects

```bash
pnpm install
pnpm run dev
npx wrangler d1 migrations apply lucia-auth -- apply schema locally first time
```

```bash
pnpm run deploy
```

## Docs

1. npx wrangler d1 create tasks-api
2. npx wrangler d1 migrations create tasks-api init
3. npx wrangler d1 migrations create tasks-api email-verifications
4. npx wrangler d1 migrations apply tasks-api
5. npx wrangler d1 migrations apply tasks-api --remote

```bash
npx wrangler d1 delete tasks-api
npx wrangler d1 delete tasks-api --remote
```
