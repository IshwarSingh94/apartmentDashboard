# Apartment Portal

A secure web portal for partner apartment complexes to view their member data.

## Overview

This portal allows authorized representatives from partner apartment complexes to securely access member data specific to their complex. The system uses email-based authentication with One-Time Password (OTP) verification.

## Features

- Secure email + OTP authentication
- View-only access to member data
- Data filtering by apartment complex
- Clean and intuitive user interface

## Technical Stack

- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Backend: Google Apps Script
- Database: Google Sheets
- Hosting: Google Apps Script Web App

## Setup Instructions

1. Create a Google Sheet with two sheets:
   - `Member Data`: Contains member information
   - `Partner Access`: Contains authorized partner emails and their associated complexes

2. Deploy the Google Apps Script as a web app:
   - Set "Execute as" to "Me"
   - Set "Who has access" to "Anyone"
   - Deploy and copy the web app URL

3. Update the web app URL in `script.js`

## Security Considerations

- OTPs expire after 10 minutes
- Data filtering occurs server-side
- HTTPS encryption by default
- Rate limiting on OTP requests

## File Structure

- `index.html`: Main login page
- `styles.css`: Styling for the portal
- `script.js`: Client-side JavaScript
- `Code.gs`: Google Apps Script backend code

## Usage

1. Navigate to the portal URL
2. Enter your authorized email address
3. Click "Send OTP"
4. Check your email for the OTP
5. Enter the OTP to view your complex's member data

## Support

For technical support or questions, please contact the system administrator. 