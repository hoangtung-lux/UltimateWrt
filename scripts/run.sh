#!/bin/bash
# run.sh – Ghi lại nhật ký mọi lệnh thực thi
LOGFILE="audit_$(date +%Y%m%d_%H%M%S).log"
echo "$ $@" >> "$LOGFILE"
"$@" 2>&1 | tee -a "$LOGFILE"
