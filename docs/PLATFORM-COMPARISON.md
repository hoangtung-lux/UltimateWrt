# Platform Comparison: theultimate

> Tài liệu quyết định platform và config platform-specific.

---

## Decision Matrix

| Nhu cầu | MediaTek Filogic | NanoPi R5S | NanoPi R6S | N100 Mini PC |
|:---|:---|:---|:---|:---|
| WAN ≤ 1 Gbps | ✅ | ✅ | ✅ | ✅ |
| WAN 1–2.5 Gbps | ⚠️ cần SFE | ✅ | ✅ | ✅ |
| Nhiều user >30 | ⚠️ | ✅ | ✅ | ✅ |
| IPTV multicast | ✅ | ✅ | ✅ | ✅ |
| WireGuard nhanh | ❌ | ⚠️ | ✅ | ✅ |
| WiFi onboard | ✅ | ❌ | ❌ | ❌ |
| Dễ recover | ⚠️ TFTP | ✅ MicroSD | ✅ MicroSD | ✅ USB/SSD |

---

## Build Differences

| Platform | OpenWrt | Kernel | Offloading | Image |
|:---|:---|:---|:---|:---|
| MediaTek Filogic | 23.05.5 | 5.15.x | SFE + turboacc | squashfs-sysupgrade.bin |
| Rockchip NanoPi | 23.05.5 | 5.15.x | kernel software offload | squashfs-sysupgrade.img.gz |
| Intel N100 | 24.10.x, alpha tested v24.10.7 | 6.6.x | nftables flowtable + software offload | ext4-combined-efi.img.gz |

---

## Key Packages

```text
# MediaTek
kmod-mt76, luci-app-turboacc, kmod-sched-cake

# Rockchip
kmod-igc, kmod-r8169, kmod-crypto-hw-rockchip, irqbalance

# x86 N100
kmod-igc, kmod-r8125, kmod-e1000e, grub2-efi-x86_64, kmod-nvme, kmod-ata-ahci, irqbalance, block-mount, ethtool, pciutils, usbutils
```

---

## ISP Config Differences

Phần PPPoE/VLAN/MTU/MSS giống nhau về logic, chỉ khác interface name.

| Platform | WAN Interface Rule | Ví dụ VLAN |
|:---|:---|:---|
| MediaTek | thường `eth0`/`eth1`, verify trước | `<WAN_IF>.35` |
| NanoPi R5S/R6S | thường `eth0`, verify trước | `<WAN_IF>.35` |
| N100 Mini PC | không hardcode; verify bằng `ip link`/`lspci` | `<WAN_IF>.35` |

---

## Patch Application per Platform

```text
Platform          | P-001 SFE | P-002 TurboACC | P-003 MT76 | P-004 igc | P-005/006 NanoPi DTS
------------------|-----------|----------------|------------|-----------|--------------------
MediaTek Filogic  | APPLY     | APPLY          | APPLY      | SKIP      | SKIP
Rockchip NanoPi   | SKIP      | SKIP           | SKIP       | VERIFY    | VERIFY
Intel N100 x86    | SKIP      | SKIP           | SKIP       | SKIP      | SKIP
```

---

## Recommended Use Cases Vietnam

### Hộ gia đình gói ≤500 Mbps
MediaTek Filogic nếu cần WiFi onboard và giá rẻ.

### Hộ gia đình 1Gbps nhiều thiết bị
NanoPi R5S hoặc N100.

### Multi-WAN / VPN / 2.5GbE
N100 4-NIC hoặc NanoPi R6S sau khi support verified.
