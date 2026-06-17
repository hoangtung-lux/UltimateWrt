#!/bin/bash
# validate.sh - simple staged integrity checks
set -euo pipefail

echo "Kiểm tra host tools..."
for tool in git make gcc g++ awk perl python3 rsync unzip file wget; do
  command -v "$tool" >/dev/null 2>&1 && echo "OK $tool" || { echo "FAIL $tool"; exit 1; }
done

echo "Kiểm tra OpenWrt tree..."
[[ -f openwrt/feeds.conf.default && -x openwrt/scripts/feeds ]] && echo "OK" || { echo "FAIL"; exit 1; }

echo "Kiểm tra .config..."
[[ -f openwrt/.config ]] && echo "OK" || { echo "FAIL"; exit 1; }

if [[ -f preflight.py ]]; then
  python3 preflight.py
elif [[ -f ../preflight.py ]]; then
  python3 ../preflight.py
else
  echo "WARN: preflight.py not found; skipped kernel check"
fi
