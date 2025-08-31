#!/bin/bash

# Test script to verify health check endpoints are working
# and that they check the /reference endpoint

echo "Testing health check endpoints..."
echo "================================"

# Discover running services dynamically
echo "Discovering running services..."
running_ports=()

# Check the actual ports used by the services
service_ports=(8787 8989 8383 8282 9494 8080 8585 9090 9292 8484 9191 8686)

for port in "${service_ports[@]}"; do
    if lsof -i ":${port}" >/dev/null 2>&1; then
        process_info=$(lsof -i ":${port}" | grep LISTEN | head -1)
        if echo "$process_info" | grep -q node; then
            running_ports+=("$port")
            echo "  ✅ Node process found on port ${port}"
        fi
    fi
done

if [ ${#running_ports[@]} -eq 0 ]; then
    echo "❌ No Node.js services found running. Start services with 'pnpm dev'"
    exit 1
fi

# Function to discover API name from port
discover_api_name() {
    local port=$1
    
    # Port to API name mapping
    case $port in
        8787) echo "auth" ;;
        8989) echo "email" ;;
        8383) echo "genai" ;;
        8282) echo "files" ;;
        9494) echo "location" ;;
        8080) echo "bff" ;;
        8585) echo "comments" ;;
        9090) echo "intl" ;;
        9292) echo "org" ;;
        8484) echo "projects" ;;
        9191) echo "users" ;;
        8686) echo "rxdb-sync" ;;
        *) echo "unknown-api-${port}" ;;
    esac
}

# Function to test a single API
test_api() {
    local port=$1
    local api_name=$(discover_api_name "$port")
    local base_url="http://localhost:${port}"
    
    echo "Testing ${api_name} on port ${port}..."
    echo "  Health check: ${base_url}/api/${api_name}/health-check"
    echo "  Reference endpoint: ${base_url}/api/${api_name}/reference"
    
    # Test health check endpoint
    health_response=$(curl -s -w "%{http_code}" "${base_url}/api/${api_name}/health-check" -o /tmp/health_response.json)
    http_code="${health_response: -3}"
    
    if [ "$http_code" = "200" ]; then
        status=$(jq -r '.status' /tmp/health_response.json 2>/dev/null || echo "unknown")
        reason=$(jq -r '.reason // "none"' /tmp/health_response.json 2>/dev/null || echo "unknown")
        echo "  ✅ Health check: ${status} (reason: ${reason})"
        
        # Check if Reference Endpoint check is mentioned in the reason
        if echo "$reason" | grep -q "Reference Endpoint"; then
            echo "  ✅ Reference endpoint check is active"
        else
            echo "  ⚠️  Reference endpoint check status unknown"
        fi
    else
        echo "  ❌ Health check failed (HTTP ${http_code})"
    fi
    
    # Test reference endpoint directly
    ref_response=$(curl -s -w "%{http_code}" "${base_url}/api/${api_name}/reference" -o /dev/null)
    ref_code="${ref_response: -3}"
    
    if [ "$ref_code" = "200" ]; then
        echo "  ✅ Reference endpoint accessible"
    else
        echo "  ❌ Reference endpoint failed (HTTP ${ref_code})"
    fi
    
    echo ""
}

echo ""
echo "Found ${#running_ports[@]} running Node.js services"
echo ""

# Test each running service
for port in "${running_ports[@]}"; do
    test_api "$port"
done

echo "Health check testing completed!"