import midtransClient from 'midtrans-client';
import crypto from 'crypto';
import { logger } from './logger';

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || '';
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

export const isMidtransConfigured = (): boolean => Boolean(SERVER_KEY && CLIENT_KEY);

let _snap: any = null;

function getSnap(): any {
  if (!_snap) {
    _snap = new midtransClient.Snap({
      isProduction: IS_PRODUCTION,
      serverKey: SERVER_KEY,
      clientKey: CLIENT_KEY,
    });
  }
  return _snap;
}

export interface CreateTransactionParams {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  itemName: string;
  itemId: string;
}

export async function createSnapTransaction(params: CreateTransactionParams) {
  if (!isMidtransConfigured()) {
    throw new Error('Midtrans is not configured');
  }
  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
    },
    item_details: [
      {
        id: params.itemId,
        name: params.itemName,
        price: params.amount,
        quantity: 1,
      },
    ],
    enabled_payments: ['credit_card', 'bca_va', 'bni_va', 'bri_va', 'qris', 'gopay', 'shopeepay'],
  };

  const transaction = await getSnap().createTransaction(parameter);
  logger.info({ orderId: params.orderId, amount: params.amount }, 'Midtrans transaction created');
  return transaction;
}

export function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  if (!SERVER_KEY) return false;
  const input = `${orderId}${statusCode}${grossAmount}${SERVER_KEY}`;
  const hash = crypto.createHash('sha512').update(input).digest('hex');
  return hash === signatureKey;
}

export async function getTransactionStatus(orderId: string) {
  if (!isMidtransConfigured()) {
    throw new Error('Midtrans is not configured');
  }
  const core = new midtransClient.CoreApi({
    isProduction: IS_PRODUCTION,
    serverKey: SERVER_KEY,
    clientKey: CLIENT_KEY,
  });
  return core.transaction.status(orderId);
}
