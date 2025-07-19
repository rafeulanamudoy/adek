import Stripe from "stripe";
import config from "../config";
import catchAsync from "../shared/catchAsync";
import sendResponse from "../shared/sendResponse";


const stripe = new Stripe(config.stripe.secretKey as string);

const handleWebHook = catchAsync(async (req: any, res: any) => {
  const sig = req.headers["stripe-signature"] as string;
  if (!sig) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Missing Stripe signature header.",
      data: null,
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret as string
    );
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return res.status(400).send("Webhook Error: Invalid signature.");
  }

  switch (event.type) {
    // Account Events
    case "account.updated":
      const account = event.data.object;
      if (
        account.charges_enabled &&
        account.details_submitted &&
        account.payouts_enabled
      ) {
        console.log(
          "Onboarding completed successfully for account:",
          account.id
        );
       
      } else {
        console.log("Onboarding incomplete for account:", account.id);
      }
      break;
    case "account.application.authorized":
      break;
    case "account.external_account.created":
      break;

    // One-Time Payments
    case "checkout.session.completed":
      break;

    case "payment_intent.succeeded":
      break;
    case "payment_intent.created":
      break;

    case "charge.succeeded":
      break;

    case "transfer.created":
      break;

    //  Refunds
    case "charge.refunded":
    case "charge.refund.updated":
      console.log("Charge refunded:", event.data.object);
      break;

    // Other Events
    case "capability.updated":
      break;
    case "financial_connections.account.created":
      break;
    case "customer.created":
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).send("Event received");
});

export default handleWebHook;
