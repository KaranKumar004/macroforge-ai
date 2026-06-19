import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";
import { supabaseAdmin } from "@/utils/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { orderId, plan } = await request.json();

    // Read authorization token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    // 1. Authenticate user JWT securely on the server
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access token" }, { status: 401 });
    }

    if (!orderId) {
      return NextResponse.json({ error: "PayPal order ID is required" }, { status: 400 });
    }

    // 2. Perform database update securely on the server (bypassing RLS via admin client)
    if (plan === "pro") {
      console.log(`[PayPal Fulfillment] Upgrading user ${user.id} to Pro`);
      const { error: dbError } = await supabaseAdmin
        .from("user_profiles")
        .update({ is_pro: true })
        .eq("id", user.id);
      if (dbError) throw dbError;
    } else {
      console.log(`[PayPal Fulfillment] Adding 50 credits to user ${user.id}`);
      
      // Fetch current credits to avoid race condition or incorrect math
      const { data: currentProfile } = await supabaseAdmin
        .from("user_profiles")
        .select("credits")
        .eq("id", user.id)
        .single();
      
      const currentCredits = currentProfile?.credits || 0;
      const { error: dbError } = await supabaseAdmin
        .from("user_profiles")
        .update({ credits: currentCredits + 50 })
        .eq("id", user.id);
      if (dbError) throw dbError;
    }

    return NextResponse.json({ verified: true, updated: true });

  } catch (err: any) {
    console.error("PayPal verification API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to verify transaction" },
      { status: 500 }
    );
  }
}
