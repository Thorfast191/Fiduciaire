import { describe, it, expect } from "vitest";
import { getUploadUrl, getDownloadUrl, objectExists } from "../../../src/lib/storage/client";

describe("storage client (round-trip against the local MinIO container)", () => {
  it("uploads via a signed PUT URL, confirms existence, and downloads the same bytes", async () => {
    const key = `test/${Date.now()}-${Math.random()}.txt`;
    const body = "hello fiduvia";

    const uploadUrl = await getUploadUrl(key, "text/plain");
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "content-type": "text/plain" },
      body,
    });
    expect(putRes.ok).toBe(true);

    expect(await objectExists(key)).toBe(true);
    expect(await objectExists(`${key}-does-not-exist`)).toBe(false);

    const downloadUrl = await getDownloadUrl(key, "hello.txt");
    const getRes = await fetch(downloadUrl);
    expect(getRes.ok).toBe(true);
    expect(await getRes.text()).toBe(body);
  });
});
