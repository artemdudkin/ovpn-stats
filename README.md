# ovpn-stats
Proof-of-concept web server to control users and traffic of OpenVPN (using artemdudkin/ovpn-nyr-ctl).

You can create/delete OpenVPN users and collect traffic statistics.
Also, server can delete expired users (if user have name according to <prefix>-yyMMdd template).
Also, server can call web hooks on "first_online" and "expired" user events.

## Installation

```
npm install ovpn-stats
```

Also, you should have configured OpenVPN management interface (i.e. `management localhost 7505` at OpenVPN configs)

## Usage

```
node server.js
```

## How it looks like

![page-index](https://github.com/artemdudkin/ovpn-stats/blob/master/docs/stats-index.png?raw=true)

![page-list](https://github.com/artemdudkin/ovpn-stats/blob/master/docs/stats-list.png?raw=true)


## Configuration
`SERVER_PORT`
`OPENVPN_MANAGEMENT_PORT`
`OVPN_URL`
`WEBHOOK_URL`
