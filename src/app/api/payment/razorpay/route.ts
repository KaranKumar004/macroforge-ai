import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { amount, plan } = await request.json();

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.includes("placeholder")) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured. Update them in .env.local" },
        { status: 500 }
      );
    }

    // Convert to paise (e.g., $9.99/Rs 9.99 is 999 paise)
    const amountInPaise = Math.round(amount * 100);

    // Build base64 credentials for Basic Auth
    const authString = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${plan}_${Date.now()}`,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.description || "Razorpay API error");
    }

    return NextResponse.json({
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
    });
  } catch (err: any) {
    console.error("Razorpay order API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
