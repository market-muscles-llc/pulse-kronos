import { WebhookTriggerEvents } from "@prisma/client";
import { Webhook } from "@prisma/client";

export type GetSubscriberOptions = {
  userId: number;
  eventTypeId: number;
  triggerEvent: WebhookTriggerEvents;
};

const getWebhooks = async (options: GetSubscriberOptions) => {
  const { userId, eventTypeId } = options;
  return new Promise<Webhook[]>((resolve) => {
    const controlWebhooks: Webhook[] = [
      {
        id: "control",
        subscriberUrl: process.env.CONTROL_WEBHOOK_ENDPOINT,
        payloadTemplate: null,
        appId: null,
        secret: null,
        userId: userId,
        eventTypeId: eventTypeId,
        active: true,
        eventTriggers: [
          WebhookTriggerEvents.BOOKING_CANCELLED,
          WebhookTriggerEvents.BOOKING_CREATED,
          WebhookTriggerEvents.BOOKING_RESCHEDULED,
        ],
        createdAt: new Date(),
      },
    ];
    resolve(controlWebhooks);
  });
};

export default getWebhooks;
