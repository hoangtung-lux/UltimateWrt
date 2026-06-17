# UltimateWrt

**UltimateWrt** is an open-source OpenWrt-based firmware profile focused on Vietnamese home networks, homelabs, mini PCs, and access points.

UltimateWrt does not aim to replace OpenWrt. Instead, it provides a curated and opinionated OpenWrt profile with better defaults for users in Vietnam, including DNS, QoS, VPN, multi-WAN, local network management, and international connectivity presets.

> Status: **Alpha / Paused / Looking for testers and contributors**
> Main target: **x86/64 mini PCs, especially Intel N100**
> Future targets: **NanoPi R5S/R6S, MediaTek OpenWrt APs, and other community-tested devices**

## Latest Alpha Release

* [UltimateWrt N100 Alpha 2026-06-03](https://github.com/hoangtung-lux/UltimateWrt/releases/tag/v0.1.0-alpha-n100)

This is a pre-release build for x86/64 N100-class mini PCs. Community testing is needed.

Recommended download:

```text
n100-openwrt-alpha-20260603.tar.gz
```

Before flashing, verify the checksum:

```bash
sha256sum -c sha256sums
```

## Why UltimateWrt?

OpenWrt is powerful, but new users often need to manually choose packages, configure DNS, tune SQM/QoS, set up VPN, prepare multi-WAN, and build a clean router or homelab profile.

UltimateWrt aims to make this easier by providing:

* Curated OpenWrt package selection
* Vietnam-friendly network presets
* DNS and ad-blocking profiles
* SQM/QoS presets for low-latency networks
* Multi-WAN and failover-ready package selection
* Tailscale/WireGuard-ready remote access
* LuCI dashboard ideas for easier status checking
* Release metadata for verification and reproducibility

## Current Status

| Target                | Status                 | Notes                  |
| --------------------- | ---------------------- | ---------------------- |
| x86/64 N100           | Alpha                  | Main profile           |
| NanoPi R5S            | Planned / experimental | Needs hardware testing |
| NanoPi R6S            | Planned / experimental | Needs hardware testing |
| MediaTek / Filogic AP | Planned / experimental | Needs hardware testing |
| Xiaomi AX3000T        | Planned / experimental | Needs hardware testing |

This project is maintained by an individual student developer. Development may be slow because hardware testing is limited.

## Repository Layout

```text
applications/luci-app-theultimate/  # LuCI dashboard package
profiles/                           # Package lists per target
files/                              # First-boot defaults and overlay files
scripts/                            # Build and validation scripts
docs/                               # Planning, testing, hardware and roadmap notes
BUILD.md                            # Build guide
```

Firmware images should be published as **GitHub Release assets**, not committed directly into the Git repository.

## Build

See [BUILD.md](BUILD.md).

Basic flow:

```bash
python3 scripts/preflight.py all
python3 scripts/build.py all --dry-run
python3 scripts/build.py n100 --clean-work
```

## Safety Warning

This firmware is currently an **alpha build**.

Do not flash it on your only router unless you understand recovery and rollback.

Before testing:

* Back up your current firmware/config
* Prepare a recovery USB or serial access if possible
* Verify checksum before flashing
* Read the flash and rollback documentation
* Test in a VM or spare device first if possible

## Tester Checklist

When reporting a test result, please include:

* Device model
* Boot mode: UEFI or legacy BIOS
* Image file used
* Boot result
* LAN/WAN detection
* DHCP status
* LuCI access status
* Internet connectivity status
* DNS status
* Reboot persistence
* Relevant logs if something fails

## Project Goals

UltimateWrt focuses on practical home and homelab networking in Vietnam:

* Stable home router profile
* Homelab-friendly DNS and routing
* Better international connectivity presets
* Low-latency gaming and video-call profile
* Multi-WAN and 4G/5G backup readiness
* VLAN-ready LAN design
* AP mode profile for MediaTek/OpenWrt access points
* Documentation for Vietnamese users

## Planned Profiles

| Profile              | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| VN Home Basic        | Simple home router preset                          |
| VN Gamer Low Latency | SQM/QoS and latency-focused preset                 |
| VN Homelab           | DNS, VLAN, VPN, and local service discovery preset |
| VN Multi-WAN         | Main WAN + backup WAN / 4G / 5G profile            |
| VN AP Mode           | Dumb AP / VLAN SSID profile                        |
| VN IoT Safe Mode     | Isolated IoT network profile                       |

## Contributing

Contributions are welcome, especially:

* Real hardware test reports
* Documentation improvements
* Vietnamese ISP/network profile suggestions
* OpenWrt package/profile suggestions
* LuCI dashboard improvements
* Build and release automation
* Support for NanoPi R5S/R6S and MediaTek AP targets

Please open an issue before large changes.

## License

UltimateWrt is an open-source project based on OpenWrt.

This repository keeps build scripts, package lists, overlays and documentation available so that users and contributors can inspect and rebuild the firmware.

See [LICENSE](LICENSE), [NOTICE.md](NOTICE.md), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Disclaimer

UltimateWrt is provided as-is, without warranty.

Flashing custom firmware can brick devices or cause network downtime. Use at your own risk.
