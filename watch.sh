#!/bin/zsh

YOUR_COMMAND="just build"
DIRECTORY_PATH="./app"
LAST_EXECUTION_TIME=0

trigger_command() {
  CURRENT_TIME=$(date +%s)
  if (( CURRENT_TIME - LAST_EXECUTION_TIME >= 2.5 )); then
    eval $YOUR_COMMAND
    LAST_EXECUTION_TIME=$CURRENT_TIME
  fi
}

fswatch -0 $DIRECTORY_PATH | while read -d "" event; do
  trigger_command
done
