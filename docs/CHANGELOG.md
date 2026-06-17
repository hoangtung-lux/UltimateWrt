# Changelog: theultimate

Tất cả thay đổi đáng kể đối với dự án này sẽ được ghi lại tại đây.

---

## [Unreleased]

### Added
- Thêm docs sync cho platform matrix mới.
- Thêm N100 alpha release workflow.
- Thêm WSL build hygiene và fix `appendWindowsPath=false`.
- Thêm rule GUI/config phải có rollback timer.
- Thêm N100 alpha testing gate.

### Changed
- N100 chuyển sang OpenWrt `24.10.x`, alpha tested `v24.10.7`, kernel `6.6.x`.
- MediaTek/Rockchip giữ OpenWrt `23.05.5`, kernel `5.15.x`.
- BUILD.md cập nhật dependency Ubuntu 24.04, bỏ hard requirement `python3-distutils` cho track N100.
- PLATFORM-COMPARISON.md và HARDWARE.md cập nhật version/kernel matrix.
- N100.md cập nhật artifact alpha và flash workflow.
- TESTING.md chuyển QEMU/ISP VLAN từ checked sang pending nếu chưa có log thật.

### Fixed
- Sửa hướng dẫn MSS clamping không còn dùng `firewall.@rule[-1]` thiếu `uci add`.
- Sửa rule N100 interface: không hardcode `eth0` hay `enp1s0`, phải verify bằng `ip link`/`lspci`.
- Sửa docs stale `23.05.5 + kernel 6.6` cho N100.

---

## [0.1.0] - 2026-05-06

### Added
- Khởi tạo cấu trúc dự án và các file tài liệu `.planning/`.
- Thêm `BUILD.md`, `TESTING.md`, `ISP-CONFIG.md`.
- Thêm script `build.py` để tự động hóa quy trình build.
