declare module 'midtrans-client' {
  export class Snap {
    constructor(config: { isProduction: boolean; serverKey: string; clientKey: string });
    createTransaction(parameter: any): Promise<{ token: string; redirect_url: string }>;
  }
  export class CoreApi {
    constructor(config: { isProduction: boolean; serverKey: string; clientKey: string });
    transaction: {
      status(orderId: string): Promise<any>;
    };
  }
  const _default: { Snap: typeof Snap; CoreApi: typeof CoreApi };
  export default _default;
}
