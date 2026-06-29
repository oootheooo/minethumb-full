import { env } from '$env/dynamic/public';

export type PlanId = 'free' | 'pro' | 'creator';

export type Plan = {
  id: PlanId;
  name: string;
  priceUsd: number;
  generations: number;
  features: string[];
  highlighted?: boolean;
};

const freeGenerations = Number(env.PUBLIC_FREE_PLAN_GENERATIONS || 2);
const proGenerations = Number(env.PUBLIC_PRO_PLAN_GENERATIONS || 30);
const creatorGenerations = Number(env.PUBLIC_CREATOR_PLAN_GENERATIONS || 60);
const proPriceUsd = Number(env.PUBLIC_PRO_PRICE_USD || 13.99);
const creatorPriceUsd = Number(env.PUBLIC_CREATOR_PRICE_USD || 20.99);

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceUsd: 0,
    generations: freeGenerations,
    features: [
      `${freeGenerations} thumbnails per month`,
      'Standard queue',
      'Saved history'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    priceUsd: proPriceUsd,
    generations: proGenerations,
    highlighted: true,
    features: [
      `${proGenerations} thumbnails per month`,
      'High quality renders',
      'Skin uploads',
      'Saved history'
    ]
  },
  {
    id: 'creator',
    name: 'Creator',
    priceUsd: creatorPriceUsd,
    generations: creatorGenerations,
    features: [
      `${creatorGenerations} thumbnails per month`,
      'Priority generation',
      'Face and screenshot references',
      'All Pro features'
    ]
  }
];
