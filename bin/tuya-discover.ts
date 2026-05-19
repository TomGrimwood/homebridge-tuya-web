#!/usr/bin/env node
/**
 * tuya-discover
 * -------------
 * Standalone helper that logs in to the Tuya Smart Life cloud via QR-code
 * pairing, lists every device on the account along with its id / local_key /
 * IP / category, and emits a ready-to-paste config.json snippet for
 * `homebridge-tuya-web-smartlife` in LAN-only mode.
 *
 * After running this once you can:
 *   1. Paste the printed `devices` array into your Homebridge config.json.
 *   2. Enable LAN-only mode and delete the Tuya account if you wish — the
 *      local_keys are stable for the life of the device (until factory reset).
 *
 * Usage:
 *   npx tuya-discover                # prompts for user code interactively
 *   npx tuya-discover -c BxtZoOm     # passes user code on the command line
 *   npx tuya-discover --json         # outputs raw JSON, no instructions
 *
 * No installation step needed — npm exposes this as a bin so it works
 * from anywhere the plugin is installed.
 */
import QRCode from "qrcode";
import * as readline from "readline";
import { LoginControl } from "../src/api/loginControl";
import { CustomerApi, CustomerTokenInfo } from "../src/api/customerApi";
import { CATEGORY_TO_DEV_TYPE, TuyaDeviceType } from "../src/api/response";

// --------------------------------------------------------------------------
// CLI argument parsing
// --------------------------------------------------------------------------

interface CliArgs {
  userCode?: string;
  json: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { json: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") {args.help = true;}
    else if (a === "--json") {args.json = true;}
    else if (a === "-c" || a === "--code" || a === "--user-code") {
      args.userCode = argv[++i];
    } else if (a.startsWith("--code=")) {
      args.userCode = a.slice("--code=".length);
    }
  }
  return args;
}

function printHelp(): void {
  process.stdout.write(
`tuya-discover — find your Tuya device IDs and local_keys

USAGE
    tuya-discover [options]

OPTIONS
    -c, --code <code>    Smart Life User Code (will prompt if omitted)
    --json               Output JSON only (machine-readable)
    -h, --help           Show this help text

WHAT IT DOES
    1. Generates a Tuya pairing QR code in your terminal.
    2. You scan it with the Smart Life app (Me → Scan QR).
    3. It walks every home + device on your account and prints
       a config.json snippet you can paste straight into Homebridge.

WHERE TO GET YOUR USER CODE
    Smart Life app → Me → Settings → Account and Security → User Code
`,
  );
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// --------------------------------------------------------------------------
// Types for cloud responses
// --------------------------------------------------------------------------

interface CloudHome {
  ownerId: string | number;
  name: string;
}

interface CloudDevice {
  id: string;
  name: string;
  ip?: string;
  local_key?: string;
  category?: string;
  product_id?: string;
  product_name?: string;
  online?: boolean;
}

interface DiscoveredDevice {
  name: string;
  id: string;
  local_key: string;
  ip: string;
  category: string;
  product_id: string;
  device_type: TuyaDeviceType;
  online: boolean;
  home: string;
}

// --------------------------------------------------------------------------
// Main flow
// --------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const userCode =
    args.userCode ??
    (await prompt(
      "Smart Life User Code (Me → Settings → Account & Security → User Code): ",
    ));
  if (!userCode) {
    process.stderr.write("ERROR: no user code provided\n");
    process.exit(2);
  }

  const stderr = (msg: string): void => {
    if (!args.json) {process.stderr.write(msg + "\n");}
  };

  stderr("Requesting QR pairing token…");
  const lc = new LoginControl();
  const { token, qrData } = await lc.generateQrCode(userCode);

  if (!args.json) {
    process.stderr.write(
      "\nScan this QR code with the Smart Life app (Me → Scan QR):\n\n",
    );
    process.stderr.write(
      await QRCode.toString(qrData, { type: "terminal", small: true }),
    );
    process.stderr.write(
      "If the QR is mangled, paste this URL into a browser instead:\n  https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" +
        encodeURIComponent(qrData) +
        "\n",
    );
    process.stderr.write("\nWaiting for scan (up to 5 minutes)…\n");
  }

  const login = await lc.waitForLogin(token, userCode);
  stderr(`Logged in as ${login.username || login.uid}.`);

  const tokenInfo: CustomerTokenInfo = {
    t: login.t,
    expire_time: login.t + login.expire_time * 1000,
    uid: login.uid,
    access_token: login.access_token,
    refresh_token: login.refresh_token,
  };
  const api = new CustomerApi(
    tokenInfo,
    "HA_3y9q4ak7g4ephrvke",
    userCode,
    login.endpoint,
  );

  const homesResp = await api.get<CloudHome[]>("/v1.0/m/life/users/homes");
  const homes = Array.isArray(homesResp.result) ? homesResp.result : [];
  stderr(`Found ${homes.length} home(s).`);

  const discovered: DiscoveredDevice[] = [];
  for (const home of homes) {
    const homeId = String(home.ownerId);
    stderr(`  Listing devices in "${home.name}" (${homeId})…`);
    const devsResp = await api.get<CloudDevice[]>(
      "/v1.0/m/life/ha/home/devices",
      { homeId },
    );
    const devs = Array.isArray(devsResp.result) ? devsResp.result : [];
    for (const d of devs) {
      if (!d.local_key) {
        stderr(`    ! ${d.name}: API did not return local_key, skipping.`);
        continue;
      }
      const category = d.category ?? "";
      discovered.push({
        name: d.name,
        id: d.id,
        local_key: d.local_key,
        ip: d.ip ?? "",
        category,
        product_id: d.product_id ?? "",
        device_type: CATEGORY_TO_DEV_TYPE[category] ?? "switch",
        online: d.online ?? false,
        home: home.name,
      });
    }
  }

  stderr(`Discovered ${discovered.length} device(s) total.`);
  emitOutput(discovered, args.json);
}

