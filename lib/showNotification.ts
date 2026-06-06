export async function showNotification(title: string, options: NotificationOptions): Promise<void> {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  // Prefer service worker notifications — required on mobile Chrome
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return;
      }
    } catch {
      // fall through to fallback
    }
  }

  // Fallback: direct Notification (desktop browsers when no SW is registered)
  new Notification(title, options);
}
