import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
      const { command } = await req.json();

          if (!command) {
                return NextResponse.json(
                        { error: "Chybí příkaz v požadavku." },
                                { status: 400 }
                                      );
                                          }

                                              console.log("Přijatý hlasový příkaz:", command);

                                                  return NextResponse.json({
                                                        success: true,
                                                              message: `Příkaz "${command}" byl úspěšně přijat.`,
                                                                  });
                                                                    } catch (error) {
                                                                        console.error("Chyba při zpracování příkazu:", error);
                                                                            return NextResponse.json(
                                                                                  { error: "Interní chyba serveru." },
                                                                                        { status: 500 }
                                                                                            );
                                                                                              }
                                                                                              }
                                                                                              