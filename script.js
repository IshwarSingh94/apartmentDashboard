// Configuration
const API_URL = 'https://script.google.com/macros/s/AKfycbzJMysocGG1-9wh4GtRsnUWjKLWtPNpd921TxoYWYz7U0J6hCKwx6hWveQgFTJJEsOGaA/exec';
const ITEMS_PER_PAGE = 10;
const RESEND_TIMEOUT = 30; // seconds

// DOM Elements
const loginSectionMain = document.getElementById('login-section-main');
const dataSectionMain = document.getElementById('data-section-main');
const emailSection = document.getElementById('email-section');
const otpSection = document.getElementById('otp-section');
const dataContainer = document.getElementById('data-container'); // Main container for data view
const loginErrorMessage = document.getElementById('login-error-message');
const dataErrorMessage = document.getElementById('data-error-message');
const noResultsMessage = document.getElementById('no-results-message');

const emailInput = document.getElementById('email');
const otpInput = document.getElementById('otp');
const sendOtpButton = document.getElementById('send-otp');
const verifyOtpButton = document.getElementById('verify-otp');
const backToEmailButton = document.getElementById('back-to-email');
const logoutButton = document.getElementById('logout');
const memberDataTable = document.getElementById('member-data'); // tbody element
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

// --- Helper Functions ---

function setLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

function showError(message, type = 'login') {
    const errorElement = type === 'data' ? dataErrorMessage : loginErrorMessage;
    if (!errorElement) return;
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError(type = 'login') {
    const errorElement = type === 'data' ? dataErrorMessage : loginErrorMessage;
     if (!errorElement) return;
    errorElement.style.display = 'none';
    errorElement.textContent = '';
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return '-';
        }
        // Use a consistent format (DD/MM/YYYY) or locale-specific
        return date.toLocaleDateString('en-GB'); // Example: British English format
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return '-';
    }
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '-';
    try {
        return new Intl.NumberFormat('en-IN', { // Use Indian English format
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0, // Optional: hide paise if always whole rupees
            maximumFractionDigits: 2
        }).format(amount);
    } catch (e) {
         console.error("Error formatting currency:", amount, e);
         return '-';
    }
}

// --- UI Navigation Functions ---

function showLoginView() {
    loginSectionMain.style.display = 'block';
    dataSectionMain.style.display = 'none';
    showEmailSection(); // Start at email input
    hideError('login');
    hideError('data');
}

function showDataView() {
    loginSectionMain.style.display = 'none';
    dataSectionMain.style.display = 'block';
    hideError('login');
    hideError('data');
    // Initial data load or refresh might happen here if needed
}

function showEmailSection() {
    emailSection.style.display = 'block';
    otpSection.style.display = 'none';
    otpInput.value = ''; // Clear OTP input when going back
    stopResendTimer(); // Stop timer if user goes back
}

function showOtpSection() {
    emailSection.style.display = 'none';
    otpSection.style.display = 'block';
    otpInput.focus(); // Focus OTP input
}

// --- API Call Function (using JSONP) ---

function callApi(params, callback) {
    const callbackName = 'jsonpCallback_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    let script = document.createElement('script');

    window[callbackName] = (response) => {
        try {
            callback(null, response); // Call success callback
        } catch (e) {
            console.error("Error in JSONP callback execution:", e);
            callback(new Error("Callback execution failed"));
        } finally {
            // Clean up: remove script tag and global callback function
            delete window[callbackName];
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }
    };

    script.onerror = (e) => {
        console.error("JSONP script load error:", e);
        callback(new Error("API request failed (script load error)"));
        // Clean up on error as well
        delete window[callbackName];
         if (script.parentNode) {
            script.parentNode.removeChild(script);
        }
    };

    const urlParams = new URLSearchParams(params);
    urlParams.append('callback', callbackName);
    script.src = `${API_URL}?${urlParams.toString()}`;

    document.body.appendChild(script);
}


// --- Event Handlers ---

