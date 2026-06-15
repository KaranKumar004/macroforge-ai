import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret || keySecret.includes("placeholder")) {
      return NextResponse.json(
        { error: "Razorpay secret key is not configured. Update it in .env.local" },
        { status: 500 }
      );
    }

    // Razorpay signature formula: HMAC-SHA256(order_id + "|" + payment_id, secret_key)
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      return NextResponse.json({ verified: true });
    } else {
      return NextResponse.json(
        { error: "Signature verification failed. Invalid transaction signature." },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error("Razorpay verification API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to verify transaction" },
      { status: 500 }
    );
  }
}
