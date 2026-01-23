# Split Bills Fairly

A fast, accessible bill-splitting calculator built with pure HTML, CSS, and vanilla JavaScript.

**Live site:** https://splitbillsfairly.com

## Features

- **Even Bill Split**: Divide a single bill equally among any number of people
- **Group Bill Expenses**: Track multiple expenses paid by different people with automatic settlement calculation
- **Embeddable**: Minimal-UI version for embedding on other websites
- **Fully Accessible**: Keyboard navigation, ARIA labels, screen reader support
- **Mobile-First**: Responsive design that works on all devices
- **Privacy-First**: All calculations happen locally in the browser - no data is sent to any server
- **SEO Optimized**: JSON-LD structured data, meta tags, sitemap

## Project Structure

```
splitbillsfairly/
├── index.html              # Homepage with calculator
├── about/
│   └── index.html          # About page
├── embed/
│   └── index.html          # Embeddable calculator (minimal UI)
├── assets/
│   ├── css/
│   │   └── styles.css      # All styles
│   └── js/
│       └── app.js          # Calculator logic
├── robots.txt              # Search engine directives
├── sitemap.xml             # XML sitemap
└── README.md               # This file
```

## Local Development

No build step required. Simply open `index.html` in a browser:

```bash
# macOS
open index.html

# Or use a local server for proper path resolution
npx serve .
# or
python -m http.server 8000
```

## How to Deploy on Netlify

### Option 1: Drag & Drop

1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag the entire `splitbillsfairly` folder onto the page
3. Your site will be live instantly

### Option 2: Git Integration

1. Push this folder to a GitHub/GitLab/Bitbucket repository
2. Log in to [Netlify](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your repository
5. Deploy settings:
   - **Build command**: (leave empty)
   - **Publish directory**: `.` or `/`
6. Click "Deploy"

### Option 3: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy (from the splitbillsfairly directory)
cd splitbillsfairly
netlify deploy --prod
```

### Custom Domain Setup

1. In Netlify dashboard, go to **Site settings** → **Domain management**
2. Click "Add custom domain"
3. Enter `splitbillsfairly.com`
4. Update your domain's DNS:
   - Add an A record pointing to Netlify's load balancer IP
   - Or add a CNAME record pointing to your Netlify subdomain
5. Enable HTTPS (automatic with Let's Encrypt)

## Favicon Setup

The HTML references these favicon files (not included - add your own):

- `/assets/favicon-32x32.png` (32x32)
- `/assets/favicon-16x16.png` (16x16)
- `/assets/apple-touch-icon.png` (180x180)

Generate favicons from your logo at [favicon.io](https://favicon.io) or [realfavicongenerator.net](https://realfavicongenerator.net).

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- iOS Safari
- Android Chrome

## License

Part of the [ads4good Network](https://www.ads4good.com/network).

---

© 2026 SplitBillsFairly
