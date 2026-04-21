import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createMailer, sendEmail, buildUnsubscribeUrl, renderUnsubscribeFooter } from "@plantagoai/messaging";

initializeApp();

const UNSUBSCRIBE_BASE_URL = "https://us-east1-plantagoai.cloudfunctions.net/unsubscribe";

let mailerReady = false;
function ensureMailer() {
  if (mailerReady) return;
  createMailer(process.env.RESEND_API_KEY, "PlantagoAI <contact@plantagoai.com>");
  mailerReady = true;
}

const interestLabels = {
  foundation: "Foundation",
  herbpulse: "HerbPulse",
  markethub: "MarketHub",
  soho: "SOHO",
  nomadex: "Nomadex",
  other: "Other",
};

function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function layout({ headerTitle, headerSubtitle, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(headerTitle)}</title>
</head>
<body style="margin:0;padding:0;background:#0b0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#e5e7eb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f14;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111827;border:1px solid #1f2937;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:24px 28px;background:linear-gradient(135deg,#059669 0%,#0891b2 100%);">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:11px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,0.85);text-transform:uppercase;">PlantagoAI</td>
              </tr>
              <tr>
                <td style="padding-top:6px;font-size:20px;font-weight:600;color:#ffffff;line-height:1.3;">${escapeHtml(headerTitle)}</td>
              </tr>
              ${headerSubtitle ? `<tr><td style="padding-top:4px;font-size:13px;color:rgba(255,255,255,0.75);">${escapeHtml(headerSubtitle)}</td></tr>` : ""}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;font-size:14px;line-height:1.55;color:#e5e7eb;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;background:#0b0f14;border-top:1px solid #1f2937;font-size:11px;color:#6b7280;">
            Sent by the PlantagoAI site · <a href="https://plantagoai.com" style="color:#10b981;text-decoration:none;">plantagoai.com</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const onContactCreated = onDocumentCreated(
  {
    document: "contacts/{docId}",
    region: "us-east1",
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    ensureMailer();

    const interests = (data.interests || [])
      .map((id) => interestLabels[id] || id)
      .join(", ");

    const bodyHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
        <tr>
          <td style="padding:6px 14px 6px 0;font-weight:600;color:#9ca3af;width:110px;vertical-align:top;">Name</td>
          <td style="padding:6px 0;color:#f3f4f6;">${escapeHtml(data.name || "")}</td>
        </tr>
        <tr>
          <td style="padding:6px 14px 6px 0;font-weight:600;color:#9ca3af;vertical-align:top;">Email</td>
          <td style="padding:6px 0;"><a href="mailto:${escapeHtml(data.email || "")}" style="color:#10b981;text-decoration:none;">${escapeHtml(data.email || "")}</a></td>
        </tr>
        <tr>
          <td style="padding:6px 14px 6px 0;font-weight:600;color:#9ca3af;vertical-align:top;">Interested in</td>
          <td style="padding:6px 0;color:#f3f4f6;">${escapeHtml(interests || "—")}</td>
        </tr>
      </table>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #1f2937;">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#6b7280;text-transform:uppercase;margin-bottom:8px;">Message</div>
        <div style="white-space:pre-wrap;color:#e5e7eb;line-height:1.6;">${escapeHtml(data.message || "")}</div>
      </div>
      <div style="margin-top:20px;">
        <a href="mailto:${escapeHtml(data.email || "")}" style="display:inline-block;padding:10px 16px;background:#059669;color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:500;">Reply to ${escapeHtml(data.name || data.email || "sender")}</a>
      </div>
    `;

    const text = [
      `New contact from ${data.name} <${data.email}>`,
      `Interested in: ${interests}`,
      ``,
      `Message:`,
      data.message || "",
    ].join("\n");

    const adminResult = await sendEmail({
      to: "contact@plantagoai.com",
      replyTo: data.email,
      subject: `New Contact: ${data.name} — ${interests}`,
      html: layout({
        headerTitle: "New Contact Submission",
        headerSubtitle: `from ${data.name}`,
        bodyHtml,
      }),
      text,
      tags: [{ name: "type", value: "contact-admin" }],
    });

    if (!adminResult.success) {
      console.error(`Contact admin email failed for ${data.email}: ${adminResult.error}`);
    } else {
      console.log(`Contact admin email sent for ${data.name} (${data.email}) — id=${adminResult.id}`);
    }

    // Confirmation to the sender
    if (data.email) {
      const userBody = `
        <p style="margin:0 0 14px;color:#e5e7eb;font-size:15px;">Hi ${escapeHtml((data.name || "").split(" ")[0] || "there")},</p>
        <p style="margin:0 0 14px;color:#e5e7eb;">Thanks for reaching out about PlantagoAI — we received your message and will get back to you soon.</p>
        <div style="margin:18px 0;padding:14px 16px;background:#0b0f14;border:1px solid #1f2937;border-radius:8px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#6b7280;text-transform:uppercase;margin-bottom:6px;">Your message</div>
          <div style="white-space:pre-wrap;color:#d1d5db;line-height:1.55;font-size:14px;">${escapeHtml(data.message || "")}</div>
          ${interests ? `<div style="margin-top:10px;font-size:12px;color:#9ca3af;">Interested in: <span style="color:#10b981;">${escapeHtml(interests)}</span></div>` : ""}
        </div>
        <p style="margin:14px 0 0;color:#9ca3af;font-size:13px;">— Dagan Gilat<br>PlantagoAI</p>
      `;
      const userText = [
        `Hi ${(data.name || "").split(" ")[0] || "there"},`,
        ``,
        `Thanks for reaching out about PlantagoAI — we received your message and will get back to you soon.`,
        ``,
        `Your message:`,
        data.message || "",
        ``,
        interests ? `Interested in: ${interests}` : "",
        ``,
        `— Dagan Gilat, PlantagoAI`,
      ].filter(Boolean).join("\n");

      const userResult = await sendEmail({
        to: data.email,
        replyTo: "info@plantagoai.com",
        subject: "Thanks for reaching out — PlantagoAI",
        html: layout({
          headerTitle: "We got your message",
          headerSubtitle: "Thanks for getting in touch",
          bodyHtml: userBody,
        }),
        text: userText,
        tags: [{ name: "type", value: "contact-user" }],
      });

      if (!userResult.success) {
        console.error(`Contact user email failed for ${data.email}: ${userResult.error}`);
      } else {
        console.log(`Contact user email sent to ${data.email} — id=${userResult.id}`);
      }
    }
  }
);

export const onSubscriberCreated = onDocumentCreated(
  {
    document: "subscribers/{docId}",
    region: "us-east1",
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    ensureMailer();

    const bodyHtml = `
      <p style="margin:0 0 12px;color:#e5e7eb;">A new visitor subscribed to the PlantagoAI newsletter.</p>
      <div style="padding:14px 16px;background:#0b0f14;border:1px solid #1f2937;border-radius:8px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Email</div>
        <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#10b981;font-size:15px;word-break:break-all;">${escapeHtml(data.email || "")}</div>
      </div>
      <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">Add them to your newsletter list or reach out directly when you have something to share.</p>
    `;

    const adminResult = await sendEmail({
      to: "info@plantagoai.com",
      subject: `New Subscriber: ${data.email}`,
      html: layout({
        headerTitle: "New Newsletter Subscriber",
        headerSubtitle: null,
        bodyHtml,
      }),
      text: `New newsletter subscriber: ${data.email}`,
      tags: [{ name: "type", value: "subscriber-admin" }],
    });

    if (!adminResult.success) {
      console.error(`Subscriber admin email failed for ${data.email}: ${adminResult.error}`);
    } else {
      console.log(`Subscriber admin email sent for ${data.email} — id=${adminResult.id}`);
    }

    // Welcome to the subscriber
    if (data.email && data.unsubscribeToken) {
      const unsubscribeUrl = buildUnsubscribeUrl(
        UNSUBSCRIBE_BASE_URL,
        data.email,
        data.unsubscribeToken,
      );

      const welcomeBody = `
        <p style="margin:0 0 14px;color:#e5e7eb;font-size:15px;">Welcome to the PlantagoAI newsletter.</p>
        <p style="margin:0 0 14px;color:#d1d5db;">You'll hear from us when we ship something interesting across our product lineup — Nomadex, Foundation, HerbPulse, MarketHub, and SOHO. Low volume, high signal.</p>
        <div style="margin:18px 0;padding:14px 16px;background:#0b0f14;border:1px solid #1f2937;border-radius:8px;">
          <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">What we're building right now:</p>
          <ul style="margin:0;padding-left:18px;color:#d1d5db;font-size:13px;line-height:1.8;">
            <li>Five AI-powered products on a shared TypeScript platform</li>
            <li>Twelve internal packages handling auth, payments, AI, i18n, compliance</li>
            <li>Nomadex is live on the App Store; others launching through 2026</li>
          </ul>
        </div>
        <p style="margin:14px 0 0;color:#9ca3af;font-size:13px;">— Dagan Gilat<br>PlantagoAI</p>
        ${renderUnsubscribeFooter(unsubscribeUrl)}
      `;
      const welcomeText = [
        `Welcome to the PlantagoAI newsletter.`,
        ``,
        `You'll hear from us when we ship something interesting across our product lineup — Nomadex, Foundation, HerbPulse, MarketHub, and SOHO. Low volume, high signal.`,
        ``,
        `What we're building right now:`,
        `  • Five AI-powered products on a shared TypeScript platform`,
        `  • Twelve internal packages handling auth, payments, AI, i18n, compliance`,
        `  • Nomadex is live on the App Store; others launching through 2026`,
        ``,
        `— Dagan Gilat, PlantagoAI`,
        ``,
        `---`,
        `To unsubscribe: ${unsubscribeUrl}`,
      ].join("\n");

      const welcomeResult = await sendEmail({
        to: data.email,
        replyTo: "info@plantagoai.com",
        subject: "Welcome to PlantagoAI",
        html: layout({
          headerTitle: "Welcome aboard",
          headerSubtitle: "You're subscribed to the PlantagoAI newsletter",
          bodyHtml: welcomeBody,
        }),
        text: welcomeText,
        tags: [{ name: "type", value: "subscriber-welcome" }],
      });

      if (!welcomeResult.success) {
        console.error(`Subscriber welcome email failed for ${data.email}: ${welcomeResult.error}`);
      } else {
        console.log(`Subscriber welcome email sent to ${data.email} — id=${welcomeResult.id}`);
      }
    }
  }
);