function handleSendOtp(event) {
    event.preventDefault();
    const email = emailInput.value.trim();
    if (!email) {
        showError('Please enter your email address', 'login');
        return;
    }
     if (!/\S+@\S+\.\S+/.test(email)) {
        showError('Please enter a valid email address', 'login');
        return;
    }

    hideError('login');
    setLoading(sendOtpButton, true);

    callApi({ action: 'sendOtp', email: email }, (error, response) => {
        setLoading(sendOtpButton, false);
        if (error || !response) {
             showError(error?.message || 'Network error or invalid response sending OTP. Please try again.', 'login');
             return;
        }

        if (response.status === 'success') {
            showOtpSection();
            startResendTimer();
        } else {
            showError(response.message || 'Failed to send OTP. Check the email or try again later.', 'login');
        }
    });
}

function handleVerifyOtp(event) {
    event.preventDefault();
    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();

    if (!otp) {
        showError('Please enter the OTP', 'login');
        return;
    }
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
         showError('OTP must be 6 digits', 'login');
        return;
    }

    hideError('login');
    setLoading(verifyOtpButton, true);

     callApi({ action: 'verifyOtp', email: email, otp: otp }, (error, response) => {
        setLoading(verifyOtpButton, false);
         if (error || !response) {
             showError(error?.message || 'Network error or invalid response verifying OTP. Please try again.', 'login');
             return;
        }

        if (response.status === 'success' && response.members) {
            allMembers = response.members;
            stopResendTimer();
            currentPage = 1; // Reset to first page on successful login
            currentSort = { column: 'name', direction: 'asc' }; // Reset sort
            resetFilters(); // Clear filters
            resetSortHeaders(); // Clear visual sort indicators
            displayMemberData(); // Display data for the first time
            showDataView(); // Switch to data view
        } else {
            showError(response.message || 'Invalid OTP or verification failed.', 'login');
            otpInput.value = ''; // Clear OTP input on failure
            otpInput.focus();
        }
    });
}

function handleResendOtp() {
    if (resendOtpButton.disabled) return;

    const email = emailInput.value.trim();
    if (!email) {
        showError('Cannot resend OTP without an email address.', 'login'); // Should not happen if flow is correct
        return;
    }

    hideError('login'); // Hide previous errors
    setLoading(resendOtpButton, true); // Show loading on resend button

     callApi({ action: 'sendOtp', email: email }, (error, response) => {
        // We only visually disable the button, loading state is handled internally
        setLoading(resendOtpButton, false);

        if (error || !response) {
             showError(error?.message || 'Network error resending OTP. Please try again.', 'login');
             // Don't restart timer on network error
             resendOtpButton.disabled = false; // Re-enable immediately
             return;
        }

        if (response.status === 'success') {
            showError('OTP resent successfully', 'login'); // Use error display for info message here
            startResendTimer(); // Restart the timer
        } else {
            showError(response.message || 'Failed to resend OTP.', 'login');
             resendOtpButton.disabled = false; // Re-enable immediately
        }
    });
}

function startResendTimer() {
    stopResendTimer(); // Clear any existing interval
    resendCountdown = RESEND_TIMEOUT;
    resendOtpButton.disabled = true;
    updateResendTimer();

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
    if(resendTimer) resendTimer.textContent = '';
}

function updateResendTimer() {
     if(resendTimer) resendTimer.textContent = `(${resendCountdown}s)`;
}

function handleLogout() {
    // Clear state
    allMembers = [];
    currentPage = 1;
    currentSort = { column: 'name', direction: 'asc' };
    emailInput.value = '';
    otpInput.value = '';

    // Reset UI elements in data view before hiding
    resetFilters();
    resetSortHeaders();
    memberDataTable.innerHTML = ''; // Clear table body
    pageInfo.textContent = 'Page 0 of 0';
    prevPageButton.disabled = true;
    nextPageButton.disabled = true;
    noResultsMessage.style.display = 'none';


    // Switch view
    showLoginView();
}

// --- Data Handling Functions ---

