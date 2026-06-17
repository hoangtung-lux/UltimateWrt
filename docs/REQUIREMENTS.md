# Requirements: theultimate

## Functional Requirements

### ISP Optimization

- Hỗ trợ PPPoE + VLAN tagging cho Viettel, VNPT, FPT.
- Tự động hóa MTU/MSS cho PPPoE: MTU 1492, MSS 1452.
- IPv6 `wan6` song song IPv4 trừ khi user tắt.
- IPTV VLAN theo ISP-CONFIG.md.

### Fork Feature Integration

- MediaTek: SFE/TurboACC/MT76 patches theo PATCH-REGISTRY.md sau dry-run.
- Rockchip: board/igc/DTS patches chỉ khi registry xác nhận.
- N100: không SFE; dùng OpenWrt 24.10.x kernel 6.6, driver upstream, irqbalance, nft offload.

### Management GUI

- LuCI app: `luci-app-theultimate`.
- Phase đầu: read-only dashboard.
- Phase sau: setup wizard có rollback timer.
- Ngôn ngữ: Tiếng Việt/English.

## Non-Functional Requirements

- Stability: không crash khi traffic cao.
- Safety: backup + rollback + recovery guide.
- Reproducibility: build pin version/tag rõ ràng.
- Efficiency: tối ưu flash/RAM cho embedded, ext4 writable cho x86.

## Verification Criteria

- Firmware checksum OK.
- Boot + LuCI OK trên thiết bị thật.
- NIC nhận đủ và map được cổng vật lý.
- PPPoE/VLAN/DHCPv6 pass theo ISP.
- Speedtest đạt gần băng thông nhà mạng.
- Uptime alpha tối thiểu 24h không kernel panic/OOM.
