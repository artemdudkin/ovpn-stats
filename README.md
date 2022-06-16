# ovpn-stats
Proof-of-concept web server to control users and traffic of OpenVPN (using [artemdudkin/ovpn-nyr-ctl](https://github.com/artemdudkin/ovpn-nyr-ctl)).

1. You can create/delete OpenVPN users and collect traffic statistics.
2. Also, server can delete expired users (if user have name according to `<prefix>-yyMMdd` template).
3. Also, server can call web hooks on "first_online" and "expired" user events.

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
