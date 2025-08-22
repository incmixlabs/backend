#!/bin/bash

echo "🎭 Testing Mock Mode Endpoints"
echo "================================"

BASE_URL="http://localhost:8787"

echo -e "\n1. Testing GET /api/tasks/tasks (List all tasks)"
curl -s "$BASE_URL/api/tasks/tasks" | jq '.[0] | {id, name, statusId}' 2>/dev/null || echo "❌ Failed"

echo -e "\n2. Testing GET /api/tasks/tasks/mock-task-1 (Get specific task)"
curl -s "$BASE_URL/api/tasks/tasks/mock-task-1" | jq '{id, name, checklist}' 2>/dev/null || echo "❌ Failed"

echo -e "\n3. Testing POST /api/tasks/tasks (Create new task)"
curl -s -X POST "$BASE_URL/api/tasks/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Script Test Task",
    "description": "Created via test script",
    "projectId": "mock-project-1",
    "statusId": "status-todo",
    "priorityId": "priority-medium",
    "taskOrder": 99,
    "startDate": "2025-01-20T00:00:00.000Z",
    "endDate": "2025-01-27T00:00:00.000Z",
    "labelsTags": ["script", "test"],
    "refUrls": [],
    "attachments": [],
    "acceptanceCriteria": ["Script test passes"],
    "checklist": []
  }' | jq '{id, name, description}' 2>/dev/null || echo "❌ Failed"

echo -e "\n4. Testing GET /api/tasks/tasks/job-status (Job status)"
curl -s "$BASE_URL/api/tasks/tasks/job-status" | jq '{userStory: .userStory | length, codegen: .codegen | length}' 2>/dev/null || echo "❌ Failed"

echo -e "\n5. Testing POST /api/tasks/tasks/bulk-ai-gen (Bulk AI generation)"
curl -s -X POST "$BASE_URL/api/tasks/tasks/bulk-ai-gen" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user-story",
    "taskIds": ["mock-task-1", "mock-task-2"]
  }' | jq '.message' 2>/dev/null || echo "❌ Failed"

echo -e "\n✅ Mock mode testing complete!"