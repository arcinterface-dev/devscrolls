export const SITE = {
  title: 'DevScrolls',
  description: "Thoughts on software engineering, frontend architecture, and the builder's journey.",
  url: 'https://devscrolls.dev',
  author: 'Santhanakrishnan',
  adsense: {
    enabled: false, // Set to true when your AdSense account is approved and you are ready to show ads
    publisherId: 'ca-pub-XXXXXXXXXXXXXXXX', // Replace with your actual publisher ID
    articleBottomSlotId: 'YYYYYYYYYY', // Replace with your actual ad slot ID
  },
  analytics: {
    enabled: true, // Set to true when you want to enable traffic tracking
    provider: 'umami', 
    websiteId: 'eb1ff21d-0b63-4798-b96a-290df16dfc59', // Replace with your actual Umami website ID
  },
  newsletter: {
    enabled: true,
    provider: 'kit', // Kit (formerly ConvertKit)
    formActionUrl: 'https://app.kit.com/forms/9632861/subscriptions', // DevScrolls Kit form
  }
};
