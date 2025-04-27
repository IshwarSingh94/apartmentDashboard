// Configuration
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your Google Sheet ID
const MEMBER_SHEET_NAME = 'Member Data';
const PARTNER_SHEET_NAME = 'Partner Access';
const OTP_EXPIRY_MINUTES = 10;

// Main doGet function to serve the web app
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Apartment Portal')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Handle POST requests
function doPost(e) {
  const action = e.parameter.action;
  const data = JSON.parse(e.postData.contents);
  
  switch(action) {
    case 'sendOtp':
      return handleSendOtp(data);
    case 'verifyOtp':
      return handleVerifyOtp(data);
    default:
      return createErrorResponse('Invalid action');
  }
}

// Generate and send OTP
function handleSendOtp(data) {
  const email = data.email;
  
  // Check if email is authorized
  if (!isAuthorizedEmail(email)) {
    return createErrorResponse('Email not authorized');
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
    
    return createSuccessResponse('OTP sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    return createErrorResponse('Failed to send OTP');
  }
}

// Verify OTP and return member data
function handleVerifyOtp(data) {
  const email = data.email;
  const otp = data.otp;
  
  // Get stored OTP
  const cache = CacheService.getScriptCache();
  const storedOtp = cache.get(email);
  
  if (!storedOtp || storedOtp !== otp) {
    return createErrorResponse('Invalid or expired OTP');
  }
  
  // Clear OTP from cache
  cache.remove(email);
  
  // Get member data for the partner's complex
  const members = getMemberDataForPartner(email);
  
  return createSuccessResponse('OTP verified successfully', { members });
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
        email: memberData[i][1],
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
function createSuccessResponse(message, data = {}) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: message,
    ...data
  })).setMimeType(ContentService.MimeType.JSON);
}

// Create error response
function createErrorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
} 