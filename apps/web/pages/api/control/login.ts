import * as crypto from "crypto";
import { NextApiRequest, NextApiResponse } from "next";

import { WEBSITE_URL } from "@calcom/lib/constants";

import { asNumberOrThrow } from "@lib/asStringOrNull";
import prisma from "@lib/prisma";

/**
 * Hacked version of hashToken from Next-Auth
 * Original is from next-auth/core/lib/utils.d.ts
 * but is not exposed as a module
 */
function hashToken(token: string) {
  return crypto.createHash("sha256").update(`${token}${process.env.NEXTAUTH_SECRET}`).digest("hex");
}

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
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const data = req.body;
  const { id } = data;

  if (!id) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: asNumberOrThrow(id),
    },
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const callbackUrl = `${WEBSITE_URL}/event-types`;
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date();
  // Magic links are valid for this period
  expires.setMinutes(expires.getMinutes() + 10);

  // Store hashed token in database
  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token: hashToken(token),
      expires: expires,
    },
  });

  // Build callback params
  const params = new URLSearchParams({
    callbackUrl,
    token: token,
    email: user.email,
  });

  // Build callback URL
  const magicLink = `${WEBSITE_URL}/api/auth/callback/email?${params}`;

  res.status(201).json({ link: magicLink });
};

export default handler;
