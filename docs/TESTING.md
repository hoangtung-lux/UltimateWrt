# Testing Suite: theultimate

> Không mark pass nếu chưa có log hoặc tester report. Simulated/QEMU phải ghi rõ là simulated.

---

## Gate 0 — Build artifact verification

Áp dụng cho firmware vừa build.

```bash
cd ~/theultimate/openwrt/bin/targets/x86/64
gzip -t openwrt-x86-64-generic-ext4-combined-efi.img.gz
sha256sum -c sha256sums --ignore-missing
```

Pass khi:

```text
openwrt-x86-64-generic-ext4-combined-efi.img.gz: OK
```

---

## Test Suite 1 — Kết nối cơ bản

### 1. PPPoE Dial

```bash
uci set network.wan.proto='pppoe'
uci set network.wan.username='<USERNAME>'
uci set network.wan.password='<PASSWORD>'
uci set network.wan.mtu='1492'
uci commit network
ifup wan
sleep 8
ping -c 4 1.1.1.1
ping -c 4 openwrt.org
```

### 2. IPv6

```bash
uci set network.wan6='interface'
uci set network.wan6.proto='dhcpv6'
uci set network.wan6.device='@wan'
uci commit network
ifup wan6
sleep 8
ping -c 4 2001:4860:4860::8888
```

### 3. IPTV VLAN

Thay `<WAN_IF>` và `<IPTV_VLAN>` theo ISP-CONFIG.md.

```bash
uci set network.iptv_dev='device'
uci set network.iptv_dev.name='<WAN_IF>.<IPTV_VLAN>'
uci set network.iptv_dev.type='8021q'
uci set network.iptv_dev.ifname='<WAN_IF>'
uci set network.iptv_dev.vid='<IPTV_VLAN>'

uci set network.iptv_if='interface'
uci set network.iptv_if.proto='dhcp'
uci set network.iptv_if.device='<WAN_IF>.<IPTV_VLAN>'
uci commit network
ifup iptv_if
```

---

## Test Suite 2 — Hiệu năng iperf3

```bash
# Router hoặc một máy LAN
iperf3 -s

# Client
iperf3 -c <SERVER_IP> -t 30 -P 4
```

Report:

```text
Throughput:
CPU load:
Interface speed:
Packet loss/error:
```

---

## Test Suite 3 — Ổn định 24h

```bash
uptime
logread | grep -Ei 'error|fail|reset|crash|panic|oom' | tail -100
```

Không chạy flood test trên mạng production nếu không kiểm soát được.

---

## Test Suite 4 — ISP VLAN switching

Status hiện tại:

```text
[ ] Viettel VLAN 35: pending real/tester verification
[ ] VNPT HN VLAN 10: pending real/tester verification
[ ] VNPT HCM VLAN 11: pending real/tester verification
[ ] FPT VLAN 10: pending real/tester verification
[ ] Auto-detect script: pending real/tester verification
```

Không đổi thành `[x]` nếu chỉ là dự kiến hoặc chưa có log.

---

## N100 Alpha Test Gate

Pass khi có ít nhất 2 tester hoặc 1 thiết bị thật xác nhận:

```text
[ ] Boot UEFI OK
[ ] LuCI 192.168.1.1 OK
[ ] root password set OK
[ ] NIC driver nhận đủ cổng
[ ] WAN/LAN mapping documented
[ ] DHCP hoặc PPPoE OK
[ ] IPv6 checked hoặc ghi rõ ISP không cấp
[ ] Uptime >= 24h
[ ] Không có kernel panic/OOM/reboot bất thường
```
