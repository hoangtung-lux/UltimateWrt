# Device Guide: NanoPi R5S / R6S

## Tổng quan

NanoPi R5S và R6S là soft router dạng SBC (Single Board Computer) của FriendlyElec.  
Điểm mạnh: RAM/Storage lớn hơn nhiều so với embedded router thông thường, có M.2 slot để mở rộng.

---

## Điểm khác biệt so với Embedded Router (quan trọng)

| Đặc điểm | Embedded (MT7981) | NanoPi R5S/R6S |
|:---|:---|:---|
| SFE / TurboACC | Cần thiết | Không cần — CPU đủ mạnh |
| WiFi | Onboard | Phải gắn thêm M.2 card |
| Storage | 128 MB NAND | 8/32 GB eMMC + MicroSD |
| Boot media | Flash chip | eMMC hoặc MicroSD |
| Recovery | TFTP | Boot từ MicroSD |
| Overlay FS | Giới hạn | Có thể mount ext4 partition riêng |

---

## Chuẩn bị Build Environment

```bash
# Clone OpenWrt (dùng chung với platform khác)
git clone https://github.com/openwrt/openwrt.git -b v23.05.5 --depth=1
cd openwrt

# Thêm feeds (giống platform MediaTek)
./scripts/feeds update -a && ./scripts/feeds install -a
```

---

## Cấu hình Build cho R5S

```bash
make menuconfig
```

Chọn các tùy chọn sau:

```
Target System       → Rockchip ARM
Subtarget           → ARMv8 multiplatform
Target Profile      → FriendlyElec NanoPi R5S

# Kernel modules cần thiết
Kernel modules → Network Devices:
  [*] kmod-igc          ← Intel i225-V NIC
  [*] kmod-r8169        ← Realtek RTL8211F NIC

# Nếu muốn WireGuard với hardware acceleration
Kernel modules → Cryptographic API:
  [*] kmod-crypto-hw-rockchip

# Nếu gắn WiFi M.2 card (MT7921K)
Kernel modules → Wireless Drivers:
  [*] kmod-mt7921e
```

### .config snippet cho R5S
```
CONFIG_TARGET_rockchip=y
CONFIG_TARGET_rockchip_armv8=y
CONFIG_TARGET_rockchip_armv8_DEVICE_friendlyarm_nanopi-r5s=y
CONFIG_PACKAGE_kmod-igc=y
CONFIG_PACKAGE_kmod-r8169=y
CONFIG_PACKAGE_kmod-crypto-hw-rockchip=y
CONFIG_PACKAGE_irqbalance=y
CONFIG_PACKAGE_ethtool=y
```

---

## Cấu hình Build cho R6S

```bash
# R6S dùng RK3588S — cần check xem OpenWrt 23.05.x có profile chưa
# Nếu chưa có official profile, dùng FriendlyWrt làm base
# hoặc build từ snapshot với patch từ FriendlyElec repo
```

```
CONFIG_TARGET_rockchip=y
CONFIG_TARGET_rockchip_armv8=y
CONFIG_TARGET_rockchip_armv8_DEVICE_friendlyarm_nanopi-r6s=y
CONFIG_PACKAGE_kmod-igc=y
CONFIG_PACKAGE_kmod-r8169=y
```

> ⚠️ **R6S (RK3588S) caveat:** OpenWrt 23.05.x chưa có official support đầy đủ cho RK3588. Kiểm tra tại [OpenWrt Table of Hardware](https://openwrt.org/toh/start) trước khi build. Nếu chưa có → dùng FriendlyWrt snapshot + extract ISP patches.

---

## Flash Procedure

### Qua MicroSD (khuyến nghị lần đầu)

```bash
# Ghi image ra MicroSD
gunzip -c openwrt-rockchip-armv8-friendlyarm_nanopi-r5s-squashfs-sysupgrade.img.gz | \
  sudo dd of=/dev/sdX bs=4M status=progress conv=fsync

# Cắm MicroSD vào NanoPi, boot → test
# Nếu OK → sysupgrade lên eMMC từ LuCI
```

### Sysupgrade lên eMMC
```bash
# Backup trước khi flash
sysupgrade -b /tmp/backup-$(date +%Y%m%d).tar.gz

# Từ LuCI: System → Backup/Flash Firmware → Flash image
# Hoặc CLI:
sysupgrade -v /tmp/openwrt-rockchip-*-sysupgrade.img.gz
```

### Recovery (nếu eMMC bị brick)
```bash
# Boot từ MicroSD → SSH vào → ghi lại eMMC
dd if=/tmp/firmware.img of=/dev/mmcblk1 bs=4M status=progress
```

---

## Network Interface Mapping

```
NanoPi R5S / R6S:
  eth0  → 2.5 GbE (Intel i225-V) → dùng làm WAN
  eth1  → 1 GbE (Realtek) → LAN port 1
  eth2  → 1 GbE (Realtek) → LAN port 2
```

### UCI Network config cơ bản
```uci
config interface 'wan'
    option device 'eth0.35'    # VLAN Viettel — đổi theo ISP
    option proto 'pppoe'
    option username '<user>'
    option password '<pass>'
    option mtu '1492'

config interface 'lan'
    option type 'bridge'
    list ports 'eth1 eth2'
    option proto 'static'
    option ipaddr '192.168.1.1'
    option netmask '255.255.255.0'
```

---

## Performance Baseline (Expected)

| Test | R5S (RK3568) | R6S (RK3588S) |
|:---|:---|:---|
| NAT throughput (1 GbE) | ~950 Mbps @ CPU 25% | ~950 Mbps @ CPU 10% |
| NAT throughput (2.5 GbE) | ~2.3 Gbps @ CPU 60% | ~2.5 Gbps @ CPU 25% |
| WireGuard (hardware crypto) | ~400 Mbps | ~800 Mbps |
| Simultaneous connections | 65536 | 131072 |

---

## Tham khảo

- FriendlyWrt source (extract patches): https://github.com/friendlyarm/friendlywrt
- OpenWrt Rockchip target: https://openwrt.org/docs/techref/targets/rockchip
- NanoPi R5S wiki: https://wiki.friendlyelec.com/wiki/index.php/NanoPi_R5S
- NanoPi R6S wiki: https://wiki.friendlyelec.com/wiki/index.php/NanoPi_R6S


---

## Docs Sync Note

NanoPi/Rockchip vẫn đang ở track OpenWrt 23.05.5/kernel 5.15.x trong docs hiện tại. Không dùng SFE/TurboACC cho NanoPi.