// --------------------------------------------------------------------------
// Output rendering
// --------------------------------------------------------------------------

function emitOutput(devices: DiscoveredDevice[], asJson: boolean): void {
  if (asJson) {
    process.stdout.write(JSON.stringify(devices, null, 2) + "\n");
    return;
  }

  process.stdout.write("\n");
  process.stdout.write("=".repeat(72) + "\n");
  process.stdout.write("  DEVICE SUMMARY\n");
  process.stdout.write("=".repeat(72) + "\n\n");

  for (const d of devices) {
    process.stdout.write(`• ${d.name}  (${d.home})\n`);
    process.stdout.write(`    id         ${d.id}\n`);
    process.stdout.write(`    local_key  ${d.local_key}\n`);
    process.stdout.write(`    ip         ${d.ip}   ← WAN IP. Find LAN IP from your router DHCP table.\n`);
    process.stdout.write(`    category   ${d.category}  →  device_type: ${d.device_type}\n`);
    process.stdout.write(`    online     ${d.online ? "yes" : "no"}\n\n`);
  }

  process.stdout.write("=".repeat(72) + "\n");
  process.stdout.write("  HOMEBRIDGE CONFIG SNIPPET\n");
  process.stdout.write("=".repeat(72) + "\n\n");
  process.stdout.write(
    "Replace the IP addresses below with the LAN IPs from your router\n",
  );
  process.stdout.write(
    "(the cloud only reports your house's WAN IP, which won't work).\n\n",
  );

  const snippet = {
    platform: "TuyaWebPlatform",
    name: "TuyaWebPlatform",
    options: {
      localOnly: true,
    },
    devices: devices.map((d) => ({
      name: d.name,
      id: d.id,
      local_key: d.local_key,
      ip: d.ip || "REPLACE_WITH_LAN_IP",
      version: "3.3",
      device_type: d.device_type,
    })),
    scenes: false,
  };

  process.stdout.write(JSON.stringify(snippet, null, 2) + "\n\n");
  process.stdout.write(
    "Paste this into your Homebridge config.json `platforms` array,\n" +
      "(or use the Homebridge UI: Plugins → TuyaWebPlatform → Settings,\n" +
      "tick LAN-only and add devices), then restart Homebridge.\n",
  );
}

main().catch((err) => {
  process.stderr.write(
    "\nFATAL: " + (err instanceof Error ? err.message : String(err)) + "\n",
  );
  if (err instanceof Error && err.stack) {
    process.stderr.write(err.stack + "\n");
  }
  process.exit(1);
});
