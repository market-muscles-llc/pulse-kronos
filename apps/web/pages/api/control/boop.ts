import { NextApiRequest, NextApiResponse } from "next";

import { WEBHOOK_TRIGGER_EVENTS } from "@lib/webhooks/constants";
import sendPayload from "@lib/webhooks/sendPayload";

import { getTranslation } from "@server/lib/i18n";

/**
 *
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Invalid method" });
    return;
  }

  const bearerToken = req.headers.authorization;
  if ("Bearer " + process.env.CONTROL_API_KEY !== bearerToken) {
    res.status(401).json({ message: "Not authenticated: " + bearerToken });
    return;
  }

  const url = process.env.CONTROL_WEBHOOK_ENDPOINT;
  const type = "BOOKING_CREATED";
  const payloadTemplate = null;
  const translation = await getTranslation("en", "common");
  const language = {
    locale: "en",
    translate: translation,
  };

  const data = {
    type: "Test",
    title: "Test trigger event",
    description: "",
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    attendees: [
      {
        email: "jdoe@example.com",
        name: "John Doe",
        timeZone: "Europe/London",
        language,
      },
    ],
    organizer: {
      name: "Cal",
      email: "no-reply@cal.com",
      timeZone: "Europe/London",
      language,
    },
  };

  const webhook = { subscriberUrl: url, payloadTemplate, appId: null, secret: null };
  const results = await sendPayload(null, type, new Date().toISOString(), webhook, data);

  res.status(200).json({ results: results });
}
