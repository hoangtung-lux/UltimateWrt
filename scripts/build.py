#!/usr/bin/env python3
"""OpenWrt firmware builder with QA guardrails for WSL/Linux builds."""
import argparse
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

# Kernel 6.6 belongs to OpenWrt 24.10.x, not 23.05.x.
# For 23.05.x builds, change this to v23.05.5 and use CONFIG_LINUX_5_15 instead.
OPENWRT_VERSION = "v24.10.7"
WORKDIR = Path("openwrt")

HOST_TOOLS = [
    "git", "make", "gcc", "g++", "awk", "perl", "python3", "rsync", "unzip", "file", "wget"
]


def fail(message: str, code: int = 1) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    sys.exit(code)


def require_linux_build_host() -> None:
    system = platform.system().lower()
    if system != "linux":
        fail(
            "OpenWrt buildroot phải chạy trong Linux/WSL Ubuntu, không chạy trực tiếp bằng Windows Python. "
            "Hãy mở Ubuntu/WSL rồi chạy: cd ~/theultimate && python3 build.py n100"
        )


def require_host_tools() -> None:
    missing = [tool for tool in HOST_TOOLS if shutil.which(tool) is None]
    if missing:
        fail(
            "Thiếu build tools: " + ", ".join(missing) + "\n"
            "Chạy trước: ./setup_ubuntu.sh\n"
            "Tối thiểu cần gói build-essential để có make/gcc/g++."
        )


def run(cmd, cwd: Path | str = WORKDIR, stream: bool = False) -> str:
    print("==>", " ".join(str(part) for part in cmd))
    if stream:
        proc = subprocess.Popen(
            cmd,
            cwd=str(cwd),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
        output_lines: list[str] = []
        assert proc.stdout is not None
        for line in proc.stdout:
            print(line, end="")
            output_lines.append(line)
        proc.wait()
        if proc.returncode != 0:
            fail(f"Command failed with exit code {proc.returncode}: {' '.join(cmd)}")
        return "".join(output_lines)

    result = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True)
    if result.returncode != 0:
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        fail(f"Command failed with exit code {result.returncode}: {' '.join(cmd)}")
    if result.stdout:
        print(result.stdout)
    return result.stdout


def setup_env() -> None:
    require_linux_build_host()
    require_host_tools()

    if not WORKDIR.exists():
        run(
            ["git", "clone", "https://github.com/openwrt/openwrt.git", "-b", OPENWRT_VERSION, "--depth=1", str(WORKDIR)],
            cwd=Path("."),
        )
    elif not (WORKDIR / "scripts" / "feeds").exists():
        fail("Thư mục openwrt đã tồn tại nhưng không giống OpenWrt tree hợp lệ. Xóa/đổi tên rồi chạy lại.")

    run(["./scripts/feeds", "update", "-a"], cwd=WORKDIR)
    run(["./scripts/feeds", "install", "-a"], cwd=WORKDIR)


PLATFORM_CONFIGS = {
    "xiaomi-ax3000t": """\
CONFIG_TARGET_mediatek=y
CONFIG_TARGET_mediatek_filogic=y
CONFIG_TARGET_mediatek_filogic_DEVICE_xiaomi_redmi-router-ax3000t=y
CONFIG_PACKAGE_luci=y""",

    "nanopi-r5s": """\
CONFIG_TARGET_rockchip=y
CONFIG_TARGET_rockchip_armv8=y
CONFIG_TARGET_rockchip_armv8_DEVICE_friendlyarm_nanopi-r5s=y
CONFIG_PACKAGE_luci=y
CONFIG_PACKAGE_kmod-r8169=y
CONFIG_PACKAGE_irqbalance=y""",

    "n100": """\
# --- Target ---
CONFIG_TARGET_x86=y
CONFIG_TARGET_x86_64=y
CONFIG_TARGET_x86_64_DEVICE_generic=y

# --- Kernel: OpenWrt 24.10.x uses Linux 6.6 ---
CONFIG_LINUX_6_6=y

# --- Boot (UEFI) ---
CONFIG_GRUB_EFI_IMAGES=y
CONFIG_PACKAGE_grub2-efi-x86_64=y

# --- Filesystem (SSD/ext4) ---
CONFIG_TARGET_ROOTFS_EXT4FS=y

# --- NIC Drivers for common Intel N100 boxes ---
CONFIG_PACKAGE_kmod-igc=y
CONFIG_PACKAGE_kmod-r8125=y
CONFIG_PACKAGE_kmod-e1000e=y

# --- Storage Drivers ---
CONFIG_PACKAGE_kmod-nvme=y
CONFIG_PACKAGE_kmod-ata-ahci=y
CONFIG_PACKAGE_block-mount=y

# --- System Performance ---
CONFIG_PACKAGE_irqbalance=y

# --- Diagnostics ---
CONFIG_PACKAGE_ethtool=y
CONFIG_PACKAGE_lsblk=y
CONFIG_PACKAGE_pciutils=y
CONFIG_PACKAGE_usbutils=y

# --- LuCI Web Interface ---
CONFIG_PACKAGE_luci=y
CONFIG_PACKAGE_luci-ssl=y

# --- WiFi USB/PCIe optional dongles ---
CONFIG_PACKAGE_kmod-mt7921u=y
CONFIG_PACKAGE_kmod-mt7921e=y

# --- PPPoE ---
CONFIG_PACKAGE_ppp=y
CONFIG_PACKAGE_ppp-mod-pppoe=y
CONFIG_PACKAGE_kmod-pppoe=y

# --- IPv6 ---
CONFIG_PACKAGE_odhcp6c=y
CONFIG_PACKAGE_odhcpd-ipv6only=y

# --- Flow Offloading (nftables/kernel 6.x) ---
CONFIG_PACKAGE_kmod-nft-offload=y

# --- Useful extras ---
CONFIG_PACKAGE_iperf3=y
CONFIG_PACKAGE_nano=y
CONFIG_PACKAGE_htop=y
CONFIG_PACKAGE_curl=y
CONFIG_PACKAGE_wget-ssl=y""",
}


