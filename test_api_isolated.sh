#!/usr/bin/env bash

# Integration test for isolated session mode via API
# This script tests creating a session through the API in isolated mode

set -e

echo "=== Testing Isolated Session Mode via API ==="
echo

# Test configuration
API_URL="http://localhost:8765"
SESSION_MODE="isolated"

# Check if API server is running
echo "Checking API server..."
if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
    echo "✓ API server is running"
else
    echo "✗ API server is not running. Please start it with:"
    echo "  cd api && npm run dev"
    exit 1
fi
echo

# Create a test session in isolated mode
echo "Creating isolated session..."
RESPONSE=$(curl -s -X POST "$API_URL/runs" \
    -H "Content-Type: application/json" \
    -d '{
        "sessionMode": "isolated",
        "agents": {
            "units": [
                {
                    "unitId": 1,
                    "manager": {
                        "id": "10",
                        "prompt": "Test Design Manager"
                    },
                    "workers": [
                        {
                            "id": "11",
                            "prompt": "Test Design Worker 1"
                        }
                    ]
                }
            ]
        }
    }')

if [ $? -eq 0 ]; then
    echo "✓ Session creation request sent"
    echo "Response:"
    echo "$RESPONSE" | jq .

    # Extract session ID
    SESSION_ID=$(echo "$RESPONSE" | jq -r '.sessionId')
    SESSION_MODE_RESP=$(echo "$RESPONSE" | jq -r '.sessionMode')
    WORKING_DIR=$(echo "$RESPONSE" | jq -r '.workingDir')

    echo
    echo "Session Details:"
    echo "  Session ID: $SESSION_ID"
    echo "  Mode: $SESSION_MODE_RESP"
    echo "  Working Dir: $WORKING_DIR"

    # Verify session directory was created
    if [ -d "$WORKING_DIR" ]; then
        echo "✓ Session directory exists"

        # Check for subdirectories
        if [ -d "$WORKING_DIR/unit" ] && [ -d "$WORKING_DIR/workflows" ]; then
            echo "✓ Unit and workflow directories exist"
        fi

        # Check for metadata file
        if [ -f "$WORKING_DIR/.session" ]; then
            echo "✓ Session metadata file exists"
            echo "Metadata:"
            cat "$WORKING_DIR/.session"
        fi

        # Check for config file
        if [ -f "$WORKING_DIR/config.json" ]; then
            echo "✓ Config file was saved"
        fi
    else
        echo "✗ Session directory not found at: $WORKING_DIR"
    fi

    echo
    echo "Checking session list..."
    SESSIONS=$(curl -s "$API_URL/sessions")
    echo "Sessions response:"
    echo "$SESSIONS" | jq .

    # Check if our session appears in the list
    if echo "$SESSIONS" | jq -e ".sessions[] | select(.sessionId == \"$SESSION_ID\")" > /dev/null 2>&1; then
        echo "✓ Session appears in session list"
    else
        echo "✗ Session not found in list"
    fi

    echo
    echo "To stop the test session, run:"
    echo "  curl -X POST $API_URL/sessions/$SESSION_ID/stop"

else
    echo "✗ Failed to create session"
    exit 1
fi

echo
echo "=== Test completed ==="