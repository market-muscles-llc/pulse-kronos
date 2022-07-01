import { IdentityProvider } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

import { asNumberOrThrow } from "@lib/asStringOrNull";
import { hashPassword } from "@lib/auth";
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
  const { id, email, username, password, fqdn } = data;
  let { name, timezone } = data;

  if (!email || email.trim().length < 3) {
    res.status(422).json({ message: "Invalid email" });
    return;
  }

  if (!password || password.trim().length < 7) {
    res.status(422).json({ message: "Invalid input" });
    return;
  }

  if (!timezone) {
    timezone = "America/New York";
  }

  if (!name) {
    name = username;
  }

  const hashedPassword = await hashPassword(password);

  if (id) {
    const user = await prisma.user.upsert({
      where: { id: asNumberOrThrow(id) },
      update: {
        email: email,
        password: hashedPassword,
        timeZone: timezone,
        metadata: {
          fqdn: fqdn,
        },
      },
      create: {
        name,
        username,
        email: email,
        password: hashedPassword,
        timeZone: timezone,
        emailVerified: new Date(Date.now()),
        identityProvider: IdentityProvider.CAL,
        plan: "PRO",
        theme: "light",
        metadata: {
          fqdn: fqdn,
        },
      },
    });

    res.status(201).json({ message: "Upserted user", user: user });
  } else {
    const user = await prisma.user.upsert({
      where: { email: email },
      update: {
        email: email,
        password: hashedPassword,
        timeZone: timezone,
        metadata: {
          fqdn: fqdn,
        },
      },
      create: {
        name,
        username,
        email: email,
        password: hashedPassword,
        timeZone: timezone,
        emailVerified: new Date(Date.now()),
        identityProvider: IdentityProvider.CAL,
        plan: "PRO",
        theme: "light",
        metadata: {
          fqdn: fqdn,
        },
      },
    });

    res.status(201).json({ message: "Created user", user: user });
  }
}
