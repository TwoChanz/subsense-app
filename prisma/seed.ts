import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const CURATED_VENDORS = [
  {
    name: "Netflix",
    domain: "netflix.com",
    billingUrl: "https://www.netflix.com/account",
    cancelHelpUrl: "https://help.netflix.com/en/node/407",
  },
  {
    name: "Spotify",
    domain: "spotify.com",
    billingUrl: "https://www.spotify.com/account/subscription",
    cancelHelpUrl: "https://support.spotify.com/article/how-to-cancel/",
  },
  {
    name: "Adobe Creative Cloud",
    domain: "adobe.com",
    billingUrl: "https://account.adobe.com/plans",
    cancelHelpUrl: "https://helpx.adobe.com/manage-account/using/cancel-subscription.html",
  },
  {
    name: "Amazon Prime",
    domain: "amazon.com",
    billingUrl: "https://www.amazon.com/gp/primecentral",
    cancelHelpUrl: "https://www.amazon.com/gp/help/customer/display.html?nodeId=G6LDPN7YJHYKH2J6",
  },
  {
    name: "Hulu",
    domain: "hulu.com",
    billingUrl: "https://secure.hulu.com/account",
    cancelHelpUrl: "https://help.hulu.com/articles/2834981",
  },
  {
    name: "Disney+",
    domain: "disneyplus.com",
    billingUrl: "https://www.disneyplus.com/account",
    cancelHelpUrl: "https://help.disneyplus.com/article/disneyplus-cancel-subscription",
  },
  {
    name: "GitHub",
    domain: "github.com",
    billingUrl: "https://github.com/settings/billing",
    cancelHelpUrl: "https://docs.github.com/billing/managing-billing-for-your-github-account",
  },
  {
    name: "Notion",
    domain: "notion.so",
    billingUrl: "https://www.notion.so/my-account",
    cancelHelpUrl: "https://www.notion.so/help/billing-and-invoices",
  },
  {
    name: "Figma",
    domain: "figma.com",
    billingUrl: "https://www.figma.com/settings",
    cancelHelpUrl: "https://help.figma.com/hc/en-us/articles/360039825034",
  },
  {
    name: "Slack",
    domain: "slack.com",
    billingUrl: "https://slack.com/account/settings",
    cancelHelpUrl: "https://slack.com/help/articles/218915077",
  },
  {
    name: "Zoom",
    domain: "zoom.us",
    billingUrl: "https://zoom.us/account/billing",
    cancelHelpUrl: "https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0063177",
  },
  {
    name: "Dropbox",
    domain: "dropbox.com",
    billingUrl: "https://www.dropbox.com/account/plan",
    cancelHelpUrl: "https://help.dropbox.com/account-security/cancel-downgrade-subscription",
  },
  {
    name: "Microsoft 365",
    domain: "microsoft.com",
    billingUrl: "https://account.microsoft.com/services",
    cancelHelpUrl: "https://support.microsoft.com/account-billing/how-to-cancel-your-microsoft-subscription-c2c6b0e3-cab3-4e68-8c9f-1e6b1f6ab0b9",
  },
  {
    name: "Google One",
    domain: "one.google.com",
    billingUrl: "https://one.google.com/settings",
    cancelHelpUrl: "https://support.google.com/googleone/answer/9004018",
  },
  {
    name: "OpenAI / ChatGPT",
    domain: "openai.com",
    billingUrl: "https://platform.openai.com/account/billing",
    cancelHelpUrl: "https://help.openai.com/en/articles/4936830",
  },
  {
    name: "YouTube Premium",
    domain: "youtube.com",
    billingUrl: "https://www.youtube.com/paid_memberships",
    cancelHelpUrl: "https://support.google.com/youtube/answer/6308278",
  },
  {
    name: "Apple One / iCloud",
    domain: "apple.com",
    billingUrl: "https://support.apple.com/subscriptions",
    cancelHelpUrl: "https://support.apple.com/en-us/HT202039",
  },
  {
    name: "LinkedIn Premium",
    domain: "linkedin.com",
    billingUrl: "https://www.linkedin.com/mypreferences/d/manage-subscription",
    cancelHelpUrl: "https://www.linkedin.com/help/linkedin/answer/a545584",
  },
  {
    name: "Canva",
    domain: "canva.com",
    billingUrl: "https://www.canva.com/settings/billing",
    cancelHelpUrl: "https://www.canva.com/help/billing-payment/",
  },
  {
    name: "Grammarly",
    domain: "grammarly.com",
    billingUrl: "https://account.grammarly.com/subscription",
    cancelHelpUrl: "https://support.grammarly.com/hc/en-us/articles/115000090231",
  },
]

async function main() {
  console.log("Seeding vendors...")

  for (const vendor of CURATED_VENDORS) {
    const existing = await prisma.vendor.findUnique({
      where: { domain: vendor.domain },
    })

    if (existing) {
      console.log(`Vendor ${vendor.name} already exists, updating...`)
      await prisma.vendor.update({
        where: { domain: vendor.domain },
        data: {
          name: vendor.name,
          billingUrl: vendor.billingUrl,
          cancelHelpUrl: vendor.cancelHelpUrl,
          source: "curated",
          confidence: "high",
          lastVerifiedAt: new Date(),
        },
      })
    } else {
      console.log(`Creating vendor ${vendor.name}...`)
      await prisma.vendor.create({
        data: {
          name: vendor.name,
          domain: vendor.domain,
          billingUrl: vendor.billingUrl,
          cancelHelpUrl: vendor.cancelHelpUrl,
          source: "curated",
          confidence: "high",
          lastVerifiedAt: new Date(),
        },
      })
    }
  }

  console.log(`Seeded ${CURATED_VENDORS.length} vendors`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
