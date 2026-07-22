# Removing the "Unknown Publisher" / antivirus warnings

## What causes it

Windows SmartScreen and Defender don't trust an .exe/.msi just because it has a
"Publisher" name in its metadata — that field (already set to **Lily's Little
Adventures** in `src-tauri/tauri.conf.json`) is just text anyone could type in.
The "Unknown Publisher" prompt and AV false-positives happen because the build
is **unsigned**: it carries no Authenticode signature that a Certificate
Authority has cryptographically tied to a verified identity. This can't be
fixed by editing config — it requires an actual code-signing certificate,
which means picking a CA and completing identity verification, which is a
business decision only you can make. What follows are the concrete options.

## Option A — Azure Trusted Signing (recommended for an indie/solo studio)

Microsoft's newer signing service. Cheapest path to a trusted signature with
**instant** SmartScreen reputation (no cert. it's a short-lived signing
certificate issued per-signature, not something you download and store).

- ~$10/month (Basic tier), pay-as-you-go via an Azure subscription.
- Identity verification: a registered business (any age), or an individual
  with a Microsoft-verified ID and 3+ years of verifiable history under that
  identity. A sole-proprietor "Lily's Little Adventures" DBA/registration
  satisfies the business path.
- Setup: create a Trusted Signing account + certificate profile in the Azure
  portal, then sign with the `trusted-signing-cli` tool or `signtool` +
  the Azure dlib, or wire it into Tauri via a custom `signCommand` (see
  below).
- Docs: https://learn.microsoft.com/azure/trusted-signing/

## Option B — Traditional OV/EV certificate from a CA

Bought from DigiCert, SSL.com, Sectigo, GlobalSign, etc.

- **OV (Organization Validation)**: ~$70-250/yr. Removes "Unknown Publisher"
  immediately, but SmartScreen reputation still has to build up over time
  from real download/run volume — early users may still see a SmartScreen
  warning for a while even though the publisher is verified.
- **EV (Extended Validation)**: ~$250-450/yr, usually shipped on a hardware
  token (USB) or via cloud HSM signing. Gets **instant** SmartScreen
  reputation, same as Trusted Signing, but at a higher price and with a
  stricter identity-verification process (they'll want business registration
  documents).
- Either way you'll go through a validation call/paperwork process with the
  CA before they issue anything.

## Wiring a certificate into the build once you have one

Tauri signs the MSI automatically at build time if you give it either a local
certificate (`certificateThumbprint`, cert installed in the Windows cert
store) or a custom signing command (needed for Azure Trusted Signing / an EV
token that isn't importable into the local store). Add one of these under
`bundle.windows` in `src-tauri/tauri.conf.json`:

```jsonc
// Local cert store (OV/EV cert imported into Windows' certificate store)
"windows": {
  "certificateThumbprint": "<SHA1 THUMBPRINT OF THE CERT>",
  "digestAlgorithm": "sha256",
  "timestampUrl": "http://timestamp.digicert.com"
}
```

```jsonc
// Custom command (Azure Trusted Signing, HSM-backed EV cert, etc.)
"windows": {
  "signCommand": "trusted-signing-cli sign -e https://eus.codesigning.azure.net -a MyAccount -c MyCertProfile %1"
}
```

`%1` is replaced by Tauri with the path of the file to sign. Never commit the
certificate, its password, or Azure credentials to the repo — pass them as
environment variables / CI secrets at build time instead.

## Independent of signing: submit for a Defender false-positive review

Signing mostly prevents *new* flags. If the unsigned build has already been
flagged by Defender specifically (not just the generic "unrecognized app"
SmartScreen prompt), submit it for analysis so Microsoft can whitelist it —
this is free and doesn't require a certificate:
https://www.microsoft.com/en-us/wdsi/filesubmission

## What's already fixed without a certificate

- Publisher metadata across the MSI, EULA, and package manifest now reads
  **Lily's Little Adventures** consistently (was previously the placeholder
  "Touwers").
- The installer no longer needs a separate, unsigned-looking network call to
  fetch the WebView2 bootstrapper mid-install (`webviewInstallMode` now
  embeds it) — one less thing that looks suspicious to an AV heuristic scan
  and one less step for the user.
- The WiX dialog background image was the wrong pixel size (717×478 vs the
  493×312 WiX expects) and was being cropped/misrendered by the installer;
  it's now sized correctly.

None of that removes "Unknown Publisher" — only a signature does that — but
it makes everything visible in the installer window itself consistent and
correctly branded in the meantime.
