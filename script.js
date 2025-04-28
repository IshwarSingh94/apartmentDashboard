// Configuration
const API_URL = 'https://script.google.com/macros/s/AKfycbzJMysocGG1-9wh4GtRsnUWjKLWtPNpd921TxoYWYz7U0J6hCKwx6hWveQgFTJJEsOGaA/exec';
const ITEMS_PER_PAGE = 10;
const RESEND_TIMEOUT = 30; // seconds

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
const searchInput = document.getElementById('search-input');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const resendOtpButton = document.getElementById('resend-otp');
const resendTimer = document.getElementById('resend-timer');

// State
let allMembers = [];
let currentPage = 1;
let currentSort = { column: 'name', direction: 'asc' };
let resendCountdown = RESEND_TIMEOUT;
let resendInterval = null;

// Event Listeners
sendOtpButton.addEventListener('click', handleSendOtp);
verifyOtpButton.addEventListener('click', handleVerifyOtp);
backToEmailButton.addEventListener('click', showEmailSection);
logoutButton.addEventListener('click', handleLogout);
searchInput.addEventListener('input', handleFilter);
startDateInput.addEventListener('change', handleFilter);
endDateInput.addEventListener('change', handleFilter);
prevPageButton.addEventListener('click', () => changePage(currentPage - 1));
nextPageButton.addEventListener('click', () => changePage(currentPage + 1));
resendOtpButton.addEventListener('click', handleResendOtp);

// Add sort listeners to table headers
document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => handleSort(th.dataset.sort));
});

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
            allMembers = response.members;
            showDataContainer();
            displayMemberData();
            hideError();
            stopResendTimer();
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

function displayMemberData() {
    const filteredMembers = filterMembers();
    const sortedMembers = sortMembers(filteredMembers);
    const paginatedMembers = paginateMembers(sortedMembers);
    
    memberDataTable.innerHTML = '';
    
    paginatedMembers.forEach(member => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member.name}</td>
            <td>${member.plan || '-'}</td>
            <td>${formatDate(member.purchaseDate)}</td>
            <td>${formatDate(member.startDate)}</td>
            <td>${formatDate(member.endDate)}</td>
            <td>${formatCurrency(member.amountPaid)}</td>
        `;
        memberDataTable.appendChild(row);
    });

    updatePagination(filteredMembers.length);
}

function filterMembers() {
    const searchTerm = searchInput.value.toLowerCase();
    const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
    const endDate = endDateInput.value ? new Date(endDateInput.value) : null;

    return allMembers.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm) ||
                            (member.plan && member.plan.toLowerCase().includes(searchTerm));
        
        const purchaseDate = new Date(member.purchaseDate);
        const matchesDateRange = (!startDate || purchaseDate >= startDate) &&
                               (!endDate || purchaseDate <= endDate);

        return matchesSearch && matchesDateRange;
    });
}

function sortMembers(members) {
    return [...members].sort((a, b) => {
        const aValue = a[currentSort.column];
        const bValue = b[currentSort.column];
        
        if (currentSort.column === 'amountPaid') {
            return currentSort.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        if (currentSort.column.includes('Date')) {
            const aDate = new Date(aValue);
            const bDate = new Date(bValue);
            return currentSort.direction === 'asc' ? aDate - bDate : bDate - aDate;
        }
        
        const comparison = String(aValue).localeCompare(String(bValue));
        return currentSort.direction === 'asc' ? comparison : -comparison;
    });
}

function paginateMembers(members) {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return members.slice(start, start + ITEMS_PER_PAGE);
}

function handleSort(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    // Update sort icons
    document.querySelectorAll('th[data-sort]').forEach(th => {
        const icon = th.querySelector('i');
        if (th.dataset.sort === column) {
            icon.className = currentSort.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        } else {
            icon.className = 'fas fa-sort';
        }
    });
    
    displayMemberData();
}

function handleFilter() {
    currentPage = 1;
    displayMemberData();
}

function changePage(page) {
    const filteredMembers = filterMembers();
    const maxPage = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
    
    if (page >= 1 && page <= maxPage) {
        currentPage = page;
        displayMemberData();
    }
}

function updatePagination(totalItems) {
    const maxPage = Math.ceil(totalItems / ITEMS_PER_PAGE);
    pageInfo.textContent = `Page ${currentPage} of ${maxPage}`;
    
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === maxPage;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'INR'
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
    allMembers = [];
    currentPage = 1;
    currentSort = { column: 'name', direction: 'asc' };
    searchInput.value = '';
    startDateInput.value = '';
    endDateInput.value = '';
} 