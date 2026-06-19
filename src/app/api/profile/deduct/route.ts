import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";
import { supabaseAdmin } from "@/utils/supabaseAdmin";

export async function POST(request: Request) {
  try {
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

    // 2. Fetch user profile
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("user_profiles")
      .select("credits, is_pro")
      .eq("id", user.id)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    if (profile.is_pro) {
      return NextResponse.json({ credits: profile.credits, isPro: true, message: "Pro users have unlimited runs" });
    }

    if (profile.credits <= 0) {
      return NextResponse.json({ error: "Out of credits. Please purchase a credits pack or upgrade to Pro." }, { status: 403 });
    }

    // 3. Deduct credit securely
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update({ credits: Math.max(0, profile.credits - 1) })
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message || "Failed to deduct credit");
    }

    return NextResponse.json({
      credits: updatedProfile.credits,
      isPro: updatedProfile.is_pro,
      message: "Credit deducted successfully."
    });

  } catch (err: any) {
    console.error("Deduct credit API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
