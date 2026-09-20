import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { command } = body;

    console.log("Přijatý hlasový příkaz:", command);

    return NextResponse.json({
      success: true,
      message: `Příkaz "${command}" byl úspěšně přijat.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Chyba při zpracování příkazu" },
      { status: 500 }
    );
  }
}
