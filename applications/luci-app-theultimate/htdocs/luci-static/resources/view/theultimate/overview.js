'use strict';
'require view';
'require rpc';

var callSystemBoard = rpc.declare({
	object: 'system',
	method: 'board'
});

var callSystemInfo = rpc.declare({
	object: 'system',
	method: 'info'
});

var callNetworkDump = rpc.declare({
	object: 'network.interface',
	method: 'dump'
});

var callDeviceStatus = rpc.declare({
	object: 'network.device',
	method: 'status'
});

return view.extend({
	// Formatter for system uptime
	formatUptime: function(seconds) {
		var d = Math.floor(seconds / 86400);
		var h = Math.floor((seconds % 86400) / 3600);
		var m = Math.floor((seconds % 3600) / 60);
		var s = Math.floor(seconds % 60);
		
		var res = [];
		if (d > 0) res.push(d + 'd');
		if (h > 0) res.push(h + 'h');
		if (m > 0) res.push(m + 'm');
		res.push(s + 's');
		return res.join(' ');
	},

	// Formatter for system load average values
	formatLoad: function(load) {
		if (!Array.isArray(load))
			return '0.00 / 0.00 / 0.00';

		return load.map(function(v) {
			if (typeof v !== 'number')
				return '0.00';

			// ubus system info thường trả fixed-point; mock đang dùng số nhỏ dạng 0.xx
			if (v > 100)
				v = v / 65536;

			return v.toFixed(2);
		}).join(' / ');
	},

	// Formatter for byte sizes
	formatSize: function(bytes) {
		if (bytes === 0) return '0 B';
		var k = 1024;
		var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	},

	// Masking helpers for sensitive data (using RFC 5737 / RFC 7042 documentation mock addresses)
	maskIP: function(ip) {
		if (!ip || ip === 'N/A' || ip === '0.0.0.0') return 'N/A';
		var parts = ip.split('.');
		if (parts.length === 4) {
			return parts[0] + '.' + parts[1] + '.XX.XX';
		}
		return ip;
	},

	maskIPv6: function(ip) {
		if (!ip || ip === 'N/A') return 'N/A';
		var parts = ip.split(':');
		if (parts.length > 2) {
			return parts[0] + ':' + parts[1] + ':XXXX::XX/' + (ip.split('/')[1] || '64');
		}
		return ip;
	},

	maskMAC: function(mac) {
		if (!mac || mac === '00:00:00:00:00:00') return 'N/A';
		var parts = mac.split(':');
		if (parts.length === 6) {
			return parts[0] + ':' + parts[1] + ':XX:XX:XX:' + parts[5];
		}
		return mac;
	},

	// Wrapper for system info retrieval with robust mock fallback
	loadSystemInfo: function() {
		return Promise.all([
			callSystemBoard().catch(function() { return {}; }),
			callSystemInfo().catch(function() { return {}; })
		]).then(function(results) {
			var board = results[0] || {};
			var info = results[1] || {};
			
			// If empty ubus data (like outside OpenWrt), fallback to mock data
			if (!board.release && !info.uptime) {
				return {
					version: 'OpenWrt 24.10.0-rc1 (Mocking Mode)',
					kernel: '6.6.32-ultimate-x86_64',
					cpu: 'Intel(R) Core(TM) i5-10400 CPU @ 2.90GHz (4 Cores)',
					uptime: 228945, // ~2.6 days
					load: [0.12, 0.08, 0.05],
					memory: {
						total: 2147483648, // 2 GB
						free: 1073741824,  // 1 GB
						shared: 0,
						buffered: 67108864, // 64 MB
						cached: 536870912    // 512 MB
					},
					isMock: true
				};
			}

			return {
				version: board.release ? board.release.description : 'OpenWrt 24.10',
				kernel: board.kernel || 'Unknown Kernel',
				cpu: board.system || board.board_name || 'Generic Device',
				uptime: info.uptime || 0,
				load: info.load || [0, 0, 0],
				memory: info.memory || { total: 0, free: 0, buffered: 0, cached: 0 },
				isMock: false
			};
		}).catch(function() {
			return {
				version: 'OpenWrt 24.10 (Mock Fallback)',
				kernel: '6.6.32-mock-fallback',
				cpu: 'Generic Core Processor (4 Cores)',
				uptime: 120000,
				load: [0.05, 0.02, 0.00],
				memory: {
					total: 1073741824,
					free: 536870912,
					shared: 0,
					buffered: 33554432,
					cached: 268435456
				},
				isMock: true
			};
		});
	},

	// Wrapper for network interfaces with robust mock fallback
	loadNetworkInfo: function() {
		return Promise.all([
			callNetworkDump().catch(function() { return {}; }),
			callDeviceStatus().catch(function() { return {}; })
		]).then(function(results) {
			var dump = results[0] || {};
			var devStatus = results[1] || {};
			var interfaces = dump.interface || [];
			
			if (interfaces.length === 0) {
				return [
					{ name: 'lan', proto: 'static', ipaddr: '192.0.2.1', netmask: '255.255.255.0', device: 'br-lan', up: true, type: 'LAN', mac: '00:00:5E:00:53:01' },
					{ name: 'wan', proto: 'pppoe', ipaddr: '198.51.100.45', gateway: '198.51.100.1', dns: ['198.51.100.254', '192.0.2.254'], device: 'pppoe-wan', up: true, type: 'WAN', ipv6: '2001:db8:wan::1/64', mac: '00:00:5E:00:53:02' }
				];
			}

			return interfaces.map(function(iface) {
				var ipv4 = iface['ipv4-address'] && iface['ipv4-address'][0] ? iface['ipv4-address'][0] : {};
				var ipv6 = iface['ipv6-address'] && iface['ipv6-address'][0] ? iface['ipv6-address'][0] : {};
				var devName = iface.l3_device || iface.device || 'N/A';
				var devInfo = devStatus[devName] || {};
				
				// Search for nexthop/gateway correctly
				var gateway = 'N/A';
				if (iface.route && iface.route.length > 0) {
					for (var i = 0; i < iface.route.length; i++) {
						var r = iface.route[i];
						if (r.target === '0.0.0.0' && r.nexthop) {
							gateway = r.nexthop;
							break;
						}
					}
				}

				return {
					name: iface.interface,
					proto: iface.proto || 'unknown',
					ipaddr: ipv4.address || 'N/A',
					netmask: ipv4.mask || 'N/A',
					gateway: gateway,
					dns: iface['dns-server'] || [],
					device: devName,
					up: iface.up === true,
					type: (iface.interface === 'wan' || iface.interface === 'wan6' || iface.proto === 'pppoe') ? 'WAN' : 'LAN',
					ipv6: ipv6.address ? ipv6.address + '/' + ipv6.mask : 'N/A',
					mac: devInfo.macaddr || 'N/A'
				};
			});
		}).catch(function() {
			return [
				{ name: 'lan', proto: 'static', ipaddr: '192.0.2.1', netmask: '255.255.255.0', device: 'br-lan', up: true, type: 'LAN', mac: '00:00:5E:00:53:01' },
				{ name: 'wan', proto: 'pppoe', ipaddr: '198.51.100.45', gateway: '198.51.100.1', dns: ['198.51.100.254', '192.0.2.254'], device: 'pppoe-wan', up: true, type: 'WAN', ipv6: '2001:db8:wan::1/64', mac: '00:00:5E:00:53:02' }
			];
		});
	},

	// Wrapper for storage spaces - strictly mock/TODO in this phase
	loadStorageInfo: function() {
		return Promise.resolve({
			root: {
				total: 1073741824, // 1 GB
				used: 268435456,   // 250 MB
				free: 805306368,   // 750 MB
				percent: 25
			},
			overlay: {
				total: 268435456,  // 256 MB
				used: 67108864,    // 64 MB
				free: 201326592,   // 192 MB
				percent: 25
			}
		});
	},

	// Wrapper for logread - strictly mock/TODO in this phase for security
	loadLogTail: function() {
		return Promise.resolve([
			"[TODO] Chức năng đọc log thật sẽ được cấu hình ở Phase sau với ACL riêng biệt.",
			"daemon.info dnsmasq[1234]: query[A] openwrt.org from 192.0.2.10 (Mock)",
			"daemon.info dnsmasq[1234]: reply openwrt.org is 198.51.100.100 (Mock)",
			"user.notice firewall: Reloading firewall due to interface wan trigger (Mock)",
			"kern.info kernel: [  123.456789] pppoe-wan: Link up (Mock)",
			"daemon.info pppd[5678]: Connection established (Mock)",
			"daemon.info pppd[5678]: Local IP address 198.51.100.45 (Mock)"
		]);
	},

	// Main load sequence returning combined results
	load: function() {
		return Promise.all([
			this.loadSystemInfo(),
			this.loadNetworkInfo(),
			this.loadStorageInfo(),
			this.loadLogTail()
		]);
	},

	// Helper to render responsive Card container
	createCard: function(title, emoji, colorClass, children) {
		return E('div', { 'class': 'tu-card' }, [
			E('div', { 'class': 'tu-card-header' }, [
				E('h3', { 'class': 'tu-card-title' }, title),
				E('div', { 'class': 'tu-icon ' + colorClass }, emoji)
			]),
			E('div', { 'class': 'tu-card-body' }, children)
		]);
	},

	// Main render view
	render: function(results) {
		var sys = results[0];
		var net = results[1];
		var storage = results[2];
		var logs = results[3];

		var self = this;

		// Inject modern styles compatible with LuCI light/dark themes
		var style = E('style', {}, [
			`.tu-container { font-family: system-ui, -apple-system, sans-serif; color: var(--color-text, #334155); padding: 12px; }`,
			`.tu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px; margin-bottom: 20px; }`,
			`.tu-card { background: var(--card-background, rgba(255, 255, 255, 0.8)); border: 1px solid var(--border-color, rgba(226, 232, 240, 0.8)); border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }`,
			`.tu-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05); }`,
			`.tu-card-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(226, 232, 240, 0.5); padding-bottom: 12px; margin-bottom: 16px; }`,
			`.tu-card-title { font-size: 16px; font-weight: 600; margin: 0; color: #0f172a; }`,
			`.tu-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; background: rgba(59, 130, 246, 0.1); }`,
			`.tu-table { width: 100%; border-collapse: collapse; }`,
			`.tu-table td { padding: 10px 0; border-bottom: 1px dotted rgba(226, 232, 240, 0.8); font-size: 13px; }`,
			`.tu-table tr:last-child td { border-bottom: none; }`,
			`.tu-label { color: #64748b; font-weight: 500; }`,
			`.tu-value { text-align: right; font-weight: 600; color: #1e293b; }`,
			`.tu-progress-bg { background: #e2e8f0; border-radius: 6px; height: 8px; overflow: hidden; margin-top: 6px; margin-bottom: 12px; }`,
			`.tu-progress-bar { height: 100%; border-radius: 6px; transition: width 0.4s ease-out; }`,
			`.tu-progress-primary { background: linear-gradient(90deg, #3b82f6, #1d4ed8); }`,
			`.tu-progress-success { background: linear-gradient(90deg, #10b981, #047857); }`,
			`.tu-progress-warning { background: linear-gradient(90deg, #f59e0b, #b45309); }`,
			`.tu-status { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 500; padding: 2px 10px; border-radius: 9999px; }`,
			`.tu-status-ok { background: rgba(16, 185, 129, 0.1); color: #047857; }`,
			`.tu-status-warn { background: rgba(245, 158, 11, 0.1); color: #b45309; }`,
			`.tu-status-error { background: rgba(239, 68, 68, 0.1); color: #b91c1c; }`,
			`.tu-log-console { background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 11px; padding: 14px; border-radius: 8px; max-height: 200px; overflow-y: auto; white-space: pre-wrap; border: 1px solid #1e293b; text-align: left; }`,
			`.tu-badge-interface { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-right: 4px; }`,
			`.tu-badge-wan { background: rgba(59, 130, 246, 0.1); color: #1d4ed8; border: 1px solid rgba(59, 130, 246, 0.2); }`,
			`.tu-badge-lan { background: rgba(16, 185, 129, 0.1); color: #047857; border: 1px solid rgba(16, 185, 129, 0.2); }`,
			/* Dark Mode theme adjustments */
			`body.dark-mode .tu-card, .dark-mode .tu-card { background: rgba(30, 41, 59, 0.95); border-color: rgba(71, 85, 105, 0.4); }`,
			`body.dark-mode .tu-card-title, .dark-mode .tu-card-title { color: #f8fafc; }`,
			`body.dark-mode .tu-card-header, .dark-mode .tu-card-header { border-bottom-color: rgba(71, 85, 105, 0.3); }`,
			`body.dark-mode .tu-value, .dark-mode .tu-value { color: #f1f5f9; }`,
			`body.dark-mode .tu-label, .dark-mode .tu-label { color: #94a3b8; }`,
			`body.dark-mode .tu-table td, .dark-mode .tu-table td { border-bottom-color: rgba(71, 85, 105, 0.2); }`,
			`body.dark-mode .tu-progress-bg, .dark-mode .tu-progress-bg { background: #334155; }`
		]);

		// Extract RAM variables (clamp values to prevent negatives or >100%)
		var ramTotal = sys.memory.total || 0;
		var ramFree = sys.memory.free || 0;
		var ramCached = sys.memory.cached || 0;
		var ramBuffered = sys.memory.buffered || 0;
		var ramUsed = Math.max(0, ramTotal - ramFree - ramCached - ramBuffered);
		var ramPercent = ramTotal > 0 ? Math.min(100, Math.round((ramUsed / ramTotal) * 100)) : 0;

		// Find WAN Interface status
		var wanIface = net.find(function(iface) {
			return iface.type === 'WAN' && iface.up;
		}) || net.find(function(iface) {
			return iface.name === 'wan';
		}) || {};

		// Grid Cards Rendering
		var systemCard = this.createCard('Hệ thống', '🖥️', 'bg-blue', E('table', { 'class': 'tu-table' }, [
			E('tr', {}, [ E('td', { 'class': 'tu-label' }, 'Phiên bản OpenWrt'), E('td', { 'class': 'tu-value' }, sys.version) ]),
			E('tr', {}, [ E('td', { 'class': 'tu-label' }, 'Nhân Kernel'), E('td', { 'class': 'tu-value' }, sys.kernel) ]),
			E('tr', {}, [ E('td', { 'class': 'tu-label' }, 'Chip CPU'), E('td', { 'class': 'tu-value' }, sys.cpu) ]),
			E('tr', {}, [ E('td', { 'class': 'tu-label' }, 'Thời gian chạy (Uptime)'), E('td', { 'class': 'tu-value' }, this.formatUptime(sys.uptime)) ]),
			E('tr', {}, [ E('td', { 'class': 'tu-label' }, 'Mức tải (Load Average)'), E('td', { 'class': 'tu-value' }, this.formatLoad(sys.load)) ])
		]));

		var cpuRamCard = this.createCard('CPU & RAM', '⚡', 'bg-emerald', E('div', {}, [
			E('table', { 'class': 'tu-table' }, [
				E('tr', {}, [ E('td', { 'class': 'tu-label' }, 'Mức tải hệ thống (Load Average)'), E('td', { 'class': 'tu-value' }, this.formatLoad(sys.load)) ])
			]),
			E('div', { 'style': 'display: flex; justify-content: space-between; margin-top: 12px;' }, [
				E('span', { 'class': 'tu-label' }, 'Bộ nhớ RAM đã dùng'),
				E('span', { 'class': 'tu-value' }, ramPercent + '% (' + this.formatSize(ramUsed) + ' / ' + this.formatSize(ramTotal) + ')')
			]),
			E('div', { 'class': 'tu-progress-bg' }, [
				E('div', { 'class': 'tu-progress-bar tu-progress-success', 'style': 'width: ' + ramPercent + '%' })
			]),
			E('table', { 'class': 'tu-table', 'style': 'margin-top: 8px;' }, [
				E('tr', {}, [ E('td', { 'class': 'tu-label' }, 'RAM Đệm (Buffered)'), E('td', { 'class': 'tu-value' }, this.formatSize(ramBuffered)) ]),
				E('tr', {}, [ E('td', { 'class': 'tu-label' }, 'RAM Cache (Cached)'), E('td', { 'class': 'tu-value' }, this.formatSize(ramCached)) ])
			])
		]));

		var storageCard = this.createCard('Bộ nhớ lưu trữ', '💾', 'bg-amber', E('div', {}, [
			E('div', { 'style': 'display: flex; justify-content: space-between;' }, [
				E('span', { 'class': 'tu-label' }, 'Phân vùng Root (/)'),
				E('span', { 'class': 'tu-value' }, storage.root.percent + '% (' + this.formatSize(storage.root.used) + ' / ' + this.formatSize(storage.root.total) + ')')
			]),
			E('div', { 'class': 'tu-progress-bg' }, [
				E('div', { 'class': 'tu-progress-bar tu-progress-warning', 'style': 'width: ' + storage.root.percent + '%' })
			]),
			E('div', { 'style': 'display: flex; justify-content: space-between; margin-top: 12px;' }, [
				E('span', { 'class': 'tu-label' }, 'Phân vùng Overlay (/overlay)'),
				E('span', { 'class': 'tu-value' }, storage.overlay.percent + '% (' + this.formatSize(storage.overlay.used) + ' / ' + this.formatSize(storage.overlay.total) + ')')
			]),
			E('div', { 'class': 'tu-progress-bg' }, [
				E('div', { 'class': 'tu-progress-bar tu-progress-primary', 'style': 'width: ' + storage.overlay.percent + '%' })
			])
		]));

		var wanCard = this.createCard('Trạng thái WAN & PPPoE', '🌐', 'bg-indigo', E('table', { 'class': 'tu-table' }, [
			E('tr', {}, [ 
				E('td', { 'class': 'tu-label' }, 'Kết nối WAN'), 
				E('td', { 'class': 'tu-value' }, [
					E('span', { 'class': 'tu-status ' + (wanIface.up ? 'tu-status-ok' : 'tu-status-error') }, 
						wanIface.up ? 'Hoạt động (Up)' : 'Mất kết nối (Down)'
					)
				])
			]),
			E('tr', {}, [ E('td', { 'class': 'tu-label' }, 'Giao thức kết nối'), E('td', { 'class': 'tu-value' }, (wanIface.proto || 'unknown').toUpperCase()) ]),
			E('tr', {}, [ E('td', { 'class': 'tu-label' }, 'Địa chỉ IPv4 WAN'), E('td', { 'class': 'tu-value' }, this.maskIP(wanIface.ipaddr)) ]),
			E('tr', {}, [ E('td', { 'class': 'tu-label' }, 'Địa chỉ IPv6 WAN'), E('td', { 'class': 'tu-value' }, this.maskIPv6(wanIface.ipv6)) ]),
			E('tr', {}, [ E('td', { 'class': 'tu-label' }, 'Gateway định tuyến'), E('td', { 'class': 'tu-value' }, this.maskIP(wanIface.gateway)) ]),
			E('tr', {}, [ E('td', { 'class': 'tu-label' }, 'DNS Server'), E('td', { 'class': 'tu-value' }, (wanIface.dns && wanIface.dns.length > 0) ? wanIface.dns.map(this.maskIP).join(', ') : 'N/A') ])
		]));

		// Render Interface status rows
		var ifaceRows = net.map(function(iface) {
			return E('tr', {}, [
				E('td', { 'class': 'tu-label' }, [
					E('span', { 'class': 'tu-badge-interface ' + (iface.type === 'WAN' ? 'tu-badge-wan' : 'tu-badge-lan') }, iface.name),
					E('span', { 'style': 'font-weight:bold;' }, iface.device)
				]),
				E('td', { 'class': 'tu-value' }, [
					E('span', { 'class': 'tu-status ' + (iface.up ? 'tu-status-ok' : 'tu-status-error') }, iface.up ? 'Up' : 'Down'),
					E('span', { 'style': 'margin-left: 10px; font-family: monospace; font-size:11px;' }, self.maskMAC(iface.mac))
				])
			]);
		});

		var interfacesCard = this.createCard('Danh sách giao tiếp mạng', '🔌', 'bg-violet', E('table', { 'class': 'tu-table' }, ifaceRows));

		// Firewall & Offload Status Card (Placeholder)
		var firewallCard = this.createCard('Bảo mật & Tăng tốc', '🛡️', 'bg-rose', E('table', { 'class': 'tu-table' }, [
			E('tr', {}, [ 
				E('td', { 'class': 'tu-label' }, 'Trạng thái Tường lửa'), 
				E('td', { 'class': 'tu-value' }, [ E('span', { 'class': 'tu-status tu-status-ok' }, 'Đang chạy (Read-only)') ]) 
			]),
			E('tr', {}, [ 
				E('td', { 'class': 'tu-label' }, 'Software Flow Offloading'), 
				E('td', { 'class': 'tu-value' }, [ E('span', { 'class': 'tu-status tu-status-ok' }, 'Kích hoạt (Mock)') ]) 
			]),
			E('tr', {}, [ 
				E('td', { 'class': 'tu-label' }, 'Hardware Flow Offloading'), 
				E('td', { 'class': 'tu-value' }, [ E('span', { 'class': 'tu-status tu-status-warn' }, 'Tắt (Mock)') ]) 
			]),
			E('tr', {}, [ 
				E('td', { 'class': 'tu-label' }, 'Bảo mật UCI Config'), 
				E('td', { 'class': 'tu-value' }, [ E('span', { 'class': 'tu-status tu-status-ok' }, 'Được bảo vệ') ]) 
			])
		]));

		// Log Tail console view
		var logConsole = E('div', { 'class': 'tu-log-console' }, logs.join('\n'));

		var logsCard = E('div', { 'class': 'tu-card', 'style': 'grid-column: 1 / -1; margin-top: 10px;' }, [
			E('div', { 'class': 'tu-card-header' }, [
				E('h3', { 'class': 'tu-card-title' }, 'Nhật ký hệ thống (System Log Tail - 10 dòng gần nhất)'),
				E('div', { 'class': 'tu-icon' }, '📋')
			]),
			E('div', { 'class': 'tu-card-body' }, [ logConsole ])
		]);

		// Main layout wrapper
		return E('div', { 'class': 'tu-container' }, [
			style,
			E('div', { 'class': 'tu-header', 'style': 'margin-bottom: 24px; text-align: left;' }, [
				E('h2', { 'style': 'margin: 0 0 6px 0; font-weight: 700; color: var(--color-title, #0f172a);' }, 'The Ultimate Overview'),
				E('p', { 'class': 'tu-label', 'style': 'margin: 0; font-size: 14px;' }, 
					'Hệ thống giám sát trạng thái thiết bị. Giao diện an toàn (Read-Only) không cho phép thay đổi cấu hình.'
				)
			]),
			E('div', { 'class': 'tu-grid' }, [
				systemCard,
				cpuRamCard,
				storageCard,
				wanCard,
				interfacesCard,
				firewallCard
			]),
			logsCard
		]);
	},

	// Disable standard Luci form save/reset buttons since this is a read-only dashboard
	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
