import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@lib/prisma";

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

  const data = req.body;
  const { email } = data;

  if (!email || email.trim().length < 3) {
    res.status(422).json({ message: "Invalid email" });
    return;
  }

  const user = await prisma.user.findUnique({
    rejectOnNotFound: true,
    where: {
      email: email,
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
}
