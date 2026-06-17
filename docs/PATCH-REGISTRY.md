# Patch Registry: theultimate

> File này track tất cả patches được apply vào firmware.  
> Mỗi patch phải có: nguồn, trạng thái compatibility, platform áp dụng.  
> AI agent dùng file này để phân tích conflict trước khi build (Gate 2).

---

## Patch Categories

| Category | Mô tả | Platform áp dụng |
|:---|:---|:---|
| `sfe` | Shortcut Forwarding Engine — giảm tải CPU NAT | MediaTek only |
| `mt76` | WiFi driver improvements từ ImmortalWrt | MediaTek Filogic |
| `turboacc` | LuCI UI cho SFE/Flow Offloading | MediaTek only |
| `rockchip` | Board-specific fixes cho NanoPi R5S/R6S | Rockchip only |
| `igc` | Intel i226-V driver fixes | Rockchip + x86 |
| `isp` | Không phải patch kernel — UCI/script config | All platforms |

---

## Active Patches

### [P-001] SFE — Shortcut Forwarding Engine
```
Source      : https://github.com/coolsnowwolf/lede (Lean OpenWrt)
Upstream    : https://github.com/quic-sss/qca-nss-sfe (Qualcomm original)
File        : patches/sfe/001-sfe-core.patch
              patches/sfe/002-sfe-ipv4.patch
              patches/sfe-ipv6.patch
Applies to  : kernel 5.15.x ONLY
Platform    : MediaTek Filogic, MediaTek mt7622, ramips
Status      : ✅ Compatible với OpenWrt 23.05.5 (5.15.167)
Conflict    : ❌ Không tương thích kernel 6.x — KHÔNG apply cho x86 (6.6) và Rockchip nếu upgrade kernel
Test status : ⏳ Chưa verify trên 23.05.5 — đây là Gate 2 task
```

### [P-002] luci-app-turboacc
```
Source      : https://github.com/coolsnowwolf/luci (Lean OpenWrt)
File        : package/lean/luci-app-turboacc
Applies to  : LuCI package (không phải kernel patch)
Platform    : MediaTek (cần SFE backend)
Status      : ✅ Là LuCI package — apply bằng cách add vào package feed
Conflict    : Không conflict — nhưng vô nghĩa nếu SFE patch không được apply
```

### [P-003] MT76 WiFi Driver (ImmortalWrt)
```
Source      : https://github.com/immortalwrt/immortalwrt — branch openwrt-23.05
File        : patches/mt76/*.patch (extract từ ImmortalWrt diff)
Applies to  : kernel 5.15.x
Platform    : MediaTek Filogic (MT7981B, MT7986A/B, MT7976C/AN)
Status      : ⏳ Cần extract diff giữa ImmortalWrt 23.05 và vanilla OpenWrt 23.05.5
Conflict    : Có thể conflict với vanilla mt76 patches — cần verify
Test status : ⏳ Gate 2 task
```

### [P-004] Intel igc Driver (i226-V fix)
```
Source      : kernel upstream, backport từ 6.x → 5.15
File        : patches/igc/001-igc-link-speed-fix.patch
Applies to  : kernel 5.15.x (Rockchip platform)
Platform    : Rockchip (NanoPi R5S/R6S)
Status      : ⚠️ Cần kiểm tra — một số user báo i225-V không nhận 2.5G trên OpenWrt 23.05
Note        : x86/N100 dùng OpenWrt 24.10.x kernel 6.6.x → igc upstream, không cần patch này
```

### [P-005] NanoPi R5S DTS / Board Patches
```
Source      : https://github.com/friendlyarm/kernel-rockchip
File        : patches/rockchip/nanopi-r5s-*.patch
Applies to  : kernel 5.15.x, DTS files
Platform    : Rockchip (NanoPi R5S)
Status      : ⏳ Cần extract từ FriendlyWrt — kiểm tra xem OpenWrt 23.05 đã merge chưa
Note        : Nếu OpenWrt 23.05 đã có profile nanopi-r5s chính thức → không cần patch này
```

### [P-006] NanoPi R6S DTS / Board Patches
```
Source      : https://github.com/friendlyarm/kernel-rockchip
File        : patches/rockchip/nanopi-r6s-*.patch
Applies to  : kernel 5.15.x
Platform    : Rockchip (NanoPi R6S — RK3588S)
Status      : ❓ Chưa rõ — RK3588S support trong OpenWrt 23.05 còn experimental
Action      : Kiểm tra OpenWrt ToH trước khi build. Nếu chưa có → dùng FriendlyWrt làm base.
```

---

## Patch Conflict Matrix

| Patch | Kernel 5.15 | Kernel 6.6 | MediaTek | Rockchip | x86 |
|:---|:---|:---|:---|:---|:---|
| P-001 SFE | ✅ | ❌ | ✅ | ❌ | ❌ |
| P-002 TurboACC | N/A | N/A | ✅ | ❌ | ❌ |
| P-003 MT76 ImmortalWrt | ✅ | ⚠️ | ✅ | ❌ | ❌ |
| P-004 igc fix | ✅ | N/A | ❌ | ✅ | ❌ |
| P-005 NanoPi R5S DTS | ✅ | ⚠️ | ❌ | ✅ | ❌ |
| P-006 NanoPi R6S DTS | ✅ | ⚠️ | ❌ | ✅ | ❌ |

> ✅ Compatible | ❌ Incompatible / Not needed | ⚠️ Cần verify | N/A = Không áp dụng

---

## Workflow Apply Patches (Gate 2 Checklist)

```bash
# Bước 1: Extract SFE patch từ Lean và check vs kernel 5.15.167
git diff v23.05.5..HEAD -- net/shortcut-fe/ > /tmp/sfe-check.diff
patch --dry-run -p1 < patches/sfe/001-sfe-core.patch
# Nếu dry-run thành công → apply thật

# Bước 2: Check MT76 diff giữa ImmortalWrt và vanilla
git clone https://github.com/immortalwrt/immortalwrt.git -b openwrt-23.05 --depth=1
diff -rq immortalwrt/package/kernel/mt76/ openwrt/package/kernel/mt76/ > /tmp/mt76-diff.txt
# Review diff → extract chỉ những file có ý nghĩa (không lấy hết)

# Bước 3: Apply từng patch một, build test sau mỗi patch
git apply patches/sfe/001-sfe-core.patch && make -j$(nproc) && echo "PASS" || echo "FAIL"
```

---

## Pending Research (Gate 2 Tasks)

- [ ] Verify SFE patch apply clean lên OpenWrt 23.05.5 kernel 5.15.167
- [ ] Extract và review MT76 diff từ ImmortalWrt 23.05
- [ ] Confirm OpenWrt 23.05.x có official profile cho NanoPi R5S chưa
- [ ] Check trạng thái RK3588S (R6S) support trong OpenWrt mainline
- [ ] Verify igc driver 2.5G link speed trên Rockchip (kernel 5.15)


---

## Docs Sync Note

N100 alpha v24.10.7 không apply patch kernel từ registry. Với N100, ưu tiên upstream kernel 6.6, kmod-igc/kmod-r8125/kmod-e1000e và test thật trên hardware.
