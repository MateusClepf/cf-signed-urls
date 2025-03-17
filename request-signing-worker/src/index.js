/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { Buffer } from "node:buffer";

const encoder = new TextEncoder();

// How long an HMAC token should be valid for, in seconds
const EXPIRY = 60;

export default {
  /**
   *
   * @param {Request} request
   * @param {{SIGNING_KEY: string}} env
   * @returns
   */
  async fetch(request, env) {
    // You will need some secret data to use as a symmetric key. This should be
    // attached to your Worker as an encrypted secret.
    // Refer to https://developers.cloudflare.com/workers/configuration/secrets/
    const secretKeyData = encoder.encode(
      env.SIGNING_KEY ?? "my secret symmetric key",
    );

    // Import your secret as a CryptoKey for both 'sign' and 'verify' operations
    const key = await crypto.subtle.importKey(
      "raw",
      secretKeyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );

    const url = new URL(request.url);

    // This is a demonstration Worker that allows unauthenticated access to /generate
    // In a real application you would want to make sure that
    // users could only generate signed URLs when authenticated
    if (url.pathname.startsWith("/signedurl/generate/")) {
      url.pathname = url.pathname.replace("/signedurl/generate/", "/signedurl/s3/");

      const timestamp = Math.floor(Date.now() / 1000);

      // This contains all the data about the request that you want to be able to verify
      // Here we only sign the timestamp and the pathname, but often you will want to
      // include more data (for instance, the URL hostname or query parameters)
      const dataToAuthenticate = `${url.pathname}${timestamp}`;

      const mac = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(dataToAuthenticate),
      );

      // Refer to https://developers.cloudflare.com/workers/runtime-apis/nodejs/
      // for more details on using Node.js APIs in Workers
      const base64Mac = Buffer.from(mac).toString("base64");

      url.searchParams.set("accesskey", `${timestamp}-${base64Mac}`);
      console.log("Response:", `${url.pathname}${url.search}`)

      return new Response(`${url.pathname}${url.search}`);
      // Verify all non /generate requests
    }

    return fetch(new URL(url.pathname, "https://www.whereismypacket.net/signedurl"), request);
  },
};