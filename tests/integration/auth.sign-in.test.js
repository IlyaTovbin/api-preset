import request from "supertest";
import { app } from "../../app.js";
import { createUserFactory } from "../factories/user.factory.js";

describe("POST /api/v1/auth/sign-in", () => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("Missing ADMIN_PASSWORD in environment");
  }

  it("returns 401 for invalid credentials", async () => {
    await createUserFactory({ email: "admin@gmail.com" });

    const response = await request(app)
      .post("/api/v1/auth/sign-in")
      .set("x-test-rate-limit-key", "signin-invalid")
      .send({
        email: "admin@gmail.com",
        password: "wrong-password",
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Invalid credentials" });
  });

  it("returns 200 with access token and refresh cookie for valid credentials", async () => {
    await createUserFactory({ email: "admin@gmail.com" });

    const response = await request(app)
      .post("/api/v1/auth/sign-in")
      .set("x-test-rate-limit-key", "signin-valid")
      .send({
        email: "admin@gmail.com",
        password: adminPassword,
      });

    expect(response.status).toBe(200);
    expect(typeof response.body.accessToken).toBe("string");
    expect(response.body.accessToken.length).toBeGreaterThan(10);

    const setCookie = response.headers["set-cookie"] || [];
    const refreshCookie = setCookie.find((value) => value.startsWith("refresh_token="));
    expect(refreshCookie).toBeTruthy();
  });

  it("returns 429 when rate limit is exceeded", async () => {
    await createUserFactory({ email: "admin@gmail.com" });

    const statuses = [];

    for (let i = 0; i < 11; i += 1) {
      const response = await request(app)
        .post("/api/v1/auth/sign-in")
        .set("x-test-rate-limit-key", "signin-rate-limit")
        .send({
          email: "admin@gmail.com",
          password: "wrong-password",
        });

      statuses.push(response.status);
    }

    expect(statuses).toContain(429);
    expect(statuses[10]).toBe(429);
  });
});
