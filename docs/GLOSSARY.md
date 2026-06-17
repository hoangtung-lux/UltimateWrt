# Glossary: theultimate

> File này định nghĩa chính xác các thuật ngữ dùng trong project.  
> AI agent phải dùng đúng nghĩa này — không dùng định nghĩa chung chung từ training data nếu mâu thuẫn.

---

## Thuật ngữ Project

| Term | Định nghĩa trong project này |
|:---|:---|
| **Platform A** | MediaTek Filogic — MT7981B, MT7986. Kernel 5.15.x. Dùng SFE. |
| **Platform B** | Rockchip — RK3568B2 (R5S), RK3588S (R6S). Kernel 5.15.x. Không dùng SFE. |
| **Platform C** | Intel x86_64 — N100 Mini PC. OpenWrt 24.10.x, kernel 6.6.x. Không dùng SFE. |
| **SFE** | Shortcut Forwarding Engine — kernel patch giảm tải CPU khi NAT. CHỈ dùng cho Platform A. |
| **TurboACC** | `luci-app-turboacc` — LuCI UI quản lý SFE/Flow Offloading. CHỈ dùng cho Platform A. |
| **Gate 2** | Milestone: Patch Compatibility Analysis phải pass trước khi build. |
| **Gate 3** | Milestone: ISP Config Verification phải pass trước khi release. |
| **Tier 1** | Platform được test đầy đủ: Filogic, NanoPi R5S, NanoPi R6S, N100. |
| **Tier 2** | Platform best-effort: MT7622, MT7621. |
| **ISP** | Nhà mạng: Viettel, VNPT, FPT — 3 nhà mạng được hỗ trợ chính thức. |
| **DUT** | Device Under Test — thiết bị đang test firmware. |
| **FriendlyWrt** | Fork OpenWrt do FriendlyElec maintain cho NanoPi. Chỉ dùng để extract patches, không phải base firmware. |
| **Lean OpenWrt** | Fork của coolsnowwolf — nguồn lấy SFE patches và TurboACC. |
| **ImmortalWrt** | Fork OpenWrt — nguồn lấy MT76 WiFi driver patches và package feed. |
| **PATCH-REGISTRY** | File track tất cả patches — phải check trước khi apply bất kỳ patch nào. |

---

## OpenWrt Specific Terms

| Term | Định nghĩa |
|:---|:---|
| **UCI** | Unified Configuration Interface — hệ thống config của OpenWrt. Dùng `uci` commands hoặc edit `/etc/config/*`. |
| **sysupgrade** | Lệnh flash firmware mới trên OpenWrt đang chạy. Dùng `-b` để backup trước. |
| **squashfs** | Filesystem nén read-only — dùng cho embedded (Platform A, B). |
| **ext4** | Filesystem writable — dùng cho x86 (Platform C) trên SSD. |
| **overlayfs** | Layer writable trên squashfs — nơi lưu thay đổi config. Giới hạn bởi dung lượng Flash. |
| **VLAN tagging** | Gắn VLAN ID vào packet — dùng để phân tách luồng Internet và IPTV trên cùng 1 cổng WAN vật lý. |
| **PPPoE** | Point-to-Point Protocol over Ethernet — giao thức dial-up của các ISP VN. MTU = 1492. |
| **MSS Clamping** | Kỹ thuật điều chỉnh TCP Maximum Segment Size để tránh packet fragmentation với PPPoE. Giá trị = MTU - 40 = 1452. |
| **Flow Offloading** | Tính năng kernel bypass netfilter cho các flow đã established → giảm CPU load. |
| **conntrack** | Connection tracking table của kernel — giới hạn bởi RAM. Max = 65536 (256MB) / 32768 (128MB). |
| **irqbalance** | Daemon phân phối interrupt đều các CPU core — cần thiết cho Platform B và C. |
| **igc** | Kernel driver cho Intel i225-V / i226-V NIC — cần cho NanoPi và N100. |
| **mt76** | Kernel driver cho MediaTek WiFi chipset — ImmortalWrt có version tốt hơn vanilla. |

---

## ISP Terms

| Term | Định nghĩa |
|:---|:---|
| **IPTV VLAN** | VLAN riêng cho Set-Top Box (STB) xem truyền hình. Tách biệt hoàn toàn với Internet VLAN. |
| **IGMP Proxy** | Protocol cho phép multicast IPTV qua router — cần cài `igmpproxy`. |
| **DS-Lite** | Dual-Stack Lite — IPv6 tunnel mang IPv4 traffic — một số ISP dùng thay DHCPv6. |
| **DHCPv6-PD** | DHCPv6 Prefix Delegation — ISP cấp prefix IPv6 (/56 hoặc /64) cho router. |
| **MRU** | Maximum Receive Unit — thường = MTU = 1492 cho PPPoE. |

---

## Forbidden Terminology (AI không được dùng nghĩa khác)

```
"latest OpenWrt" → Cấm. Phải nói version cụ thể theo platform: MediaTek/Rockchip 23.05.5, N100 24.10.x/v24.10.7 alpha
"should work"   → Cấm. Dùng dữ liệu từ docs để khẳng định.
"maybe"         → Cấm.
"probably"      → Cấm.
"I think"       → Cấm.
"you could try" → Cấm.
"SFE for NanoPi" → KHÔNG có khái niệm này. SFE chỉ cho MediaTek.
"eth0/enp1s0 on N100" → Không hardcode. Phải verify bằng ip link/lspci/trạng thái máy thật
"Gargoyle"       → Out of scope. Không đề cập trừ khi user hỏi lịch sử.
"MTU 1500 PPPoE" → Sai. PPPoE MTU = 1492, không có exception.
```


---

## Docs Sync Note

N100 alpha track đã chuyển sang OpenWrt 24.10.x/kernel 6.6.x. MediaTek/Rockchip vẫn giữ track 23.05.5/kernel 5.15.x.
