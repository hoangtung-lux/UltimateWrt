#!/bin/bash
# setup_ubuntu.sh - run inside WSL Ubuntu, not Windows CMD/PowerShell
set -euo pipefail

echo "=================================================="
echo "    Setup Build Environment for The Ultimate      "
echo "=================================================="

if [[ ! -f /etc/os-release ]]; then
  echo "ERROR: Script này phải chạy trong Ubuntu/WSL Linux, không chạy trực tiếp trên Windows."
  exit 1
fi

source /etc/os-release
echo "Current OS: $PRETTY_NAME"

if [[ "${VERSION_ID:-}" != "22.04" && "${VERSION_ID:-}" != "24.04" ]]; then
  echo "WARNING: Prefer Ubuntu 22.04 or 24.04 for OpenWrt build."
fi

echo "==> Installing OpenWrt build dependencies..."
sudo apt-get update
COMMON_PKGS=(
  build-essential clang flex bison g++ gawk gcc-multilib g++-multilib gettext git
  libncurses-dev libssl-dev python3 python3-setuptools python3-dev python3-venv rsync swig unzip
  zlib1g-dev file wget curl subversion help2man zstd patch diffutils time ccache
)

# Ubuntu 24.04 uses Python 3.12; python3-distutils has no installable candidate there.
# Keep it only for Ubuntu 22.04/Jammy or systems where apt reports a real candidate.
DISTUTILS_CANDIDATE="$(apt-cache policy python3-distutils 2>/dev/null | awk '/Candidate:/ {print $2}')"
if [[ "${VERSION_ID:-}" == "22.04" && -n "$DISTUTILS_CANDIDATE" && "$DISTUTILS_CANDIDATE" != "(none)" ]]; then
  COMMON_PKGS+=(python3-distutils)
else
  echo "Skipping python3-distutils: not installable/needed on this Ubuntu release."
fi

sudo apt-get install -y "${COMMON_PKGS[@]}"

echo "==> Preparing workspace in WSL home directory (~/theultimate)..."
mkdir -p "$HOME/theultimate"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$SCRIPT_DIR/build.py" ]]; then
  cp "$SCRIPT_DIR/build.py" "$HOME/theultimate/build.py"
elif [[ -f "/mnt/c/Users/Admin/Documents/theultimate/build.py" ]]; then
  cp "/mnt/c/Users/Admin/Documents/theultimate/build.py" "$HOME/theultimate/build.py"
else
  echo "ERROR: Could not find build.py beside setup_ubuntu.sh or in /mnt/c/Users/Admin/Documents/theultimate/."
  exit 1
fi
chmod +x "$HOME/theultimate/build.py"

# Copy optional helper scripts using original names, if present.
for helper in preflight.py validate.sh run.sh; do
  if [[ -f "$SCRIPT_DIR/$helper" ]]; then
    cp "$SCRIPT_DIR/$helper" "$HOME/theultimate/$helper"
    chmod +x "$HOME/theultimate/$helper" 2>/dev/null || true
  elif [[ -f "/mnt/c/Users/Admin/Documents/theultimate/$helper" ]]; then
    cp "/mnt/c/Users/Admin/Documents/theultimate/$helper" "$HOME/theultimate/$helper"
    chmod +x "$HOME/theultimate/$helper" 2>/dev/null || true
  fi
done

echo ""
echo "=================================================="
echo "Setup complete. Start the build with:"
echo "cd ~/theultimate"
echo "python3 build.py n100 --no-make   # smoke-test config first"
echo "python3 preflight.py              # optional sanity check"
echo "python3 build.py n100             # full build"
echo "=================================================="
