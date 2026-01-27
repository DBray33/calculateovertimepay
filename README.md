# Overtime Pay Calculator

A fast, accessible overtime pay calculator built with pure HTML, CSS, and vanilla JavaScript.

**Live site:** https://calculateovertimepay.com

## Features

- **Multi-Currency Support**: USD, GBP, EUR, CAD, AUD, JPY
- **Hourly Rate Helper**: Calculate hourly rate from weekly, bi-weekly, monthly, or annual pay
- **Custom Overtime Multipliers**: 1.5x, 1.75x, 2x, or custom
- **Comprehensive Information**: Overtime laws by country, exemptions, FAQs
- **Embeddable**: Minimal-UI version for embedding on other websites
- **Fully Accessible**: Keyboard navigation, ARIA labels, screen reader support
- **Mobile-First**: Responsive design that works on all devices
- **Privacy-First**: All calculations happen locally in the browser - no data is sent to any server
- **SEO Optimized**: JSON-LD structured data, meta tags, sitemap

## Project Structure

```
calculateovertimepay/
├── index.html              # Homepage with calculator
├── about/
│   └── index.html          # About page
├── embed/
│   └── index.html          # Embeddable calculator (minimal UI)
├── assets/
│   ├── css/
│   │   └── styles.css      # All styles
│   ├── js/
│   │   └── app.js          # Calculator logic
│   ├── favicon.svg         # Site favicon
│   └── og-image.jpg        # Open Graph image
├── robots.txt              # Search engine directives
├── sitemap.xml             # XML sitemap
└── README.md               # This file
```

## Local Development

No build step required. Simply open `index.html` in a browser or use a local server:

```bash
# Using VS Code Live Server extension
# Or use a local server
npx serve .
# or
python -m http.server 8000
```

## License

Part of the [ads4good Network](https://www.ads4good.com/network).

---

© 2026 OvertimePayCalc
