#!/bin/bash
sleep 15
if pgrep -f "api-0.0.1-SNAPSHOT.jar" > /dev/null; then
    echo "Application is running"
    exit 0
else
    echo "Application failed to start"
    exit 1
fi