function displayMemberData() {
    hideError('data'); // Clear previous data errors
    const filteredMembers = filterMembers();
    const sortedMembers = sortMembers(filteredMembers);

    memberDataTable.innerHTML = ''; // Clear previous table rows

    if (sortedMembers.length === 0) {
        noResultsMessage.style.display = 'block';
        updatePagination(0); // Update pagination to show 0 pages
        return; // Exit if no members match
    }

    noResultsMessage.style.display = 'none';
    const paginatedMembers = paginateMembers(sortedMembers);

    paginatedMembers.forEach(member => {
        const row = document.createElement('tr');
        // Ensure properties exist or provide default '-'
        row.innerHTML = `
            <td>${member.name || '-'}</td>
            <td>${member.plan || '-'}</td>
            <td>${formatDate(member.purchaseDate)}</td>
            <td>${formatDate(member.startDate)}</td>
            <td>${formatDate(member.endDate)}</td>
            <td>${formatCurrency(member.amountPaid)}</td>
        `;
        memberDataTable.appendChild(row);
    });

    updatePagination(sortedMembers.length);
}

function filterMembers() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    // Get date values and ensure they are valid Date objects or null
    let startDate = null;
    let endDate = null;
    try {
        if (startDateInput.value) {
             // Add time to include the selected start date fully
            startDate = new Date(startDateInput.value + 'T00:00:00');
             if (isNaN(startDate.getTime())) startDate = null; // Invalid date input
        }
        if (endDateInput.value) {
             // Add time to include the selected end date fully
            endDate = new Date(endDateInput.value + 'T23:59:59');
            if (isNaN(endDate.getTime())) endDate = null; // Invalid date input
        }
    } catch (e) {
        console.error("Error parsing date filters:", e);
        startDate = null;
        endDate = null;
    }


    return allMembers.filter(member => {
        // Check search term (name or plan)
        const nameMatch = member.name && member.name.toLowerCase().includes(searchTerm);
        const planMatch = member.plan && member.plan.toLowerCase().includes(searchTerm);
        const matchesSearch = nameMatch || planMatch;

        // Check date range based on purchaseDate
        let matchesDateRange = true; // Default to true if no dates selected
        if (startDate || endDate) {
            try {
                const purchaseDate = member.purchaseDate ? new Date(member.purchaseDate) : null;
                 if (!purchaseDate || isNaN(purchaseDate.getTime())) {
                     matchesDateRange = false; // Don't match if purchase date is invalid/missing
                 } else {
                     const afterStartDate = !startDate || purchaseDate >= startDate;
                     const beforeEndDate = !endDate || purchaseDate <= endDate;
                     matchesDateRange = afterStartDate && beforeEndDate;
                 }
            } catch (e) {
                 console.error("Error comparing dates for member:", member.name, e);
                 matchesDateRange = false; // Error comparing dates, exclude member
            }
        }

        return matchesSearch && matchesDateRange;
    });
}

function sortMembers(members) {
    // Create a shallow copy to avoid modifying the original filtered array
    return [...members].sort((a, b) => {
        // Helper to get value, handling potential undefined/null
        const getValue = (obj, key) => obj ? obj[key] : undefined;

        let aValue = getValue(a, currentSort.column);
        let bValue = getValue(b, currentSort.column);

        // Handle Amount Paid (numeric comparison)
        if (currentSort.column === 'amountPaid') {
            const numA = (aValue === null || aValue === undefined) ? -Infinity : Number(aValue);
            const numB = (bValue === null || bValue === undefined) ? -Infinity : Number(bValue);
            return currentSort.direction === 'asc' ? numA - numB : numB - numA;
        }

        // Handle Dates (date comparison)
        if (currentSort.column.includes('Date')) {
            // Treat invalid/missing dates as earliest/latest depending on sort order
            const dateA = aValue ? new Date(aValue) : null;
            const dateB = bValue ? new Date(bValue) : null;

            const timeA = (dateA && !isNaN(dateA.getTime())) ? dateA.getTime() : (currentSort.direction === 'asc' ? Infinity : -Infinity);
            const timeB = (dateB && !isNaN(dateB.getTime())) ? dateB.getTime() : (currentSort.direction === 'asc' ? Infinity : -Infinity);

            return currentSort.direction === 'asc' ? timeA - timeB : timeB - timeA;
        }

        // Handle Strings (locale-aware comparison, treat null/undefined as empty string)
        const strA = String(aValue === null || aValue === undefined ? '' : aValue);
        const strB = String(bValue === null || bValue === undefined ? '' : bValue);

        const comparison = strA.localeCompare(strB, undefined, { sensitivity: 'base' }); // Case-insensitive comparison
        return currentSort.direction === 'asc' ? comparison : -comparison;
    });
}


