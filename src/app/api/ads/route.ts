import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../utils/auth';
import { AdEntry } from '../../models/types';

export const GET = withAuth(async (_request: NextRequest, user, dataStorage) => {
  const ads = await dataStorage.getAllAds(user.id);
  return NextResponse.json(ads);
});

export const POST = withAuth(async (request: NextRequest, user, dataStorage) => {
  const body = await request.json();
  const { name, bidPrice, promptContent } = body;

  if (!name || bidPrice === undefined || !promptContent) {
    return NextResponse.json(
      { error: 'name, bidPrice, and promptContent are required' },
      { status: 400 }
    );
  }

  const adId = await dataStorage.generateId('ad');
  const ad: AdEntry = {
    id: adId,
    name,
    bidPrice: parseFloat(bidPrice),
    promptContent
  };

  await dataStorage.saveAd(user.id, ad);
  return NextResponse.json(ad, { status: 201 });
});
