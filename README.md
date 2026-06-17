# UltimateWrt

**UltimateWrt** is an open-source OpenWrt-based firmware profile focused on Vietnamese home networks, homelabs, mini PCs, and access points.

The goal is not to replace OpenWrt, but to provide a curated and opinionated firmware profile with better defaults for users in Vietnam: DNS, QoS, VPN, multi-WAN, local network management, and international connectivity presets.

> Status: **Alpha / Paused / Looking for testers and contributors**  
> Main target: **x86/64 mini PCs, especially Intel N100**  
> Future targets: **NanoPi R5S/R6S, MediaTek OpenWrt APs, and other community-tested devices**

## Why UltimateWrt?

OpenWrt is powerful, but new users often need to manually choose packages, configure DNS, tune SQM/QoS, set up VPN, and build a clean homelab/router profile.

UltimateWrt aims to make this easier by providing:

- Curated OpenWrt package selection
- Vietnam-friendly network presets
- DNS and ad-blocking profiles
- SQM/QoS presets for low-latency networks
- Multi-WAN and failover-ready package selection
- Tailscale/WireGuard-ready remote access
- LuCI dashboard ideas for easier status checking
- Release metadata for verification and reproducibility

## Current status

Current practical target:

| Target | Status | Notes |
|---|---|---|
| x86/64 N100 | Alpha | Main profile |
| NanoPi R5S | Planned / experimental | Needs hardware testing |
| Xiaomi AX3000T / MediaTek Filogic AP | Planned / experimental | Needs hardware testing |

This project is maintained by an individual student developer. Development may be slow because hardware testing is limited.

## Repository layout

```text
applications/luci-app-theultimate/  # LuCI dashboard package
profiles/                           # Package lists per target
files/                              # First-boot defaults / uci-defaults overlays
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

## Safety warning

This firmware is currently an **alpha build**.

Do not flash it on your only router unless you understand recovery and rollback.

Before testing:

- Back up your current firmware/config
- Prepare a recovery USB or serial access if possible
- Verify checksum before flashing
- Read the flash and rollback documentation
- Test in a VM or spare device first if possible

## Contributing

Contributions are welcome, especially:

- Real hardware test reports
- Documentation improvements
- Vietnamese ISP/network profile suggestions
- OpenWrt package/profile suggestions
- LuCI dashboard improvements
- Build and release automation
- Support for NanoPi R5S/R6S and MediaTek AP targets

Please open an issue before large changes.

## License

UltimateWrt is an open-source project based on OpenWrt.

This repository keeps build scripts, package lists, overlays and documentation available so that users and contributors can inspect and rebuild the firmware.

See [LICENSE](LICENSE), [NOTICE.md](NOTICE.md), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Disclaimer

UltimateWrt is provided as-is, without warranty.

Flashing custom firmware can brick devices or cause network downtime. Use at your own risk.
