import { DefaultSeoProps } from "next-seo";

import { SEO_IMG_DEFAULT, SEO_IMG_OGIMG } from "@calcom/lib/constants";

import { HeadSeoProps } from "@components/seo/head-seo";

const seoImages = {
  default: SEO_IMG_DEFAULT,
  ogImage: SEO_IMG_OGIMG,
};

export const getSeoImage = (key: keyof typeof seoImages): string => {
  return seoImages[key];
};

export const seoConfig: {
  headSeo: Required<Pick<HeadSeoProps, "siteName">>;
  defaultNextSeo: DefaultSeoProps;
} = {
  headSeo: {
    siteName: "PulseAppt.com",
  },
  defaultNextSeo: {
    robotsProps: {
      nosnippet: true,
      notranslate: true,
      noimageindex: true,
      noarchive: true,
      maxSnippet: -1,
      maxImagePreview: "none",
      maxVideoPreview: -1,
    },
  },
} as const;
