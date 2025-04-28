// Configuration
const SPREADSHEET_ID = '1w7m3wPDdxB2xWonPYaAtHm-YWEXsaH-WYg116bx_mk8'; // Replace with your Google Sheet ID
const MEMBER_SHEET_NAME = 'Member Data';
const PARTNER_SHEET_NAME = 'Partner Access';
const OTP_EXPIRY_MINUTES = 10;
const ALLOWED_ORIGINS = ['https://b2bpartner.netlify.app', 'http://localhost:3000']; // Add your domains

// Main doGet function to serve the web app
function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;
  
  if (!action) {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Apartment Portal')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  let result;
  switch(action) {
    case 'sendOtp':
      result = handleSendOtpGet(e.parameter);
      break;
    case 'verifyOtp':
      result = handleVerifyOtpGet(e.parameter);
      break;
    default:
      result = { status: 'error', message: 'Invalid action' };
  }
  
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handle send OTP via GET
function handleSendOtpGet(params) {
  const email = params.email;
  
  if (!email) {
    return { status: 'error', message: 'Email is required' };
  }
  
  // Check if email is authorized
  if (!isAuthorizedEmail(email)) {
    return { status: 'error', message: 'Email not authorized' };
  }
  
  // Generate OTP
  const otp = generateOTP();
  
  // Store OTP with expiry
  const cache = CacheService.getScriptCache();
  cache.put(email, otp, OTP_EXPIRY_MINUTES * 60);
  
  // Send OTP via email
  try {
    MailApp.sendEmail({
      to: email,
      subject: 'Your OTP for Apartment Portal',
      body: `Your OTP is: ${otp}\n\nThis OTP will expire in ${OTP_EXPIRY_MINUTES} minutes.`
    });
    
    return { status: 'success', message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { status: 'error', message: 'Failed to send OTP' };
  }
}

// Handle verify OTP via GET
function handleVerifyOtpGet(params) {
  const email = params.email;
  const otp = params.otp;
  
  if (!email || !otp) {
    return { status: 'error', message: 'Email and OTP are required' };
  }
  
  // Get stored OTP
  const cache = CacheService.getScriptCache();
  const storedOtp = cache.get(email);
  
  if (!storedOtp || storedOtp !== otp) {
    return { status: 'error', message: 'Invalid or expired OTP' };
  }
  
  // Clear OTP from cache
  cache.remove(email);
  
  // Get member data for the partner's complex
  const members = getMemberDataForPartner(email);
  
  return { 
    status: 'success', 
    message: 'OTP verified successfully',
    members: members
  };
}

// Check if email is authorized
function isAuthorizedEmail(email) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PARTNER_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email) { // Assuming email is in second column
      return true;
    }
  }
  
  return false;
}

// Get member data for specific partner
function getMemberDataForPartner(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const partnerSheet = ss.getSheetByName(PARTNER_SHEET_NAME);
  const memberSheet = ss.getSheetByName(MEMBER_SHEET_NAME);
  
  // Get partner's complex name
  const partnerData = partnerSheet.getDataRange().getValues();
  let complexName = '';
  
  for (let i = 1; i < partnerData.length; i++) {
    if (partnerData[i][1] === email) { // Assuming email is in second column
      complexName = partnerData[i][0]; // Assuming complex name is in first column
      break;
    }
  }
  
  if (!complexName) {
    return [];
  }
  
  // Get member data
  const memberData = memberSheet.getDataRange().getValues();
  const members = [];
  
  // Skip header row
  for (let i = 1; i < memberData.length; i++) {
    if (memberData[i][6] === complexName) { // Assuming complex name is in seventh column
      members.push({
        name: memberData[i][0],
        plan: memberData[i][1],
        purchaseDate: memberData[i][2],
        startDate: memberData[i][3],
        endDate: memberData[i][4],
        amountPaid: memberData[i][5]
      });
    }
  }
  
  return members;
}

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create success response
function createSuccessResponse(message, data = {}, headers = {}) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: message,
    ...data
  }))
  .setMimeType(ContentService.MimeType.JSON)
  .setHeaders(headers);
}

// Create error response
function createErrorResponse(message, headers = {}) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: message
  }))
  .setMimeType(ContentService.MimeType.JSON)
  .setHeaders(headers);
} 