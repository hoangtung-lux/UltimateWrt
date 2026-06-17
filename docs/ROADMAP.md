# Roadmap: theultimate

## Milestone 1: Research & Planning

- [x] AI integration phase.
- [x] Platform matrix.
- [x] ISP VLAN/PPPoE requirements.
- [x] Initial build scripts.

## Milestone 2: N100 Alpha Firmware

- [x] Move WSL/build workspace sang D-backed Ubuntu-D.
- [x] Fix Ubuntu 24.04 dependencies.
- [x] Build OpenWrt `v24.10.7` cho N100.
- [x] Fix WSL PATH leak.
- [x] Verify checksum.
- [x] Package release alpha.
- [ ] Alpha tester reports.

## Milestone 3: GUI MVP

- [ ] `luci-app-theultimate` skeleton.
- [ ] Read-only dashboard:
  - OpenWrt/kernel version
  - CPU/RAM/storage
  - NIC list + link speed
  - WAN IP / LAN subnet
  - PPPoE/IPv6 status
  - firewall/offload status
  - log tail

## Milestone 4: Safe Setup Wizard

- [ ] WAN/LAN port selection.
- [ ] DHCP/PPPoE/Static WAN.
- [ ] VLAN ID by ISP.
- [ ] DNS mode.
- [ ] Apply with rollback timer.

## Milestone 5: Beta Features

- [ ] ISP profile presets.
- [ ] Auto-detect PPPoE VLAN.
- [ ] Offload/SQM toggles.
- [ ] Backup/restore UI.
- [ ] Multi-WAN/VPN advanced mode.

## Milestone 6: Stable Release Candidate

- [ ] 24–72h uptime reports.
- [ ] Recovery guide.
- [ ] Full docs sync.
- [ ] Release notes.
