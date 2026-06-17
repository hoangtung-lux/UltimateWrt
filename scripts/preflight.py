#!/usr/bin/env python3
import os
import shutil
import sys
from pathlib import Path

EXPECTED_KERNEL = {
    "mediatek": "5.15",   # 23.05.x default expectation
    "rockchip": "5.15",   # 23.05.x default expectation
    "x86_64": "6.6",      # build.py targets OpenWrt 24.10.x for N100
}

REQUIRED_HOST_TOOLS = ["git", "make", "gcc", "g++", "awk", "perl", "python3", "rsync", "unzip", "file", "wget"]


def fail(msg: str) -> None:
    print(f"ERROR: {msg}")
    sys.exit(1)


def check_host_tools() -> None:
    missing = [tool for tool in REQUIRED_HOST_TOOLS if shutil.which(tool) is None]
    if missing:
        fail("Thiếu host tools: " + ", ".join(missing) + ". Chạy ./setup_ubuntu.sh trước.")
    print("Host tools OK")


def check_kernel(config_path: str) -> None:
    path = Path(config_path)
    if not path.exists():
        fail(f"File {config_path} không tồn tại.")

    content = path.read_text(encoding="utf-8", errors="replace")

    if "CONFIG_TARGET_mediatek=y" in content:
        target = "mediatek"
    elif "CONFIG_TARGET_rockchip=y" in content:
        target = "rockchip"
    elif "CONFIG_TARGET_x86_64=y" in content:
        target = "x86_64"
    else:
        fail("Unknown target")

    kernel_line = f"CONFIG_LINUX_{EXPECTED_KERNEL[target].replace('.', '_')}=y"
    if kernel_line not in content:
        fail(f"Kernel không đúng cho profile hiện tại. Cần {EXPECTED_KERNEL[target]}, nhưng .config không có {kernel_line}")
    print(f"Kernel OK: {EXPECTED_KERNEL[target]}")

    if target != "mediatek" and "CONFIG_PACKAGE_kmod-sfe=y" in content:
        fail("Cấm SFE trên non-MediaTek platform")

    print("Pre-flight kiểm tra OK. Có thể build.")


if __name__ == "__main__":
    check_host_tools()
    check_kernel(os.environ.get("OPENWRT_CONFIG", "openwrt/.config"))