def setup_isp_overlay() -> None:
    files_dir = WORKDIR / "files"

    bin_dir = files_dir / "usr" / "bin"
    bin_dir.mkdir(parents=True, exist_ok=True)
    isp_script = bin_dir / "isp-detect.sh"
    isp_script.write_text(
        """#!/bin/sh
# PPPoE VLAN probe. Usage: ISP_BASE_IF=eth0 isp-detect.sh
set -u
BASE_IF="${ISP_BASE_IF:-eth0}"
VLANS="${ISP_VLANS:-35 10 11}"

if ! ip link show "$BASE_IF" >/dev/null 2>&1; then
    logger -t isp-detect "Base interface $BASE_IF not found"
    exit 1
fi

if ! command -v pppoe-discovery >/dev/null 2>&1; then
    logger -t isp-detect "pppoe-discovery not installed; skipping VLAN probe"
    exit 0
fi

for vlan in $VLANS; do
    DEV="$BASE_IF.$vlan"
    ip link add link "$BASE_IF" name "$DEV" type vlan id "$vlan" 2>/dev/null || true
    ip link set "$DEV" up
    if pppoe-discovery -I "$DEV" 2>/dev/null | grep -q "AC-Name"; then
        logger -t isp-detect "ISP PPPoE access concentrator found on VLAN $vlan via $DEV"
        exit 0
    fi
    ip link delete "$DEV" 2>/dev/null || true
done

logger -t isp-detect "No PPPoE access concentrator found on VLANs: $VLANS"
exit 0
""",
        encoding="utf-8",
    )
    isp_script.chmod(0o755)

    uci_dir = files_dir / "etc" / "uci-defaults"
    uci_dir.mkdir(parents=True, exist_ok=True)
    mss_script = uci_dir / "99-mss-clamping"
    mss_script.write_text(
        """#!/bin/sh
# Create a dedicated TCP MSS clamp rule instead of overwriting firewall.@rule[-1].
set -e
uci -q batch <<'EOF'
add firewall rule
set firewall.@rule[-1].name='MSS-Clamping-PPPoE'
set firewall.@rule[-1].src='wan'
set firewall.@rule[-1].proto='tcp'
set firewall.@rule[-1].tcp_flags='SYN,RST SYN'
set firewall.@rule[-1].target='TCPMSS'
set firewall.@rule[-1].set_mss='1452'
commit firewall
EOF
exit 0
""",
        encoding="utf-8",
    )
    mss_script.chmod(0o755)
    print("ISP overlay files created.")


def write_config(target_platform: str) -> None:
    if target_platform not in PLATFORM_CONFIGS:
        fail(f"Unknown platform: {target_platform}. Available: {', '.join(PLATFORM_CONFIGS.keys())}")
    (WORKDIR / ".config").write_text(PLATFORM_CONFIGS[target_platform] + "\n", encoding="utf-8")
    print(f"Wrote .config for platform: {target_platform}")


def build_platform(target_platform: str, no_make: bool = False) -> None:
    write_config(target_platform)
    setup_isp_overlay()
    run(["make", "defconfig"], cwd=WORKDIR)

    if no_make:
        print("Config written. Build disabled (--no-make).")
        return

    jobs = str(os.cpu_count() or 1)
    print("==> Downloading sources...")
    run(["make", "download", f"-j{jobs}"], cwd=WORKDIR)

    print(f"==> Building firmware with {jobs} jobs...")
    run(["make", f"-j{jobs}", "V=s"], cwd=WORKDIR, stream=True)

    print("\n" + "=" * 60)
    print("BUILD COMPLETE!")
    print("=" * 60)
    target_dir = WORKDIR / "bin" / "targets"
    if target_dir.exists():
        for path in target_dir.rglob("*"):
            if path.is_file() and path.stat().st_size > 1024 * 1024:
                print(f"  {path} ({path.stat().st_size / (1024 * 1024):.1f} MB)")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="theultimate — OpenWrt Firmware Builder",
        epilog="Platforms: " + ", ".join(PLATFORM_CONFIGS.keys()),
    )
    parser.add_argument("platform", choices=PLATFORM_CONFIGS.keys(), help="Target platform to build")
    parser.add_argument("-n", "--no-make", action="store_true", help="Only write .config and run defconfig")
    args = parser.parse_args()

    setup_env()
    build_platform(args.platform, no_make=args.no_make)


if __name__ == "__main__":
    main()
