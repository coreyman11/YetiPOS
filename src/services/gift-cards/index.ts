
import { giftCardQueries } from './queries';
import { giftCardMutations } from './mutations';

export const giftCardsApi = {
  ...giftCardQueries,
  ...giftCardMutations,
};

export type { GiftCard, GiftCardTransaction, CreateGiftCardParams, SplitPayment } from './types';
