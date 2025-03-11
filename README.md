

# Signed URL Demo Project

This project demonstrates using Cloudflare Workers and Pages to create and validate signed URLs with HMAC authentication. The solution provides a secure way to authenticate requests for protected resources while allowing effective caching.

## Project Components

This project consists of two main components:

1. **Request Signing Worker** - A Cloudflare Worker that signs requests using HMAC authentication
2. **Signed URL Demo Page** - A Cloudflare Pages application that demonstrates requesting and using signed URLs
3. **WAF for HMAC validation**
4. **Cache Rules for Query String Parameters**


## Request Signing Worker

The request signing worker adds HMAC signatures to outgoing requests, allowing authentication of the request origin.

### Features

- Signs requests with HMAC-SHA256
- Adds timestamp for request freshness verification
- Creates a signature based on the request method, path, timestamp, and request body
- Securely manages signing keys

### Deployment Instructions

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Authenticate:
   ```bash
   wrangler login
   ```

3. Create a project directory:
   ```bash
   mkdir request-signing-worker
   cd request-signing-worker
   wrangler init
   ```

4. Replace the `src/index.js` file with the provided code
5. Configure `wrangler.toml` appropriately
6. Deploy:
   ```bash
   wrangler publish
   ```

### Security Considerations

- Store your signing key as a secret:
  ```bash
  wrangler secret put SIGNING_KEY
  ```
- Use unique signing keys for different resources or services
- Regularly rotate signing keys

## Signed URL Demo Page

A demonstration web page that shows how to request, validate, and use signed URLs for protected resources.

### Features

- Requests signed URLs from the server
- Displays countdown timer for URL expiration
- Embedded PDF viewer with signed URL authentication
- Cache status display for debugging and verification
- Copy functionality for sharing URLs
- Files are stored in a R2 bucket with a bind to the Pages application as described in [Cloudflare documentation](https://developers.cloudflare.com/pages/tutorials/use-r2-as-static-asset-storage-for-pages/).

### Deployment Instructions

1. Create a folder for your Pages project
2. Add the files using the same structure seen here
3. Create a R2 bucket and bind it to your Pages by editing the wrangler.toml file
5. Deploy to Cloudflare Pages:
   - Log in to your Cloudflare dashboard
   - Navigate to Pages
   - Click "Create a project"
   - Choose your connection method (Direct Upload or via Git)
   - Configure and deploy

## WAF Rules for HMAC Validation

For the signed URLs to be properly validated, you need to configure WAF custom rules for HMAC validation as described in [Cloudflare documentation](https://developers.cloudflare.com/waf/custom-rules/use-cases/configure-token-authentication/#option-2-configure-using-waf-custom-rules).

### Example WAF Rule Configuration

1. Go to your Cloudflare dashboard
2. Navigate to Security > WAF > Custom rules
3. Create a new custom rule with settings similar to the one below:
   - The time limit is set to 300 seconds
   - Here the example SIGNING_KEY is my-secret-key
   - The last parameter, here "11", is the lenght of "?accesskey="

```
IF
  (http.host eq "signedurl.whereismypacket.net" and starts_with(http.request.uri.path, "/signedurl/files/") and not is_timed_hmac_valid_v0("my-secret-key", http.request.uri, 300, http.request.timestamp.sec, 11))
THEN
  Block
```

## Cache Rules for Query String Parameters

For your signed files to be properly cached even with varying query parameters, you need to configure cache keys to ignore the authentication parameters. This ensures that Cloudflare serves cached content even when the authentication tokens vary.

Reference: [Cloudflare Cache Keys Documentation](https://developers.cloudflare.com/cache/how-to/cache-keys/#query-string)

### Configuring Cache Rules

1. Go to your Cloudflare dashboard
2. Navigate to Caching > Configuration
3. Scroll to "Cache Key Settings"
4. Under "Query String", select "Ignore specified parameters"
5. Add your authentication parameters (e.g., "accesskey") to the list of ignored parameters

This configuration ensures that files are cached based on their core URL, ignoring the authentication tokens which change for each user or session.

## Testing

1. Access the Signed URL Demo page
2. Click "Get Signed URL" to obtain a new signed URL (valid for 5 minutes)
3. Use "View PDF" to load the document and view cache information
4. Check the cache status to confirm caching is working as expected
5. Test URL expiration by waiting for the countdown to complete

## Troubleshooting

- Check WAF logs for blocked requests to diagnose authentication issues
- Verify cache status information for caching-related problems
- Ensure query string parameters are properly configured in cache keys
- Confirm that signing keys match between your worker and validation service

## Security Notes

- Do not expose signing keys in client-side code
- Set appropriate expiration times for signed URLs
- Use HTTPS for all communications
- Consider rate limiting to prevent brute force attacks