#!/bin/bash
if pgrep -f "api-0.0.1-SNAPSHOT.jar" > /dev/null; then
    pkill -f "api-0.0.1-SNAPSHOT.jar"
    sleep 2
fi