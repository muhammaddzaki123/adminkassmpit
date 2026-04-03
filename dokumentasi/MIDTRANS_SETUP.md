# Midtrans Integration Setup

## Required Environment Variables

Set these variables in `.env`:

```env
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_DEFAULT_BANK=bca
PAYMENT_WEBHOOK_SECRET=
```

Notes:
- `MIDTRANS_SERVER_KEY` is required for API charge and webhook signature verification.
- `MIDTRANS_CLIENT_KEY` is prepared for future frontend Snap usage.
- `MIDTRANS_IS_PRODUCTION=true` will use production Midtrans API URL.
- `MIDTRANS_DEFAULT_BANK` is used for VA/transfer fallback (`bca`, `bni`, `bri`, etc).
- `PAYMENT_WEBHOOK_SECRET` is optional additional custom secret check (`x-webhook-secret`).

## Midtrans Dashboard Webhook URL

Set webhook notification URL in Midtrans Dashboard to:

```text
https://<your-domain>/api/payment/webhook
```

For local testing use tunnel (for example ngrok):

```text
https://<random>.ngrok-free.app/api/payment/webhook
```

## Supported Channel Mapping

Internal method to Midtrans channel mapping:
- `VIRTUAL_ACCOUNT` -> `bank_transfer`
- `TRANSFER_BANK` -> `bank_transfer`
- `EWALLET` -> `qris` (acquirer `gopay`)

## Webhook Verification

Backend verifies Midtrans signature using:

```text
sha512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
```

If signature is invalid, webhook request is rejected.
