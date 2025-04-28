# Apartment Portal

A web application for managing apartment member data.

## Features

- User authentication
- Member data management
- Responsive design
- Data sorting and filtering
- Pagination

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/apartment-portal.git
cd apartment-portal
```

2. Open the project in your preferred code editor.

3. Make sure you have the following files in your project:
   - `index.html` (Login page)
   - `data.html` (Data management page)
   - `styles.css` (Styles)
   - `script.js` (Login functionality)
   - `data.js` (Data management functionality)

## Deployment

### GitHub Setup

1. Create a new repository on GitHub
2. Initialize git in your project:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/apartment-portal.git
git push -u origin main
```

### Netlify Deployment

1. Go to [Netlify](https://www.netlify.com/) and sign up/login
2. Click "New site from Git"
3. Choose GitHub and select your repository
4. Configure the build settings:
   - Build command: (leave empty)
   - Publish directory: . (dot)
5. Click "Deploy site"

## Environment Variables

If you need to use environment variables (e.g., for API keys), you can set them in Netlify:

1. Go to Site settings > Build & deploy > Environment
2. Add your environment variables

## Custom Domain

To add a custom domain:

1. Go to Site settings > Domain management
2. Click "Add custom domain"
3. Follow the instructions to configure your domain

## Support

For any issues or questions, please open an issue in the GitHub repository. 