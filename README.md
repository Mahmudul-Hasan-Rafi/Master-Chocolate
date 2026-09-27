# Master Chocolate — Upgraded Landing Page

This project keeps the original 96-frame scroll-controlled chocolate reveal and adds a complete cinematic landing-page experience around it.

## Run
Keep the `frames` directory beside `index.html`, then use VS Code Live Server (recommended) or another static server.

The animation expects:
`frames/frame_0001.jpg` through `frames/frame_0096.jpg`

## Sections
Hero / scroll reveal → statement → cacao world → ingredients → collection → break-apart → story → final CTA.

No framework or build step is required; it is a plain HTML/CSS/JS site.


## Shop & checkout
The new `shop.html` page is a responsive storefront for desktop and mobile.

Features:
- Product collection with four chocolate variants.
- Add-to-cart interactions, quantity controls and remove buttons.
- Cart persists with `localStorage`.
- Checkout requires full name, phone number and delivery address.
- Customer details can be remembered in the same browser.
- Order confirmation creates a local order reference.
- The checkout is intentionally frontend-only. For real purchases, connect the order submission to a backend/database and a payment provider.

Open `shop.html` directly with Live Server, or use the "Shop" links from the main landing page.
