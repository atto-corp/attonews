import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../utils/auth';
import { AdEntry } from '../../../models/types';

export const GET = withAuth(async (
  request: NextRequest,
  user,
  dataStorage,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: adId } = await context.params;

  const ad = await dataStorage.getAd(user.id, adId);
  if (!ad) {
    return NextResponse.json(
      { error: 'Ad not found' },
      { status: 404 }
    );
  }
  return NextResponse.json(ad);
});

export const PUT = withAuth(async (
  request: NextRequest,
  user,
  dataStorage,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: adId } = await context.params;
  const body = await request.json();
  const { name, bidPrice, promptContent } = body;

  // Check if ad exists
  const existingAd = await dataStorage.getAd(user.id, adId);
  if (!existingAd) {
    return NextResponse.json(
      { error: 'Ad not found' },
      { status: 404 }
    );
  }

  // Update the ad
  const updates: Partial<Omit<AdEntry, 'id'>> = {};
  if (name !== undefined) updates.name = name;
  if (bidPrice !== undefined) updates.bidPrice = parseFloat(bidPrice);
  if (promptContent !== undefined) updates.promptContent = promptContent;

  await dataStorage.updateAd(user.id, adId, updates);

  // Get the updated ad
  const updatedAd = await dataStorage.getAd(user.id, adId);
  return NextResponse.json(updatedAd);
});

export const DELETE = withAuth(async (
  request: NextRequest,
  user,
  dataStorage,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: adId } = await context.params;

  // Check if ad exists
  const existingAd = await dataStorage.getAd(user.id, adId);
  if (!existingAd) {
    return NextResponse.json(
      { error: 'Ad not found' },
      { status: 404 }
    );
  }

  await dataStorage.deleteAd(user.id, adId);
  return NextResponse.json({ message: 'Ad deleted successfully' });
});
