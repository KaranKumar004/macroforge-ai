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
    
    // Authenticate the user token securely on the server
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access token" }, { status: 401 });
    }

    // Check if profile already exists using admin client (bypasses RLS select policy)
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from("user_profiles")
      .select("credits, is_pro")
      .eq("id", user.id)
      .single();

    if (!fetchError && existingProfile) {
      return NextResponse.json({ 
        credits: existingProfile.credits, 
        isPro: existingProfile.is_pro,
        message: "Profile already exists."
      });
    }

    // Profile does not exist, initialize a new profile row securely via admin client
    console.log(`[Profile Init] Initializing profile row for user: ${user.id} (${user.email})`);
    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        id: user.id,
        email: user.email || "",
        credits: 5,
        is_pro: false
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message || "Failed to insert profile row");
    }

    return NextResponse.json({
      credits: newProfile.credits,
      isPro: newProfile.is_pro,
      message: "Profile initialized successfully."
    });

  } catch (err: any) {
    console.error("Profile initialization error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
