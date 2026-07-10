const nodemailer = require("nodemailer");

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || null;
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@agrios.org";
const EMAIL_HOST = process.env.SENDGRID_API_KEY ? "smtp.sendgrid.net" : null;
const EMAIL_PORT = EMAIL_HOST ? 587 : null;
const EMAIL_USER = process.env.SENDGRID_API_KEY || null;
const EMAIL_PASS = SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY : null;

async function sendEmail({ to, subject, html, text }) {
  if (!SENDGRID_API_KEY) {
    console.warn(`[Email] SendGrid API key not configured. Would have sent email to ${to}: ${subject}`);
    return { success: false, message: "Email service not configured (missing SendGrid API key)." };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: false,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text: text || "",
      html: html || "",
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("[Email Send Error]:", err.message);
    return { success: false, error: err.message };
  }
}

async function sendPriceAlertEmail({ to, crop_name, variety, target_price, market, comparison, triggered_price }) {
  const subject = `AgriOS: Price Alert Triggered - ${crop_name}`;
  const text = `Your price alert for ${crop_name} (${variety}) has been triggered.\n\n` +
    `Condition: Price ${comparison === "ABOVE" ? "rose above" : "fell below"} ₹${target_price}/Quintal\n` +
    `Current Market: ${market}\n` +
    `Triggered Price: ₹${triggered_price}/Quintal\n\n` +
    `Log in to AgriOS to view more details.`;

  return sendEmail({ to, subject, text });
}

async function sendTaskAssignmentEmail({ to, task_title, farm_name, assigned_by }) {
  const subject = `AgriOS: New Task Assigned - ${task_title}`;
  const text = `You have been assigned a new task on AgriOS.\n\n` +
    `Task: ${task_title}\n` +
    `Farm: ${farm_name}\n` +
    `Assigned by: ${assigned_by}\n\n` +
    `Log in to AgriOS to view task details.`;

  return sendEmail({ to, subject, text });
}

async function sendLowStockAlertEmail({ to, item_name, farm_name, current_qty, threshold }) {
  const subject = `AgriOS: Low Stock Alert - ${item_name}`;
  const text = `Inventory alert for ${farm_name}.\n\n` +
    `Item: ${item_name}\n` +
    `Current Quantity: ${current_qty}\n` +
    `Safety Threshold: ${threshold}\n\n` +
    `Please restock this item soon.`;

  return sendEmail({ to, subject, text });
}

module.exports = {
  sendEmail,
  sendPriceAlertEmail,
  sendTaskAssignmentEmail,
  sendLowStockAlertEmail,
};
