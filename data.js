// Configuration
const ITEMS_PER_PAGE = 10;

// DOM Elements
const memberDataTable = document.getElementById('member-data');
const searchInput = document.getElementById('search-input');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const logoutButton = document.getElementById('logout');

// State
let allMembers = [];
let currentPage = 1;
let currentSort = { column: 'name', direction: 'asc' };

// Event Listeners
searchInput.addEventListener('input', handleFilter);
startDateInput.addEventListener('change', handleFilter);
endDateInput.addEventListener('change', handleFilter);
prevPageButton.addEventListener('click', () => changePage(currentPage - 1));
nextPageButton.addEventListener('click', () => changePage(currentPage + 1));
logoutButton.addEventListener('click', handleLogout);

// Add sort listeners to table headers
document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => handleSort(th.dataset.sort));
});

// Check if user is authenticated
function checkAuth() {
    const memberData = sessionStorage.getItem('memberData');
    if (!memberData) {
        window.location.href = 'login.html';
        return;
    }
    allMembers = JSON.parse(memberData);
    displayMemberData();
}

// Functions
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
        currency: 'USD'
    }).format(amount);
}

function handleLogout() {
    sessionStorage.removeItem('memberData');
    window.location.href = 'login.html';
}

// Initialize
checkAuth(); 