// Configuration
const API_URL = 'https://script.google.com/macros/s/AKfycbxXW22uVUL1jJ7pxPkDfMDsF7LlKcAcnUx-9YnCADwvrGUt2oY0fXYnCkU6XAi9Z69wgw/exec'; // Replace with your deployed web app URL

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
async function handleSendOtp() {
    const email = emailInput.value.trim();
    if (!email) {
        showError('Please enter your email address');
        return;
    }

    try {
        const response = await fetch(`${API_URL}?action=sendOtp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            showOtpSection();
            hideError();
        } else {
            showError(data.message || 'Failed to send OTP');
        }
    } catch (error) {
        showError('An error occurred. Please try again.');
        console.error('Error:', error);
    }
}

async function handleVerifyOtp() {
    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();
    
    if (!otp) {
        showError('Please enter the OTP');
        return;
    }

    try {
        const response = await fetch(`${API_URL}?action=verifyOtp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp }),
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            showDataContainer();
            displayMemberData(data.members);
            hideError();
        } else {
            showError(data.message || 'Invalid OTP');
        }
    } catch (error) {
        showError('An error occurred. Please try again.');
        console.error('Error:', error);
    }
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
