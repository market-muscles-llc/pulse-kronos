import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // No API user management
  res.status(410).json({ message: "Nope" });
  return;
}
