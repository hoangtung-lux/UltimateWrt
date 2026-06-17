# ISP Configuration: theultimate

> Config ISP cho Viettel, VNPT, FPT. Không tự sáng tác VLAN ID. Mọi PPPoE config phải có MTU 1492 và MSS clamp 1452.

---

## 1. VLAN/MTU matrix

| ISP | Internet VLAN | IPTV VLAN | PPPoE MTU | MSS clamp |
|:---|---:|---:|---:|---:|
| Viettel | 35 | 2502 | 1492 | 1452 |
| VNPT Hà Nội | 10 | 20 | 1492 | 1452 |
| VNPT HCM | 11 | 21 | 1492 | 1452 |
| FPT | 10 | 13 | 1492 | 1452 |

Nếu VNPT không rõ vùng, không đoán. Hỏi user hoặc chạy auto-detect.

---

## 2. Auto-detect ISP/VLAN

Script mẫu nhận WAN base interface làm tham số, không hardcode `eth0`:

```sh
#!/bin/sh
# isp-detect.sh
# Usage: isp-detect.sh <WAN_BASE_IF>
set -eu

WAN_IF="${1:-}"
if [ -z "$WAN_IF" ]; then
    echo "Usage: $0 <WAN_BASE_IF>" >&2
    exit 1
fi

cleanup_vlan() {
    ip link delete "$WAN_IF.$1" 2>/dev/null || true
}

for vlan in 35 10 11; do
    cleanup_vlan "$vlan"
    ip link add link "$WAN_IF" name "$WAN_IF.$vlan" type vlan id "$vlan"
    ip link set "$WAN_IF.$vlan" up

    if pppoe-discovery -I "$WAN_IF.$vlan" 2>/dev/null | grep -q "AC-Name"; then
        logger -t theultimate "ISP PPPoE discovery found on $WAN_IF.$vlan"
        echo "$WAN_IF.$vlan"
        exit 0
    fi

    cleanup_vlan "$vlan"
done

logger -t theultimate "No PPPoE AC found on common VLANs"
exit 1
```

Với N100, xác định `WAN_IF` bằng:

```bash
ip link
lspci -nn | grep -i ethernet
ls -la /sys/class/net/*/device
```

---

## 3. MSS clamping an toàn

Không dùng `firewall.@rule[-1]` nếu chưa tạo rule mới. Dùng named section để tránh sửa nhầm rule cuối:

```sh
#!/bin/sh
# /etc/uci-defaults/99-theultimate-mss-clamping
set -eu

uci -q delete firewall.theultimate_mss || true
uci set firewall.theultimate_mss='rule'
uci set firewall.theultimate_mss.name='MSS-Clamping'
uci set firewall.theultimate_mss.src='wan'
uci set firewall.theultimate_mss.proto='tcp'
uci set firewall.theultimate_mss.tcp_flags='syn'
uci set firewall.theultimate_mss.target='TCPMSS'
uci set firewall.theultimate_mss.set_mss='1452'
uci commit firewall
exit 0
```

Verify:

```bash
uci show firewall.theultimate_mss
fw4 print | grep -i mss -n || true
```

---

## 4. PPPoE WAN template

Thay `<WAN_IF>`, `<VLAN_ID>`, `<USERNAME>`, `<PASSWORD>` bằng giá trị thật.

```bash
# VLAN <VLAN_ID> = Internet VLAN của ISP theo bảng ở trên
uci set network.wan_dev='device'
uci set network.wan_dev.name='<WAN_IF>.<VLAN_ID>'
uci set network.wan_dev.type='8021q'
uci set network.wan_dev.ifname='<WAN_IF>'
uci set network.wan_dev.vid='<VLAN_ID>'

# PPPoE WAN, MTU 1492
uci set network.wan='interface'
uci set network.wan.device='<WAN_IF>.<VLAN_ID>'
uci set network.wan.proto='pppoe'
uci set network.wan.username='<USERNAME>'
uci set network.wan.password='<PASSWORD>'
uci set network.wan.mtu='1492'

# IPv6 song song IPv4
uci set network.wan6='interface'
uci set network.wan6.device='@wan'
uci set network.wan6.proto='dhcpv6'

uci commit network
```

Apply test:

```bash
ifup wan
sleep 8
ping -c 4 1.1.1.1
ping -c 4 openwrt.org
ifup wan6 || true
ping -c 4 2001:4860:4860::8888 || true
```

---

## 5. Rollback rule cho GUI/wizard

Bất kỳ GUI nào thay WAN/LAN/firewall phải:

1. Backup config hiện tại.
2. Apply tạm.
3. Start rollback timer 60–120 giây.
4. User confirm thì commit.
5. Không confirm thì revert.

Không được release wizard auto-config nếu chưa có rollback.
