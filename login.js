// Configuration
const API_URL = 'https://script.google.com/macros/s/AKfycbyUb-G0J4Ylrf5GYHyh8-QfMi_gktDMTzNHXMPm22kug48oJnIcnr2lZDm8BhxsSy5CVQ/exec';
const RESEND_TIMEOUT = 30; // seconds

// DOM Elements
const emailSection = document.getElementById('email-section');
const otpSection = document.getElementById('otp-section');
const errorMessage = document.getElementById('error-message');
const emailInput = document.getElementById('email');
const otpInput = document.getElementById('otp');
const sendOtpButton = document.getElementById('send-otp');
const verifyOtpButton = document.getElementById('verify-otp');
const backToEmailButton = document.getElementById('back-to-email');
const resendOtpButton = document.getElementById('resend-otp');
const resendTimer = document.getElementById('resend-timer');

// State
let resendCountdown = RESEND_TIMEOUT;
let resendInterval = null;

// Event Listeners
sendOtpButton.addEventListener('click', handleSendOtp);
verifyOtpButton.addEventListener('click', handleVerifyOtp);
backToEmailButton.addEventListener('click', showEmailSection);
resendOtpButton.addEventListener('click', handleResendOtp);

// Functions
function handleSendOtp() {
    const email = emailInput.value.trim();
    if (!email) {
        showError('Please enter your email address');
        return;
    }

    setLoading(sendOtpButton, true);

    // Create a unique callback name
    const callbackName = 'jsonpCallback_' + Date.now();
    
    // Create the callback function
    window[callbackName] = function(response) {
        setLoading(sendOtpButton, false);
        if (response.status === 'success') {
            showOtpSection();
            hideError();
            startResendTimer();
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

    setLoading(verifyOtpButton, true);

    // Create a unique callback name
    const callbackName = 'jsonpCallback_' + Date.now();
    
    // Create the callback function
    window[callbackName] = function(response) {
        setLoading(verifyOtpButton, false);
        if (response.status === 'success') {
            // Store the data in sessionStorage
            sessionStorage.setItem('memberData', JSON.stringify(response.members));
            // Redirect to data page
            window.location.href = 'data.html';
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

function handleResendOtp() {
    if (resendOtpButton.disabled) return;
    
    const email = emailInput.value.trim();
    if (!email) {
        showError('Please enter your email address');
        return;
    }

    setLoading(resendOtpButton, true);

    // Create a unique callback name
    const callbackName = 'jsonpCallback_' + Date.now();
    
    // Create the callback function
    window[callbackName] = function(response) {
        setLoading(resendOtpButton, false);
        if (response.status === 'success') {
            showError('OTP resent successfully');
            startResendTimer();
        } else {
            showError(response.message || 'Failed to resend OTP');
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

function startResendTimer() {
    resendCountdown = RESEND_TIMEOUT;
    resendOtpButton.disabled = true;
    updateResendTimer();
    
    if (resendInterval) {
        clearInterval(resendInterval);
    }
    
    resendInterval = setInterval(() => {
        resendCountdown--;
        updateResendTimer();
        
        if (resendCountdown <= 0) {
            stopResendTimer();
        }
    }, 1000);
}

function stopResendTimer() {
    if (resendInterval) {
        clearInterval(resendInterval);
        resendInterval = null;
    }
    resendOtpButton.disabled = false;
    resendTimer.textContent = '';
}

function updateResendTimer() {
    resendTimer.textContent = `(${resendCountdown}s)`;
}

function setLoading(button, isLoading) {
    const buttonText = button.querySelector('.button-text');
    const spinner = button.querySelector('.loading-spinner');
    
    if (isLoading) {
        buttonText.style.display = 'none';
        spinner.style.display = 'inline-block';
        button.disabled = true;
    } else {
        buttonText.style.display = 'inline-block';
        spinner.style.display = 'none';
        button.disabled = false;
    }
}

function showEmailSection() {
    emailSection.style.display = 'block';
    otpSection.style.display = 'none';
    otpInput.value = '';
}

function showOtpSection() {
    emailSection.style.display = 'none';
    otpSection.style.display = 'block';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
} 