// Configuration
const API_URL = 'https://script.google.com/macros/s/AKfycbyUb-G0J4Ylrf5GYHyh8-QfMi_gktDMTzNHXMPm22kug48oJnIcnr2lZDm8BhxsSy5CVQ/exec';

// DOM Elements
const emailSection = document.getElementById('email-section');
const otpSection = document.getElementById('otp-section');
const dataContainer = document.getElementById('data-container');
const errorMessage = document.getElementById('error-message');
const emailInput = document.getElementById('email');
const otpInput = document.getElementById('otp');
const sendOtpButton = document.getElementById('send-otp');
const verifyOtpButton = document.getElementById('verify-otp');
const backToEmailButton = document.getElementById('back-to-email');
const logoutButton = document.getElementById('logout');
const memberDataTable = document.getElementById('member-data');

// Event Listeners
sendOtpButton.addEventListener('click', handleSendOtp);
verifyOtpButton.addEventListener('click', handleVerifyOtp);
backToEmailButton.addEventListener('click', showEmailSection);
logoutButton.addEventListener('click', handleLogout);

// Functions
function handleSendOtp() {
    const email = emailInput.value.trim();
    if (!email) {
        showError('Please enter your email address');
        return;
    }

    // Create a unique callback name
    const callbackName = 'jsonpCallback_' + Date.now();
    
    // Create the callback function
    window[callbackName] = function(response) {
        if (response.status === 'success') {
            showOtpSection();
            hideError();
        } else {
            showError(response.message || 'Failed to send OTP');
        }
        // Clean up
        delete window[callbackName];
        document.body.removeChild(script);
    };

    // Create and append the script tag
    const script = document.createElement('script');
    script.src = `${API_URL}?action=sendOtp&email=${encodeURIComponent(email)}&callback=${callbackName}`;
    document.body.appendChild(script);
}

function handleVerifyOtp() {
    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();
    
    if (!otp) {
        showError('Please enter the OTP');
        return;
    }

    // Create a unique callback name
    const callbackName = 'jsonpCallback_' + Date.now();
    
    // Create the callback function
    window[callbackName] = function(response) {
        if (response.status === 'success') {
            showDataContainer();
            displayMemberData(response.members);
            hideError();
        } else {
            showError(response.message || 'Invalid OTP');
        }
        // Clean up
        delete window[callbackName];
        document.body.removeChild(script);
    };

    // Create and append the script tag
    const script = document.createElement('script');
    script.src = `${API_URL}?action=verifyOtp&email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}&callback=${callbackName}`;
    document.body.appendChild(script);
}

function displayMemberData(members) {
    memberDataTable.innerHTML = '';
    
    members.forEach(member => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member.name}</td>
            <td>${member.email}</td>
            <td>${formatDate(member.purchaseDate)}</td>
            <td>${formatDate(member.startDate)}</td>
            <td>${formatDate(member.endDate)}</td>
            <td>${formatCurrency(member.amountPaid)}</td>
        `;
        memberDataTable.appendChild(row);
    });
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function showEmailSection() {
    emailSection.style.display = 'block';
    otpSection.style.display = 'none';
    dataContainer.style.display = 'none';
    otpInput.value = '';
}

function showOtpSection() {
    emailSection.style.display = 'none';
    otpSection.style.display = 'block';
    dataContainer.style.display = 'none';
}

function showDataContainer() {
    emailSection.style.display = 'none';
    otpSection.style.display = 'none';
    dataContainer.style.display = 'block';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function handleLogout() {
    showEmailSection();
    emailInput.value = '';
    otpInput.value = '';
    hideError();
} 
