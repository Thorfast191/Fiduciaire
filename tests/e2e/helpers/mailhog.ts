export async function getLatestOtpForEmail(email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(
      `http://localhost:8025/api/v2/search?kind=to&query=${encodeURIComponent(email)}`,
    );
    const data = await res.json();
    if (data.items?.length > 0) {
      const latest = data.items[0];
      const body: string = latest.Content.Body;
      const match = body.match(/\b(\d{6})\b/);
      if (match) return match[1];
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No OTP email found for ${email}`);
}
