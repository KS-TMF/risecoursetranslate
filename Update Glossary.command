#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "  Syncing Translation Glossary.csv into your course..."
echo ""
python3 scripts/update-glossary.py "$@"
STATUS=$?
echo ""
if [ $STATUS -eq 0 ]; then
  osascript -e 'display notification "Translation Glossary.csv synced." with title "Glossary updated"' 2>/dev/null || true
  echo "  You can close this window."
else
  echo "  Put Translation Glossary.csv in Downloads, then try again."
  echo ""
fi
read -n 1 -s -r -p "Press any key to close..."
