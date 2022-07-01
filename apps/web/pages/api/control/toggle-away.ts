import { withSentry } from "@sentry/nextjs";
import { NextApiRequest, NextApiResponse } from "next";

import { asNumberOrThrow } from "@lib/asStringOrNull";
import prisma from "@lib/prisma";

/**
 *
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Invalid method" });
    return;
  }

  const bearerToken = req.headers.authorization;
  if ("Bearer " + process.env.CONTROL_API_KEY !== bearerToken) {
    res.status(401).json({ message: "Not authenticated: " + bearerToken });
    return;
  }

  const data = req.body;
  const { id } = data;

  if (!id) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }

  const user = await prisma.user.findUnique({
    rejectOnNotFound: true,
    where: {
      id: asNumberOrThrow(id),
    },
    select: {
      id: true,
      away: true,
    },
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  await prisma.user.update({
    where: {
      id: user?.id,
    },
    data: {
      away: !user?.away,
    },
  });

  res.status(200).json({ message: "Set Status", away: !user.away });
};

export default withSentry(handler);
