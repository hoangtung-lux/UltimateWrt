# Project: theultimate

## Overview

Nghiên cứu và build firmware OpenWrt tối ưu cho các platform router/soft-router phổ biến tại Việt Nam, tập trung vào Viettel, VNPT, FPT.

---

## Version Policy

```text
MediaTek Filogic  → OpenWrt 23.05.5 / kernel 5.15.x
Rockchip NanoPi   → OpenWrt 23.05.5 / kernel 5.15.x
Intel N100 x86    → OpenWrt 24.10.x / kernel 6.6.x, alpha tested v24.10.7
```

Không dùng cụm "latest OpenWrt" trong docs/config; luôn pin version cụ thể.

---

## Objectives

- Phân tích OpenWrt và một số fork như ImmortalWrt/Lean để lấy ý tưởng/patch phù hợp.
- Không apply patch bừa: mọi patch phải nằm trong PATCH-REGISTRY.md và dry-run trước.
- Tối ưu WAN/PPPoE/VLAN/IPv6 cho Viettel, VNPT, FPT.
- Xây dựng GUI LuCI thân thiện, có Tiếng Việt/English.
- Đảm bảo an toàn: backup, rollback, testing gate, release alpha/beta rõ ràng.

---

## Tech Stack

```text
Base firmware : OpenWrt source build
GUI           : LuCI app
Config        : UCI/rpcd/ubus/ucode scripts
Build env     : Ubuntu 22.04/24.04, WSL2 hoặc Docker
Languages     : Shell, JavaScript LuCI, ucode, Python build helper
```

---

## Current Status

N100 alpha firmware đã build thành công và đóng gói release:

```text
n100-openwrt-alpha-20260603.tar.gz
openwrt-x86-64-generic-ext4-combined-efi.img.gz
```

Giai đoạn kế tiếp: alpha tester + GUI read-only dashboard.
