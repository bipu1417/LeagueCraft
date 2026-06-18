import { addDoc, collection, db, serverTimestamp } from "../firebase";

export const CREATOR_NOTIFICATION_PHONE =
  process.env.REACT_APP_CREATOR_NOTIFICATION_PHONE || "918972089184";

export const normalizePhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

export const buildWhatsAppUrl = (phone, message) => {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return "";
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
};

export const buildSmsUrl = (phone, message) => {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return "";
  return `sms:${normalizedPhone}?body=${encodeURIComponent(message)}`;
};

export const queueNotification = async ({
  type,
  recipientRole,
  recipientUserId = "",
  recipientEmail = "",
  recipientPhone = "",
  title,
  message,
  metadata = {},
  senderId = "",
  senderEmail = "",
}) => {
  const normalizedPhone = normalizePhone(recipientPhone);
  const payload = {
    type,
    channel: normalizedPhone ? "whatsapp_or_sms" : "in_app",
    status: "queued",
    recipientRole,
    recipientUserId,
    recipientEmail,
    recipientPhone: normalizedPhone,
    title,
    message,
    whatsappUrl: normalizedPhone ? buildWhatsAppUrl(normalizedPhone, message) : "",
    smsUrl: normalizedPhone ? buildSmsUrl(normalizedPhone, message) : "",
    metadata,
    senderId,
    senderEmail,
    createdAt: serverTimestamp(),
  };

  return addDoc(collection(db, "notificationRequests"), payload);
};

export const notifySafely = async (payload) => {
  try {
    await queueNotification(payload);
  } catch (error) {
    console.warn("Notification could not be queued:", error);
  }
};
