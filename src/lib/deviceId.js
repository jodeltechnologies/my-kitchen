// A stable per-device identifier stored locally.
// Clearing app data creates a "new device" (which then needs approval).
export function getDeviceId() {
  let id = localStorage.getItem("itenri_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("itenri_device_id", id);
  }
  return id;
}

export function getDeviceName() {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "Android device";
  if (/iPhone|iPad/i.test(ua)) return "iPhone / iPad";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Mac/i.test(ua)) return "Mac";
  return "Web browser";
}