function paginateMembers(members) {
    const totalItems = members.length;
    const maxPage = Math.ceil(totalItems / ITEMS_PER_PAGE);

     // Ensure currentPage is within valid range
     if (currentPage < 1) currentPage = 1;
     if (currentPage > maxPage && maxPage > 0) currentPage = maxPage;
     // If maxPage is 0 (no items), currentPage should ideally be 0 or 1, handled by updatePagination

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return members.slice(start, end);
}

function handleSort(column) {
    if (!column) return;

    if (currentSort.column === column) {
        // Cycle direction: asc -> desc -> none (optional, removing for simplicity) -> asc
         currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        // If implementing 'none':
        // if (currentSort.direction === 'asc') currentSort.direction = 'desc';
        // else if (currentSort.direction === 'desc') { currentSort.column = null; currentSort.direction = 'asc'; } // Reset sort
        // else { currentSort.column = column; currentSort.direction = 'asc';} // Start asc
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    // Update sort icons and active header class visually
    document.querySelectorAll('th[data-sort]').forEach(th => {
        const icon = th.querySelector('.sort-icon');
        if (!icon) return;

        if (th.dataset.sort === currentSort.column) {
             th.classList.add('sort-active');
            icon.className = `fas ${currentSort.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'} sort-icon`;
        } else {
            th.classList.remove('sort-active');
            icon.className = 'fas fa-sort sort-icon';
        }
    });

    // No need to reset currentPage here, sorting applies to the current view
    // If you want to go to page 1 on sort change, uncomment below:
    // currentPage = 1;
    displayMemberData();
}

function resetSortHeaders() {
     document.querySelectorAll('th[data-sort]').forEach(th => {
        th.classList.remove('sort-active');
        const icon = th.querySelector('.sort-icon');
        if (icon) {
            icon.className = 'fas fa-sort sort-icon';
        }
    });
}

// Debounce function to limit filter calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced version of displayMemberData for input/date changes
const debouncedFilter = debounce(() => {
     currentPage = 1; // Go to first page on filter change
     displayMemberData();
}, 300); // 300ms delay


function changePage(newPage) {
    const filteredMembers = filterMembers(); // Need total count for max page calculation
    const totalItems = filteredMembers.length;
    const maxPage = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1; // Ensure maxPage is at least 1

    if (newPage >= 1 && newPage <= maxPage) {
        currentPage = newPage;
        displayMemberData(); // This will re-filter, re-sort, and re-paginate
    }
}

function updatePagination(totalItems) {
    const maxPage = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1; // Ensure maxPage is at least 1, even if 0 items

    // Adjust current page if it's out of bounds (e.g., after filtering)
    if (currentPage > maxPage) {
        currentPage = maxPage;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }

    pageInfo.textContent = `Page ${currentPage} of ${maxPage}`;
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === maxPage;

     // Handle case with 0 items
     if (totalItems === 0) {
         pageInfo.textContent = 'Page 0 of 0';
         prevPageButton.disabled = true;
         nextPageButton.disabled = true;
     }
}

function resetFilters() {
    searchInput.value = '';
    startDateInput.value = '';
    endDateInput.value = '';
}

// --- Initialization ---

function initialize() {
    // Add Event Listeners
    sendOtpButton?.addEventListener('click', handleSendOtp);
    verifyOtpButton?.addEventListener('click', handleVerifyOtp);
    backToEmailButton?.addEventListener('click', showEmailSection);
    logoutButton?.addEventListener('click', handleLogout);
    resendOtpButton?.addEventListener('click', handleResendOtp);

    // Filter listeners (debounced)
    searchInput?.addEventListener('input', debouncedFilter);
    startDateInput?.addEventListener('change', debouncedFilter);
    endDateInput?.addEventListener('change', debouncedFilter);

    // Pagination listeners
    prevPageButton?.addEventListener('click', () => changePage(currentPage - 1));
    nextPageButton?.addEventListener('click', () => changePage(currentPage + 1));

    // Sort listeners for table headers
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => handleSort(th.dataset.sort));
    });

    // Initial state: Show login view
    showLoginView();
}

// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initialize);
