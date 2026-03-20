import request from "supertest";
import { app } from "../../app.js";
import { createUserFactory } from "../factories/user.factory.js";

function getRefreshTokenFromSetCookie(setCookieHeader) {
  const cookies = setCookieHeader || [];
  const refreshCookie = cookies.find((value) => value.startsWith("refresh_token="));

  if (!refreshCookie) {
    return null;
  }

  return refreshCookie.split(";")[0].replace("refresh_token=", "");
}

describe("POST /api/v1/auth/refresh", () => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("Missing ADMIN_PASSWORD in environment");
  }

  it("rotates refresh token and rejects the old token", async () => {
    await createUserFactory({ email: "admin@gmail.com" });

    const signInResponse = await request(app)
      .post("/api/v1/auth/sign-in")
      .set("x-test-rate-limit-key", "refresh-signin")
      .send({
        email: "admin@gmail.com",
        password: adminPassword,
      });

    expect(signInResponse.status).toBe(200);
    const oldRefreshToken = getRefreshTokenFromSetCookie(signInResponse.headers["set-cookie"]);
    expect(oldRefreshToken).toBeTruthy();

    const refreshResponse = await request(app)
      .post("/api/v1/auth/refresh")
      .set("x-test-rate-limit-key", "refresh-rotate")
      .send({ refreshToken: oldRefreshToken });

    expect(refreshResponse.status).toBe(200);
    expect(typeof refreshResponse.body.accessToken).toBe("string");

    const newRefreshToken = getRefreshTokenFromSetCookie(refreshResponse.headers["set-cookie"]);
    expect(newRefreshToken).toBeTruthy();
    expect(newRefreshToken).not.toBe(oldRefreshToken);

    const secondRefreshWithOldTokenResponse = await request(app)
      .post("/api/v1/auth/refresh")
      .set("x-test-rate-limit-key", "refresh-old-token")
      .send({ refreshToken: oldRefreshToken });

    expect(secondRefreshWithOldTokenResponse.status).toBe(401);
    expect(secondRefreshWithOldTokenResponse.body).toEqual({
      message: "Invalid credentials",
    });
  });
});
