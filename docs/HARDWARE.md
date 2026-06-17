# Hardware Targets: theultimate

## Platform Families

Dự án hỗ trợ 3 nền tảng phần cứng. Mỗi nền tảng có build target, driver stack, và optimization strategy riêng.

| Platform | Device | Architecture | OpenWrt Target | Tier |
|:---|:---|:---|:---|:---|
| Embedded ARM | Xiaomi AX3000T | Cortex-A53 | `mediatek/filogic` | 1 |
| Embedded ARM | Belkin RT3200 | Cortex-A53 | `mediatek/mt7622` | 2 |
| Embedded MIPS | Xiaomi 4A Gigabit | MIPS 1004KEc | `ramips/mt7621` | 2 |
| SBC / Soft Router | NanoPi R5S | Cortex-A55 | `rockchip/armv8` | 1 |
| SBC / Soft Router | NanoPi R6S | Cortex-A76+A55 | `rockchip/armv8` | 1 |
| Mini PC / x86 | Intel N100 Mini PC | x86_64 | `x86/64` | 1 |

> Tier 1 = primary dev & test. Tier 2 = best-effort.

---

## Version Matrix

| Platform | OpenWrt | Kernel | Lý do |
|:---|:---|:---|:---|
| MediaTek Filogic | 23.05.5 | 5.15.x | SFE/MT76 patch track hiện tại |
| Rockchip RK3568/88 | 23.05.5 | 5.15.x | Stable profile/patch track hiện tại |
| Intel N100 x86_64 | 24.10.x, alpha tested `v24.10.7` | 6.6.x | i226/igc support tốt, build alpha đã pass |

---

## Platform A — MediaTek Filogic

| Chipset | Core | Max Throughput | Device |
|:---|:---|:---|:---|
| MT7981B (Filogic 820) | 2× A53 @ 1.3 GHz | ~900 Mbps với SFE | Xiaomi AX3000T |
| MT7986A/B (Filogic 830) | 4× A53 @ 2.0 GHz | ~1.8 Gbps với SFE | Xiaomi AX6000 |
| MT7622B | 2× A53 @ 1.35 GHz | ~700 Mbps với SFE | Belkin RT3200 |

```text
OpenWrt Target  : mediatek/filogic
OpenWrt Version : 23.05.5
Kernel          : 5.15.x
WiFi Driver     : mt76 / optional ImmortalWrt patches
Offloading      : SFE + Flow Offloading (luci-app-turboacc)
Image Format    : squashfs-sysupgrade.bin
```

---

## Platform B — Rockchip NanoPi R5S / R6S

### NanoPi R5S — RK3568B2

```text
SoC     : Rockchip RK3568B2
CPU     : 4× Cortex-A55 @ 2.0 GHz
RAM     : 4 GB LPDDR4
Storage : 8 GB eMMC + MicroSD
NICs    : eth0 = 2.5 GbE Intel i225-V (igc)
          eth1/2 = 1 GbE Realtek RTL8211F (r8169)
Boot    : eMMC / MicroSD recovery
```

### NanoPi R6S — RK3588S

```text
SoC     : Rockchip RK3588S
CPU     : 4× Cortex-A76 @ 2.4 GHz + 4× Cortex-A55 @ 1.8 GHz
RAM     : 8 GB LPDDR4X
Storage : 32 GB eMMC + MicroSD
NICs    : eth0 = 2.5 GbE Intel i225-V (igc)
          eth1/2 = 1 GbE Realtek RTL8211F (r8169)
Boot    : eMMC / MicroSD recovery
```

```text
OpenWrt Target  : rockchip/armv8
OpenWrt Version : 23.05.5
Kernel          : 5.15.x
Offloading      : kernel software offload, KHÔNG dùng SFE
NIC Drivers     : igc, r8169
Image Format    : squashfs-sysupgrade.img.gz
```

R6S vẫn cần verify support/profile trước khi build vì RK3588S support có thể khác giữa OpenWrt/FriendlyWrt.

---

## Platform C — Intel N100 Mini PC

```text
CPU     : Intel N100 (Alder Lake-N), 4× E-core
RAM     : 8–16 GB DDR4/DDR5 tùy model
Storage : M.2 NVMe / SATA SSD / USB test disk
NICs    : Intel i226-V 2.5GbE (igc) phổ biến
          Realtek RTL8125 2.5GbE (r8125) một số model
Boot    : UEFI, dùng combined-efi image
```

```text
OpenWrt Target  : x86/64
OpenWrt Version : 24.10.x, alpha tested v24.10.7
Kernel          : 6.6.x
Offloading      : kernel software offload + nftables flowtable + IRQ balancing
NIC Drivers     : kmod-igc, kmod-r8125, kmod-e1000e
Image Format    : openwrt-x86-64-generic-ext4-combined-efi.img.gz
Filesystem      : ext4 khuyến nghị cho SSD/USB writable rootfs
```

### Common Mini PC Models

| Model | NICs | RAM Max | Notes |
|:---|:---|:---|:---|
| Beelink EQ12 | 2× i226-V | 16 GB | BIOS tốt, phổ biến |
| Trigkey G4 | 2× i226-V | 16 GB | Giá rẻ hơn |
| CWWK N100 | 4× i226-V | 16 GB | Hợp multi-WAN |
| Topton N100 | 4–6× i226-V | 32 GB | Nhiều biến thể |

### Packages bổ sung cho x86

```text
kmod-igc, kmod-r8125, kmod-e1000e
kmod-nvme, kmod-ata-ahci, block-mount
grub2-efi-x86_64
irqbalance
ethtool, lsblk, pciutils, usbutils, iperf3
luci, luci-ssl, luci-proto-ppp, luci-proto-ipv6
kmod-nft-offload
```

### Interface naming rule

Không hardcode interface cho N100. Tester phải gửi:

```bash
ip link
lspci -nn | grep -i ethernet
ls -la /sys/class/net/*/device
```

Sau đó mới map WAN/LAN.