function unsubscribePage({ title, heading, message, accent }) {
  const accentColor = accent === "error" ? "#ef4444" : "#10b981";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#0b0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#e5e7eb;">
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 16px;">
    <div style="max-width:440px;width:100%;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:32px;text-align:center;">
      <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:${accentColor};text-transform:uppercase;margin-bottom:12px;">PlantagoAI</div>
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#ffffff;">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 20px;color:#9ca3af;font-size:14px;line-height:1.6;">${message}</p>
      <a href="https://plantagoai.com" style="display:inline-block;padding:10px 18px;background:${accentColor};color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:500;">Back to plantagoai.com</a>
    </div>
  </div>
</body>
</html>`;
}

export const unsubscribe = onRequest(
  { region: "us-east1", cors: true },
  async (req, res) => {
    const email = String(req.query.email || "").trim().toLowerCase();
    const token = String(req.query.token || "").trim();

    if (!email || !token) {
      res.status(400).send(
        unsubscribePage({
          title: "Invalid unsubscribe link",
          heading: "Invalid link",
          message: "This unsubscribe link is missing required information. Reply to any PlantagoAI email and we'll remove you manually.",
          accent: "error",
        })
      );
      return;
    }

    const db = getFirestore();
    const snap = await db
      .collection("subscribers")
      .where("email", "==", email)
      .limit(5)
      .get();

    const match = snap.docs.find((d) => d.get("unsubscribeToken") === token);

    if (!match) {
      res.status(404).send(
        unsubscribePage({
          title: "Unsubscribe link not found",
          heading: "Link not found",
          message: "We couldn't find a matching subscription. You may have already been unsubscribed.",
          accent: "error",
        })
      );
      return;
    }

    try {
      await match.ref.delete();
      console.log(`Unsubscribed ${email} — doc=${match.id}`);
      res.status(200).send(
        unsubscribePage({
          title: "You've been unsubscribed",
          heading: "You've been unsubscribed",
          message: `We've removed <strong style="color:#e5e7eb;">${escapeHtml(email)}</strong> from the PlantagoAI newsletter. You won't receive further emails from us.`,
          accent: "ok",
        })
      );
    } catch (err) {
      console.error(`Unsubscribe delete failed for ${email}:`, err);
      res.status(500).send(
        unsubscribePage({
          title: "Something went wrong",
          heading: "Something went wrong",
          message: "We couldn't process your unsubscribe right now. Try again in a few minutes, or reply to any PlantagoAI email and we'll handle it manually.",
          accent: "error",
        })
      );
    }
  }
);
