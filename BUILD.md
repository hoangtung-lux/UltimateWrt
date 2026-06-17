# Build Guide

Current practical goal: build all three firmware profiles with low disk usage.

This repo uses OpenWrt ImageBuilder by default. ImageBuilder assembles firmware
from official OpenWrt packages instead of compiling the full OpenWrt source tree.
Use full-source builds only when you need custom kernel patches or packages that
do not exist upstream.

## Supported Profiles

| Local name | Device | OpenWrt | Target | ImageBuilder profile |
|:---|:---|:---|:---|:---|
| `xiaomi-ax3000t` | Xiaomi Mi Router AX3000T | 23.05.5 | `mediatek/filogic` | `xiaomi_mi-router-ax3000t` |
| `nanopi-r5s` | FriendlyARM NanoPi R5S | 25.12.4 | `rockchip/armv8` | `friendlyarm_nanopi-r5s` |
| `n100` | Intel N100 mini PC | 23.05.5 | `x86/64` | `generic` |

NanoPi R5S is intentionally on `25.12.4`: the official `23.05.5`
`rockchip/armv8` release index does not include R5S images, while `25.12.4`
does. AX3000T and N100 stay on `23.05.5` because that is the project baseline
and a known-good starting point for those profiles.

## One-time VM setup

Run this inside Ubuntu/Debian, WSL, or a Linux VM:

```bash
sudo apt update
sudo apt install -y build-essential libncurses-dev gawk git unzip \
  python3 python3-distutils libssl-dev wget file rsync subversion \
  help2man flex bison zstd ca-certificates
```

## Preflight

```bash
python3 preflight.py all
python3 build.py all --dry-run
```

## Build one profile

```bash
python3 build.py xiaomi-ax3000t --clean-work
python3 build.py nanopi-r5s --clean-work
python3 build.py n100 --clean-work
```

## Build everything

```bash
python3 build.py all --clean-work
```

Outputs are copied into:

```text
artifacts/<platform>/<openwrt-version>/
```

`--clean-work` deletes only the extracted ImageBuilder directory after artifacts
are copied. Downloaded archives stay in `downloads/`, so the next rebuild does
not need to download them again.

On Linux, the default work directory is `/tmp/theultimate-openwrt-work`. This
keeps the actual `make image` path short and ASCII-only even if the repo lives in
a Windows path with spaces or Vietnamese characters. Override it when needed:

```bash
python3 build.py all --work-dir /mnt/bigdisk/theultimate-work --clean-work
```

## Offline rebuild

If the VM has no network, place each ImageBuilder archive and its `sha256sums`
file under:

```text
downloads/<openwrt-version>/<target-slug>/
```

Examples:

```text
downloads/23.05.5/mediatek-filogic/openwrt-imagebuilder-23.05.5-mediatek-filogic.Linux-x86_64.tar.xz
downloads/23.05.5/mediatek-filogic/sha256sums
downloads/25.12.4/rockchip-armv8/openwrt-imagebuilder-25.12.4-rockchip-armv8.Linux-x86_64.tar.zst
downloads/25.12.4/rockchip-armv8/sha256sums
```

Then run:

```bash
python3 build.py all --no-download --clean-work
```

## Profile inputs

Package lists:

```text
profiles/xiaomi-ax3000t/packages.txt
profiles/nanopi-r5s/packages.txt
profiles/n100/packages.txt
```

First-boot defaults:

```text
files/xiaomi-ax3000t/etc/uci-defaults/
files/nanopi-r5s/etc/uci-defaults/
files/n100/etc/uci-defaults/
```

The overlays do not hardcode WAN/LAN ports or ISP credentials. Interface order
must be verified after first boot with `ip link`, `lspci`, or LuCI.

## Flash targets

Use the generated files matching the device:

```text
openwrt-23.05.5-mediatek-filogic-xiaomi_mi-router-ax3000t-squashfs-sysupgrade.bin
openwrt-25.12.4-rockchip-armv8-friendlyarm_nanopi-r5s-squashfs-sysupgrade.img.gz
openwrt-23.05.5-x86-64-generic-ext4-combined-efi.img.gz
```

Keep the image, manifest, sha256sums, and `BUILD-INFO.txt` outside the VM before
deleting the VM disk.
