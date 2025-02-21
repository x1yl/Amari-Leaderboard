import { NextResponse } from "next/server";

interface AmariUser {
  id: string;
  username: string;
  level: number;
  exp: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get("guildId");

  if (!guildId) {
    return NextResponse.json(
      { error: "Guild ID is required" },
      { status: 400 }
    );
  }

  try {
    // Use Discord Widget API instead of Bot API
    const guildResponse = await fetch(
      `https://discord.com/api/guilds/${guildId}/widget.json`
    );
    let guildInfo = {
      name: `Placeholder (server has widgets disabled)`, // widget not enabled
      iconUrl: "",
    };

    if (guildResponse.ok) {
      const widgetData = await guildResponse.json();
      guildInfo = {
        name: widgetData.name,
        iconUrl: "",
      };
    }

    // Fetch leaderboard data
    const leaderboardResponse = await fetch(
      `https://amaribot.com/api/v1/guild/raw/leaderboard/${guildId}?=`,
      {
        headers: {
          Authorization: process.env.AMARI_API_KEY || "",
        },
      }
    );

    if (!leaderboardResponse.ok) {
      throw new Error("Failed to fetch leaderboard data");
    }

    const result = await leaderboardResponse.json();
    const userData = result.data.map((user: AmariUser) => ({
      id: user.id,
      username: user.username,
      level: user.level,
      exp: user.exp,
      avatar: `https://xsgames.co/randomusers/avatar.php?g=pixel&uid=${user.id}`,
    }));

    return NextResponse.json({
      guild: guildInfo,
      users: userData,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
