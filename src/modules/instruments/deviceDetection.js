// Device detection for the Instruments & Devices gateway.
//
// HONEST SCOPE, stated plainly because this matters: a browser cannot
// install an operating-system driver. No web page, on any browser, has
// that capability — it would be a severe security hole if one did. What
// a browser genuinely CAN do, with the person's explicit one-time
// permission, is talk directly to a connected USB or serial device using
// WebUSB and Web Serial — no OS driver needed for devices that speak a
// standard USB/serial protocol, which covers a real share of lab
// analyzers, barcode scanners, and label printers.
//
// So "auto-detect and install drivers" becomes, honestly: detect what's
// plugged in, read its real vendor/product identity from the browser API,
// suggest a match against known equipment where one exists, and let the
// gateway register it — genuine detection, genuine pairing, no invented
// driver-installation step that doesn't exist for a web page.
//
// Browser support: WebUSB and Web Serial are Chromium-only (Chrome, Edge,
// Opera) as of this writing — not Safari, not Firefox. Every function here
// checks support first and fails with a clear, honest message rather than
// pretending to work.

/** A small starting set of publicly documented USB vendor IDs for common
 * point-of-care and peripheral device manufacturers. This is deliberately
 * NOT a comprehensive medical-device database — building one honestly
 * requires each hospital's actual equipment list, added here as it's
 * identified, rather than a large table of guessed identifiers presented
 * as verified fact. An unmatched vendor ID is not a failure; it just means
 * this hospital is the first to connect that particular device, and staff
 * confirm the category manually instead. */
const KNOWN_VENDORS = {
  0x0483: { name: "STMicroelectronics (common in barcode scanners & POCT devices)", suggestedCategory: "analyzer" },
  0x04b8: { name: "Epson (common in receipt/label printers)", suggestedCategory: "printer" },
  0x03f0: { name: "HP (printers)", suggestedCategory: "printer" },
  0x0922: { name: "Dymo (label printers)", suggestedCategory: "printer" },
  0x1a86: { name: "QinHeng Electronics (common USB-serial adapter chipset)", suggestedCategory: "analyzer" },
};

export function isWebUsbSupported() {
  return typeof navigator !== "undefined" && "usb" in navigator;
}
export function isWebSerialSupported() {
  return typeof navigator !== "undefined" && "serial" in navigator;
}
export function isDeviceDetectionSupported() {
  return isWebUsbSupported() || isWebSerialSupported();
}

function toHex(n) {
  return "0x" + n.toString(16).padStart(4, "0");
}

/**
 * Opens the browser's native USB device picker. The person sees every USB
 * device physically connected to their machine and chooses one — this
 * permission prompt cannot be skipped or automated, by design, the same
 * way a browser can never auto-approve a camera or microphone.
 */
export async function detectUsbDevice() {
  if (!isWebUsbSupported()) {
    throw new Error("WebUSB isn't available in this browser. Use Chrome or Edge on desktop, or connect this device to the machine's operating system directly and use a serial/network bridge instead.");
  }
  let device;
  try {
    device = await navigator.usb.requestDevice({ filters: [] });
  } catch (e) {
    if (e.name === "NotFoundError") throw new Error("No device was selected.");
    throw new Error(`Couldn't access the device: ${e.message}`);
  }
  const known = KNOWN_VENDORS[device.vendorId];
  return {
    connectionType: "usb",
    vendorId: toHex(device.vendorId),
    productId: toHex(device.productId),
    productName: device.productName || "Unnamed USB device",
    manufacturerName: device.manufacturerName || known?.name || "Unknown manufacturer",
    serialNumber: device.serialNumber || null,
    suggestedCategory: known?.suggestedCategory || null,
    matched: !!known,
  };
}

/**
 * Opens the browser's native serial port picker — for older lab analyzers
 * and instruments that still speak RS-232/USB-serial rather than modern
 * USB device classes, which is a real and common case in hospital
 * equipment fleets spanning two decades of purchase dates.
 */
export async function detectSerialDevice() {
  if (!isWebSerialSupported()) {
    throw new Error("Web Serial isn't available in this browser. Use Chrome or Edge on desktop.");
  }
  let port;
  try {
    port = await navigator.serial.requestPort();
  } catch (e) {
    if (e.name === "NotFoundError") throw new Error("No port was selected.");
    throw new Error(`Couldn't access the port: ${e.message}`);
  }
  const info = port.getInfo();
  const known = info.usbVendorId ? KNOWN_VENDORS[info.usbVendorId] : null;
  return {
    connectionType: "serial",
    vendorId: info.usbVendorId ? toHex(info.usbVendorId) : "\u2014",
    productId: info.usbProductId ? toHex(info.usbProductId) : "\u2014",
    productName: "Serial device",
    manufacturerName: known?.name || "Unknown manufacturer",
    serialNumber: null,
    suggestedCategory: known?.suggestedCategory || "analyzer",
    matched: !!known,
  };
}

/** Every USB device the browser has already been granted access to in a
 * past session, without prompting again — used to show "already paired"
 * devices when the gateway screen loads. */
export async function listAuthorizedUsbDevices() {
  if (!isWebUsbSupported()) return [];
  const devices = await navigator.usb.getDevices();
  return devices.map((d) => ({
    vendorId: toHex(d.vendorId), productId: toHex(d.productId),
    productName: d.productName || "Unnamed USB device",
  }));
}
