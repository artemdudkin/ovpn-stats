# ovpn-stats
Proof-of-concept web server to control users and traffic of OpenVPN (using [artemdudkin/ovpn-nyr-ctl](https://github.com/artemdudkin/ovpn-nyr-ctl)).

1. Server collects traffic statistics (by parsing result of "status" command at OpenVPN management interface)
2. You can create/delete OpenVPN users
3. Server removes expired users (if user have name according to `<prefix>-yyMMdd` template)
4. Server calls web hooks on "first_connect" and "expired" user events.

## Installation

```
npm install ovpn-stats
```

Also, you should have configured OpenVPN management interface (i.e. `management localhost 7505` at OpenVPN configs)

## Usage

```
node server.js
```

  ## Configuration
`SERVER_PORT`
`OPENVPN_MANAGEMENT_PORT`
`OVPN_URL`
`WEBHOOK_URL`
  
## How it looks like

| index.html  | list.html |
| ------------- | ------------- |
| <img src="https://raw.githubusercontent.com/artemdudkin/ovpn-stats/main/docs/stats-index.png" width="300">  | <img src="https://raw.githubusercontent.com/artemdudkin/ovpn-stats/main/docs/stats-list.png" width="150">  |
