# ovpn-stats
Proof-of-concept web server to control users and traffic of OpenVPN.<br>
(uses [artemdudkin/ovpn-nyr-ctl](https://github.com/artemdudkin/ovpn-nyr-ctl) and [Nyr/openvpn-install](https://github.com/Nyr/openvpn-install))

1. Server collects traffic statistics (by parsing result of "status" command at OpenVPN management interface)
2. You can create/delete OpenVPN users
3. Server removes expired users (if user have name according to `<prefix>-yyMMdd` template)
4. Server calls web hooks on "first_connect" and "expired" user events.

## Installation and usage

2. Download project and copy it to server where OpenVPN runs.
3. Get `OVPN_URL` - i.e. start [artemdudkin/ovpn-nyr-ctl](https://github.com/artemdudkin/ovpn-nyr-ctl) at the same server
4. `npm i`
5. `node server.js` (or you can use PM2 process manager `pm2 start server.js --name stats`)
6. Also, you should have configured OpenVPN management interface (i.e. `management localhost XXXX` at OpenVPN configs)

  ## Configuration
`SERVER_PORT`
`OPENVPN_MANAGEMENT_PORT`
`OVPN_URL`
`WEBHOOK_URL`
  
## How it looks like

| index.html  | list.html |
| ------------- | ------------- |
| <img src="https://raw.githubusercontent.com/artemdudkin/ovpn-stats/main/docs/stats-index.png" width="300">  | <img src="https://raw.githubusercontent.com/artemdudkin/ovpn-stats/main/docs/stats-list.png" width="150">  |
