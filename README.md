<span style="text-align: center">

# Tuya Web

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![certified-by-hoobs](https://badgen.net/badge/hoobs/certified/yellow)](https://plugins.hoobs.org/plugin/@milo526/homebridge-tuya-web)

[![npm](https://img.shields.io/npm/v/@milo526/homebridge-tuya-web/latest?label=latest)](https://www.npmjs.com/package/@milo526/homebridge-tuya-web)
[![npm](https://img.shields.io/npm/v/@milo526/homebridge-tuya-web/next?label=next)](https://www.npmjs.com/package/@milo526/homebridge-tuya-web/v/next)
[![npm](https://img.shields.io/npm/dt/@milo526/homebridge-tuya-web)](https://www.npmjs.com/package/@milo526/homebridge-tuya-web)
[![GitHub release](https://img.shields.io/github/release/milo526/homebridge-tuya-web.svg)](https://github.com/milo526/homebridge-tuya-web/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Homebridge Discord](https://img.shields.io/discord/432663330281226270?color=728ED5&logo=discord&label=discord)](https://discord.gg/hZubhrz)
[![GitHub issues](https://img.shields.io/github/issues/milo526/homebridge-tuya-web)](https://github.com/milo526/homebridge-tuya-web/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/milo526/homebridge-tuya-web)](https://github.com/milo526/homebridge-tuya-web/pulls)

</span>

## Overview

Hoobs and Homebridge plugin for Tuya devices using a cloud Tuya Web Api.

This plugin is based on the Home Assistant Tuya integration that implements a special Tuya Home Assistant API.

See [Home Assistant Tuya integration](https://www.home-assistant.io/components/tuya/) and [Tuyaha python library](https://github.com/PaulAnnekov/tuyaha).

## Features

This plugin implements the following features:

- Controlling Tuya Wi-Fi enabled devices from within HomeKit enabled iOS Apps.
- Uses simple and lightweight Cloud Web API to control and get state update from Tuya devices. You will need a stable internet connection to control the devices.
- Device State Caching. State of devices is cached in memory, every time a HomeKit app request status updates from the devices this results in a very fast and responsive response. There can be a latency in updates when a device is controlled from an App/Hub/Controller other than HomeKit, e.g. from the Tuya Android/iOS App.

## What's different in this fork

This is a fork of [`@milo526/homebridge-tuya-web`](https://github.com/milo526/homebridge-tuya-web) brought up to date with the new Tuya Smart Life Sharing API (the legacy `homeassistant/auth.do` API used by the upstream package has been switched off by Tuya). On top of that, this fork adds:

- **LAN-only mode** — the plugin can run with zero cloud access at runtime; the Tuya cloud is only contacted once when you first need to obtain each device's `local_key`. After that, the Tuya account can be deleted and the device firewalled off from the internet at your router.
- **`tuya-discover` CLI** — a standalone helper that walks every device on your Smart Life account in a single command and prints a ready-to-paste Homebridge config snippet for LAN-only mode.
- **Fixes inherited from PR [milo526#658](https://github.com/milo526/homebridge-tuya-web/pull/658)** — QR-code pairing with the Smart Life app, V1↔V2 brightness/color range translation, plus a fix for HomeKit "No Response" errors when the cloud returns missing/zero brightness fields.

The Homebridge platform name (`TuyaWebPlatform`) is unchanged, so existing `config.json` entries continue to load.

## Installation

### Quickest: install from the release branch of this fork

The release branch ships pre-built JavaScript, so `npm install` works without any compilation step. Run this on your Homebridge host:

```bash
cd /var/lib/homebridge
npm install 'https://github.com/TomGrimwood/homebridge-tuya-web.git#release'
```

…then restart Homebridge.

Updates later are just:

```bash
cd /var/lib/homebridge
npm update homebridge-tuya-web-smartlife
```

> The package is named `homebridge-tuya-web-smartlife` rather than `@milo526/homebridge-tuya-web` on purpose — Homebridge's auto-update otherwise reverts the install back to the stale (broken) registry version.

### Alternative: Homebridge UI

The Homebridge UI's **"Install from GitHub"** path doesn't currently build TypeScript on install, so it lands a broken copy. Use the `npm install` command above instead. After installation the **Settings** UI of the plugin works normally and exposes the LAN-only toggle.

## Discovering devices (`tuya-discover`)

`tuya-discover` is a standalone CLI shipped with the plugin. It logs in once via Smart Life QR-code pairing, walks every home and every device on your account, and prints both a human-readable summary and a ready-to-paste config snippet.

### Where to get your User Code first

Smart Life app → **Me** → **Settings** → **Account and Security** → **User Code**. It's typically 7 characters, e.g. `BxtZoOm`.

### Run it on the Homebridge box

```bash
npx tuya-discover                   # prompts for your User Code
npx tuya-discover -c BxtZoOm        # passes User Code on the command line
npx tuya-discover --json            # machine-readable output (for scripting)
npx tuya-discover --help
```

### Run it on any Linux PC (no Homebridge needed)

You don't need Homebridge installed to use the discovery tool. Pick one of:

**Option 1 — one-shot via `npx` (no install)**

```bash
npx -y -p 'github:TomGrimwood/homebridge-tuya-web#release' tuya-discover -c BxtZoOm
```

`npx` fetches the release branch into its cache (~3s the first time) and runs the CLI from it. Re-running uses the cache.

**Option 2 — persistent global install**

```bash
npm install -g 'github:TomGrimwood/homebridge-tuya-web#release'
tuya-discover -c BxtZoOm
```

If `npm install -g` hits `EACCES`, either use `sudo` or configure a per-user prefix:

```bash
npm config set prefix ~/.npm-global
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
npm install -g 'github:TomGrimwood/homebridge-tuya-web#release'
```

**Option 3 — straight from a git clone**

```bash
git clone -b release https://github.com/TomGrimwood/homebridge-tuya-web.git
cd homebridge-tuya-web
node dist/bin/tuya-discover.js -c BxtZoOm
```

`dist/` is pre-built and committed on the release branch, so there's no `npm install` step.

### What the output looks like

```
========================================================================
  DEVICE SUMMARY
========================================================================

• Connect 10W Smart White Bulb B22  (My Home)
    id         eb119c7e19b2e1f2a6gdmp
    local_key  r<Q*f6pEeR'mPR-s
    ip         203.211.79.252   ← WAN IP. Find LAN IP from your router DHCP table.
    category   dj  →  device_type: light
    online     yes

========================================================================
  HOMEBRIDGE CONFIG SNIPPET
========================================================================

{
  "platform": "TuyaWebPlatform",
  "name": "TuyaWebPlatform",
  "options": { "localOnly": true },
  "devices": [
    {
      "name": "Connect 10W Smart White Bulb B22",
      "id": "eb119c7e19b2e1f2a6gdmp",
      "local_key": "r<Q*f6pEeR'mPR-s",
      "ip": "REPLACE_WITH_LAN_IP",
      "version": "3.3",
      "device_type": "light"
    }
  ],
  "scenes": false
}
```

The IP field needs one manual edit — the cloud only knows your WAN IP, so look up each device's LAN IP in your router's DHCP table and substitute it in. After that, paste the snippet into the `platforms` array of `~/.homebridge/config.json` (or use the Homebridge UI's settings page for the plugin) and restart Homebridge.

> **Tip:** Once you've recorded the `local_key`s, they're stable until the device is factory-reset. You can delete the Tuya/Smart Life account and the plugin will keep working, since LAN mode never re-contacts the cloud.

## Configuration

There are two modes; you can switch between them at any time by editing `config.json` or via the Homebridge UI.

### LAN-only mode (recommended)

No cloud connection at runtime. Each device is configured with its `id`, `local_key` and LAN IP — typically obtained once via `tuya-discover`.

```json
{
  "platform": "TuyaWebPlatform",
  "name": "TuyaWebPlatform",
  "options": {
    "localOnly": true
  },
  "devices": [
    {
      "name": "Lounge bulb",
      "id": "eb119c7e19b2e1f2a6gdmp",
      "local_key": "r<Q*f6pEeR'mPR-s",
      "ip": "192.168.50.231",
      "version": "3.3",
      "device_type": "light"
    },
    {
      "name": "Bedroom bulb",
      "id": "...",
      "local_key": "...",
      "ip": "192.168.50.232",
      "version": "3.3",
      "device_type": "light"
    }
  ]
}
```

Per-device fields:

- `id` (required) — Tuya virtual device id, shown by `tuya-discover`.
- `local_key` (required) — 16-character AES key, shown by `tuya-discover`.
- `ip` (recommended) — LAN IP of the device. If omitted, the plugin tries UDP discovery, which is unreliable on VLAN-segregated networks.
- `name` — display name in HomeKit. Defaults to `id`.
- `version` — Tuya protocol version. Defaults to `"3.3"`, which covers most devices. Some newer firmware uses `"3.4"` or `"3.5"`.
- `device_type` — `light`, `dimmer`, `switch`, `outlet`, `fan`, `cover`, `window`, `garage`, `climate`, `temperature_sensor`. Defaults to `light`.
- `dps_map` (advanced) — override the default DPS-number → instruction-code map for unusual firmware. Example: `{ "20": "switch_led", "22": "bright_value_v2" }`.

#### Tip — block the device from the internet

For maximum benefit of LAN-only mode, block each Tuya device's MAC from reaching the WAN at your router. Most consumer routers expose this under **Parental Controls** or **Access Control**. A DHCP static lease (so the LAN IP doesn't change) is also strongly recommended. The plugin will keep working as long as it can reach the device on TCP/6668 over your LAN.

### Cloud mode (legacy)

Uses the Smart Life Sharing API. Requires QR-code pairing on first start (the QR will be printed in the Homebridge log).

```json
{
  "platform": "TuyaWebPlatform",
  "name": "TuyaWebPlatform",
  "options": {
    "userCode": "BxtZoOm"
  }
}
```

`options` fields in cloud mode:

- `userCode` (required) — Smart Life User Code. Smart Life app → Me → Settings → Account and Security → User Code.
- `pollingInterval` (optional) — Seconds between cloud polls. Must be ≥ 600 to avoid rate limits.

> First-time pairing must be done with the **Smart Life** app, not the **Tuya Smart** app — the API rejects the latter.
>
> Tokens are cached in `<homebridgeStoragePath>/tuya-sharing-tokens.json` so subsequent restarts don't need a re-scan.

## Support

Please notice that there is no official support for this plugin.  
If you have a question, please [start a discussion](https://github.com/milo526/homebridge-tuya-web/discussions/new).  
If you would like to report a bug, please [open an issue](https://github.com/milo526/homebridge-tuya-web/issues/new/choose).

You can also get community help in the [Homebridge Discord Server](https://discord.gg/kqNCe2D) or on the [Homebridge Reddit](https://www.reddit.com/r/homebridge/).

<span style="text-align: center">

[![Homebridge Discord](https://discordapp.com/api/guilds/432663330281226270/widget.png?style=banner2)](https://discord.gg/kqNCe2D) [![Homebridge Reddit](https://raw.githubusercontent.com/homebridge/homebridge/master/.github/homebridge-reddit.svg?sanitize=true)](https://www.reddit.com/r/homebridge/)

</span>

# Advanced configuration

## Overruling Device Types

It is possible to override values from the default. As of now, only overruling device types is possible. See example configuration below.

```json
{
  "platform": "TuyaWebPlatform",
  "name": "TuyaWebPlatform",
  "options": {},
  "defaults": [
    {
      "id": "<device name or id>",
      "device_type": "<desired device type>"
    }
  ]
}
```

The `defaults` has these properties:

- `id` The name or ID for the device that is registered in the Android/iOS App. When matching on ID, please provide the `Tuya ID` as shown during plugin boot.
- `device_type` The `device_type` to be overruled. This can be useful for dimmers that are reported as `light` by the Tuya API and don't support hue and saturation, or for outlets that are reported as `switch`.

> Note: After overriding the device type, it might appear duplicated in both HomeBridge (Accessories Tab) and the Home App. To solve this issue, go to the Homebridge settings (top right corner) and remove the device using the `Remove Single Cached Accessory` option.

## Configure Devices

Some devices allow for extra configuration.  
The easiest option is to do this through [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x#homebridge-config-ui-x).  
In the plugin settings, go to "Device Settings" and click on "Add Device Settings".  
Add the device ID (or name) and select the device type.  
If the given device type allows overwriting settings, the options will appear below.

### Thermostat/Climate

These devices can have a minimum- and maximum temperature, as well as a temperature factor.

The minimum and maximum values must be entered as degrees Celsius with half degree increments; i.e. `-16`, `5`, `23`, `32.5`.  
This will influence the minimum and maximum temperature that you will be able to set the thermostat at in HomeKit.

The temperature factor can be used to influence the shown temperature. If HomeKit is showing an extremely high temperature, please try setting this value to `0.1`.
This will change the shown value from i.e. `220` to `220 * 0.1 = 22`.
The value entered here must be a positive decimal value i.e. `0.1`, `1`, `2.5`.

If desired, you can overwrite these devices to the temperature sensor. This will only report the current temperature and not allow you to change the temperature.

## Hiding devices

There are some valid reasons why you might not want to expose certain devices to HomeKit. You might for example have another plugin active which also exposes certain Tuya devices, adding these devices to this list will prevent them from showing up multiple times.

```json
{
  "platform": "TuyaWebPlatform",
  "name": "TuyaWebPlatform",
  "options": {},
  "hiddenAccessories": ["<device name or id>"]
}
```

## Whitelisting scenes

To prevent an overload of scenes clogging up your HomeKit devices, scenes are by default not exposed to HomeKit. When you wish to add Tuya scenes to homekit, you will need to add them to the whitelist.

### Add all scenes to HomeKit

You can add all your tuya scenes to HomeKit by setting the `scenes` key to `true`.

```json
{
  "platform": "TuyaWebPlatform",
  "name": "TuyaWebPlatform",
  "options": {},
  "scenes": true
}
```

### Add specific scenes to HomeKit

To add specific scenes to HomeKit, you can set the `scenes` key to true and set `scenesWhitelist` to an array in which you define either the names or IDs of the scenes that you'd wish to expose.

```json
{
  "platform": "TuyaWebPlatform",
  "name": "TuyaWebPlatform",
  "options": {},
  "scenes": true,
  "scenesWhitelist": ["Scene-id", "Scene-name"]
}
```

### Add no scenes to HomeKit

To explicitly disable scene support, set the `scenes` key to `false`.

# Supported Device Types

There is currently support for the following device types within this plugin:

- **Climate** - The plugin allows reading and setting the desired temperature for certain Tuya thermostats.
- **Cover** - The plugin allows opening and closing window coverings. If preferred, the device type can be set to `garage` to expose the cover device as a garage door.
- **Fan** - The platform supports most kinds of Tuya fans. This is partly implemented and only currently supports controlling the on/off state and speed control. The plugin lacks support for oscillation due to a Tuya limitation.
- **Light/Dimmer** - The platform supports most types of Tuya lights. This is partly implemented and only currently supports controlling the on/off state and the brightness. This can be used with a dimmer.
- **Scene** - Scenes support can be enabled in the config, this is disabled by default.
- **Switch/Outlet** - The platform supports switch and outlets/sockets.

# How to check whether the API this library uses can control your device?

Run `tuya-discover` (see [_Discovering devices_](#discovering-devices-tuya-discover) above). If a device shows up in its output with a `local_key`, this plugin can drive it — either via LAN-only mode (recommended) or cloud mode.

If a device does **not** appear, check that it's been added to the **Smart Life** app (not the Tuya Smart app or any vendor-branded variant). Branded apps typically register devices against a separate sandbox that the Smart Life sharing API can't see; factory-reset the device and pair it via Smart Life instead.

# Additional Resources

If you need more assistance regarding Plugin installation, please have a look at the following external resources:

- YouTube-Video: [Tuya Geräte über Homebridge-Web steuern - Einfach & Schnell ⏰](https://www.youtube.com/watch?v=6Jhon4lWmKc) (🇩🇪)
