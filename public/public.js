// Global variables
let allSchedules = [];
let allUmpireRequests = [];
let allConcessionStaffRequests = [];
let filterOptions = {};
let currentFilters = {};
let filteredSchedules = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadSchedules();
    loadUmpireRequests();
    loadConcessionStaffRequests();
    loadFilterOptions();
    setupEventListeners();
    
    // Add 3D effects after DOM loads
    setTimeout(add3DEffects, 1000);
    
    // Update stats after schedules load
    if (typeof loadSchedules === 'function') {
        const originalLoadSchedules = loadSchedules;
        loadSchedules = function() {
            originalLoadSchedules.apply(this, arguments);
            setTimeout(updateStats, 500);
        };
    }
    
    // Set up periodic refresh to show real-time updates
    setInterval(() => {
        loadSchedules();
        loadUmpireRequests();
        loadConcessionStaffRequests();
    }, 30000); // Refresh every 30 seconds
});

// Setup event listeners
function setupEventListeners() {
    // Umpire request form submission
    const umpireRequestForm = document.getElementById('umpireRequestFormElement');
    if (umpireRequestForm) {
        umpireRequestForm.addEventListener('submit', handleUmpireRequest);
    }
    
    // Concession staff request form submission
    const concessionStaffRequestForm = document.getElementById('concessionStaffRequestFormElement');
    if (concessionStaffRequestForm) {
        concessionStaffRequestForm.addEventListener('submit', handleConcessionStaffRequest);
    }
    
    // Filter toggle button
    const filterToggleBtn = document.querySelector('.filter-toggle');
    if (filterToggleBtn) {
        filterToggleBtn.addEventListener('click', toggleFilters);
    }
    
    // Live search input
    const liveSearchInput = document.getElementById('liveSearchInput');
    if (liveSearchInput) {
        liveSearchInput.addEventListener('input', handleLiveSearch);
        liveSearchInput.addEventListener('keyup', handleLiveSearch);
        console.log('✅ Live search listener added');
    }
    
    // Filter change events for immediate filtering
    const filterElements = [
        'seasonFilter', 'eventTypeFilter', 'dayFilter', 'divisionFilter',
        'teamFilter', 'venueFilter', 'coachFilter', 'plateUmpireFilter', 'baseUmpireFilter',
        'concessionFilter', 'concessionStaffFilter', 'dateFilter', 'timeFilter'
    ];
    
    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                console.log(`🔍 Filter changed: ${id} = ${element.value}`);
                applyFilters();
            });
        }
    });
}

// Load all schedules
async function loadSchedules() {
    try {
        const response = await fetch('/api/schedules');
        if (!response.ok) throw new Error('Failed to fetch schedules');
        
        allSchedules = await response.json();
        filteredSchedules = [...allSchedules];
        renderScheduleTable();
    } catch (error) {
        console.error('Error loading schedules:', error);
        showAlert('Error loading schedules. Please try again.', 'danger');
    }
}

// Load filter options
async function loadFilterOptions() {
    try {
        const [filtersResponse, staffResponse] = await Promise.all([
            fetch('/api/filters'),
            fetch('/api/staff-names')
        ]);
        
        if (!filtersResponse.ok) throw new Error('Failed to fetch filter options');
        if (!staffResponse.ok) throw new Error('Failed to fetch staff options');
        
        filterOptions = await filtersResponse.json();
        const staffData = await staffResponse.json();
        
        // Add staff names to filter options
        filterOptions.concession_staff = staffData;
        
        populateFilterDropdowns();
        populateRequestDropdowns();
    } catch (error) {
        console.error('Error loading filter options:', error);
        // Initialize empty filter options to prevent errors
        filterOptions = {};
    }
}

// Populate filter dropdowns
function populateFilterDropdowns() {
    if (!filterOptions) {
        console.log('No filter options available yet');
        return;
    }

    const filterMappings = {
        'seasonFilter': 'season',
        'eventTypeFilter': 'event_type',
        'dayFilter': 'day',
        'divisionFilter': 'division',
        'teamFilter': 'home_team',
        'venueFilter': 'venue',
        'coachFilter': 'home_coach',
        'plateUmpireFilter': 'plate_umpire',
        'baseUmpireFilter': 'base_umpire',
        'concessionFilter': 'concession_stand',
        'concessionStaffFilter': 'concession_staff'
    };

    Object.entries(filterMappings).forEach(([elementId, filterKey]) => {
        const element = document.getElementById(elementId);
        if (element && filterOptions[filterKey]) {
            // Clear existing options except the first one
            const firstOption = element.querySelector('option');
            element.innerHTML = firstOption ? firstOption.outerHTML : '<option value="">All</option>';
            
            // Add new options
            filterOptions[filterKey].forEach(option => {
                if (option && option.trim() !== '') {
                    const optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    element.appendChild(optionElement);
                }
            });
        }
    });

    // Populate time filter with common times
    const timeFilter = document.getElementById('timeFilter');
    if (timeFilter) {
        const commonTimes = ['6:00', '6:30', '7:00', '7:30', '8:00', '8:30', '9:00', '9:30', '10:00', '10:30'];
        commonTimes.forEach(time => {
            const optionElement = document.createElement('option');
            optionElement.value = time;
            optionElement.textContent = time;
            timeFilter.appendChild(optionElement);
        });
    }
}

// Populate request form dropdowns
function populateRequestDropdowns() {
    try {
        // Get staff names for umpire requests
        const staffNames = filterOptions.concession_staff || [];
        
        // Populate plate umpire dropdown
        const plateUmpireSelect = document.getElementById('requestedPlateUmpire');
        if (plateUmpireSelect) {
            plateUmpireSelect.innerHTML = '<option value="">No change</option>';
            staffNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                plateUmpireSelect.appendChild(option);
            });
        }
        
        // Populate base umpire dropdown
        const baseUmpireSelect = document.getElementById('requestedBaseUmpire');
        if (baseUmpireSelect) {
            baseUmpireSelect.innerHTML = '<option value="">No change</option>';
            staffNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                baseUmpireSelect.appendChild(option);
            });
        }
        
        // Populate concession staff dropdown
        const concessionStaffSelect = document.getElementById('requestedConcessionStaff');
        if (concessionStaffSelect) {
            concessionStaffSelect.innerHTML = '<option value="">Select Staff Member</option>';
            staffNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                concessionStaffSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error populating request dropdowns:', error);
    }
}

// Live search functionality
function handleLiveSearch() {
    const searchInput = document.getElementById('liveSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    if (searchTerm === '') {
        // If no search term, apply only the filter dropdowns
        applyFilters();
        updateSearchResults('');
        return;
    }
    
    console.log(`🔍 Live search for: "${searchTerm}"`);
    
    // Search across all schedule fields
    filteredSchedules = allSchedules.filter(schedule => {
        const searchableFields = [
            schedule.season,
            schedule.event_type,
            schedule.day,
            schedule.division,
            schedule.home_team,
            schedule.visitor_team,
            schedule.venue,
            schedule.home_coach,
            schedule.visitor_coach,
            schedule.plate_umpire,
            schedule.base_umpire,
            schedule.concession_stand,
            schedule.concession_staff,
            schedule.date,
            schedule.start_time,
            schedule.am_pm
        ];
        
        return searchableFields.some(field => 
            field && field.toString().toLowerCase().includes(searchTerm)
        );
    });
    
    // Also apply any active dropdown filters
    const activeFilters = getActiveFilters();
    if (Object.keys(activeFilters).length > 0) {
        filteredSchedules = filteredSchedules.filter(schedule => 
            matchesFilters(schedule, activeFilters)
        );
    }
    
    updateSearchResults(searchTerm);
    renderScheduleTable();
}

// Get active filters from dropdowns
function getActiveFilters() {
    const filters = {};
    const filterMappings = {
        'seasonFilter': 'season',
        'eventTypeFilter': 'event_type',
        'dayFilter': 'day',
        'divisionFilter': 'division',
        'teamFilter': 'team',
        'venueFilter': 'venue',
        'coachFilter': 'coach',
        'plateUmpireFilter': 'plate_umpire',
        'baseUmpireFilter': 'base_umpire',
        'concessionFilter': 'concession_stand',
        'concessionStaffFilter': 'concession_staff',
        'dateFilter': 'date',
        'timeFilter': 'start_time'
    };
    
    Object.entries(filterMappings).forEach(([elementId, fieldName]) => {
        const element = document.getElementById(elementId);
        if (element && element.value) {
            filters[fieldName] = element.value;
        }
    });
    
    return filters;
}

// Check if schedule matches filters
function matchesFilters(schedule, filters) {
    return Object.entries(filters).every(([key, value]) => {
        switch (key) {
            case 'season':
                return schedule.season === value;
            case 'event_type':
                return schedule.event_type === value;
            case 'day':
                return schedule.day === value;
            case 'division':
                return schedule.division === value;
            case 'team':
                return schedule.home_team === value || schedule.visitor_team === value;
            case 'venue':
                return schedule.venue === value;
            case 'coach':
                return schedule.home_coach === value || schedule.visitor_coach === value;
            case 'plate_umpire':
                return schedule.plate_umpire === value;
            case 'base_umpire':
                return schedule.base_umpire === value;
            case 'concession_stand':
                return schedule.concession_stand === value;
            case 'concession_staff':
                return schedule.concession_staff === value;
            case 'date':
                return schedule.date === value;
            case 'start_time':
                return schedule.start_time === value;
            default:
                return true;
        }
    });
}

// Apply filters (improved version)
function applyFilters() {
    const activeFilters = getActiveFilters();
    const searchInput = document.getElementById('liveSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    console.log('🔍 Applying filters:', activeFilters);
    console.log('🔍 Search term:', searchTerm);
    
    // Start with all schedules
    filteredSchedules = [...allSchedules];
    
    // Apply search term first
    if (searchTerm) {
        filteredSchedules = filteredSchedules.filter(schedule => {
            const searchableFields = [
                schedule.season, schedule.event_type, schedule.day, schedule.division,
                schedule.home_team, schedule.visitor_team, schedule.venue,
                schedule.home_coach, schedule.visitor_coach,
                schedule.plate_umpire, schedule.base_umpire,
                schedule.concession_stand, schedule.concession_staff,
                schedule.date, schedule.start_time, schedule.am_pm
            ];
            
            return searchableFields.some(field => 
                field && field.toString().toLowerCase().includes(searchTerm)
            );
        });
    }
    
    // Apply dropdown filters
    if (Object.keys(activeFilters).length > 0) {
        filteredSchedules = filteredSchedules.filter(schedule => 
            matchesFilters(schedule, activeFilters)
        );
    }
    
    updateActiveFilterCount();
    updateSearchResults(searchTerm);
    
    // Show/hide "No Results" banner
    showNoResultsBanner();
    
    renderScheduleTable();
    
    console.log(`✅ Filtered ${filteredSchedules.length} schedules from ${allSchedules.length} total`);
}

// Show or hide the "No Results" banner
function showNoResultsBanner() {
    const bannerContainer = document.getElementById('noResultsBanner');
    if (!bannerContainer) return;
    
    // Check if any filters are active
    const activeFilters = getActiveFilters();
    const searchInput = document.getElementById('liveSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchTerm;
    
    if (hasActiveFilters && filteredSchedules.length === 0) {
        // Show banner when filters are active but return no results
        const filterDetails = [];
        Object.entries(activeFilters).forEach(([key, value]) => {
            if (value) {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                filterDetails.push(`${label}: ${value}`);
            }
        });
        if (searchTerm) filterDetails.push(`Search: "${searchTerm}"`);
        
        bannerContainer.innerHTML = `
            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                <div class="d-flex align-items-center">
                    <i class="fas fa-exclamation-triangle fa-2x me-3 text-warning"></i>
                    <div class="flex-grow-1">
                        <h5 class="alert-heading mb-2">No Results Found!</h5>
                        <p class="mb-2">Your current filter criteria returned no matching schedules.</p>
                        <div class="mb-3">
                            <strong>Active Filters:</strong>
                            ${filterDetails.map(filter => `<span class="badge bg-warning text-dark me-2">${filter}</span>`).join('')}
                        </div>
                        <div class="d-flex gap-2 flex-wrap">
                            <button class="btn btn-warning btn-sm" onclick="clearAllFilters()">
                                <i class="fas fa-times me-2"></i>Clear All Filters
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="showAllSchedules()">
                                <i class="fas fa-eye me-2"></i>View All Schedules
                            </button>
                        </div>
                    </div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        bannerContainer.style.display = 'block';
    } else {
        // Hide banner when there are results or no filters
            bannerContainer.style.display = 'none';
}

// Show all schedules (helper function for banner)
function showAllSchedules() {
    clearAllFilters();
    // Scroll to top of schedule table
    const scheduleTable = document.querySelector('.schedule-table');
    if (scheduleTable) {
        scheduleTable.scrollIntoView({ behavior: 'smooth' });
    }
}
}

// Clear all filters and search
function clearAllFilters() {
    // Clear search input
    const searchInput = document.getElementById('liveSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Clear all filter dropdowns
    const filterElements = [
        'seasonFilter', 'eventTypeFilter', 'dayFilter', 'divisionFilter',
        'teamFilter', 'venueFilter', 'coachFilter', 'plateUmpireFilter', 'baseUmpireFilter',
        'concessionFilter', 'concessionStaffFilter', 'dateFilter', 'timeFilter'
    ];
    
    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
    
    filteredSchedules = [...allSchedules];
    updateActiveFilterCount();
    updateSearchResults('');
    
    // Hide the no results banner
    showNoResultsBanner();
    
    renderScheduleTable();
    
    console.log('🗑️ All filters and search cleared');
}

// Clear filters (legacy function for compatibility)
function clearFilters() {
    clearAllFilters();
}

// Clear only live search
function clearLiveSearch() {
    const searchInput = document.getElementById('liveSearchInput');
    if (searchInput) {
        searchInput.value = '';
        handleLiveSearch(); // Reapply filters without search
    }
}

// Update search results display
function updateSearchResults(searchTerm) {
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return;
    
    if (searchTerm) {
        const total = allSchedules.length;
        const filtered = filteredSchedules.length;
        resultsDiv.innerHTML = `Found ${filtered} of ${total} schedules matching "${searchTerm}"`;
        resultsDiv.className = 'mt-2 text-success small';
    } else {
        resultsDiv.innerHTML = '';
    }
}

// Update active filter count
function updateActiveFilterCount() {
    const countElement = document.getElementById('activeFilterCount');
    if (!countElement) return;
    
    const activeFilters = getActiveFilters();
    const searchInput = document.getElementById('liveSearchInput');
    const hasSearch = searchInput && searchInput.value.trim() !== '';
    
    let count = Object.keys(activeFilters).length;
    if (hasSearch) count++;
    
    countElement.textContent = count;
}

// Show active filters
function showActiveFilters() {
    const activeFilters = getActiveFilters();
    const searchInput = document.getElementById('liveSearchInput');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    
    let message = 'Active Filters:\\n';
    
    if (searchTerm) {
        message += `• Search: "${searchTerm}"\\n`;
    }
    
    if (Object.keys(activeFilters).length === 0 && !searchTerm) {
        message = 'No active filters or search terms.';
    } else {
        Object.entries(activeFilters).forEach(([key, value]) => {
            const displayName = key.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase());
            message += `• ${displayName}: ${value}\\n`;
        });
    }
    
    alert(message);
}

// Toggle advanced filters section
function toggleAdvancedFilters() {
    const filtersDiv = document.getElementById('advancedFilters');
    const icon = document.getElementById('advancedToggleIcon');
    const text = document.getElementById('advancedToggleText');
    
    if (!filtersDiv || !icon || !text) return;
    
    const isVisible = filtersDiv.style.display !== 'none';
    
    if (isVisible) {
        filtersDiv.style.display = 'none';
        icon.className = 'fas fa-chevron-down me-1';
        text.textContent = 'Show Filters';
    } else {
        filtersDiv.style.display = 'block';
        icon.className = 'fas fa-chevron-up me-1';
        text.textContent = 'Hide Filters';
    }
}

// Toggle filters section
function toggleFilters() {
    const filterSection = document.getElementById('filterSection');
    if (filterSection) {
        const isVisible = filterSection.style.display !== 'none';
        filterSection.style.display = isVisible ? 'none' : 'block';
        
        const toggleBtn = document.querySelector('.filter-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = isVisible ? 
                '<i class="fas fa-filter me-2"></i>Show Filters' : 
                '<i class="fas fa-filter me-2"></i>Hide Filters';
        }
    }
}

// Render schedule table
function renderScheduleTable() {
    const tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;
    
    const schedulesToShow = filteredSchedules.length > 0 ? filteredSchedules : allSchedules;
    
    if (schedulesToShow.length === 0) {
        // Check if filters are active
        const activeFilters = getActiveFilters();
        const searchInput = document.getElementById('liveSearchInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchTerm;
        
        if (hasActiveFilters) {
            // Show enhanced message when filters return no results
            const filterDetails = [];
            Object.entries(activeFilters).forEach(([key, value]) => {
                if (value) {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    filterDetails.push(`${label}: ${value}`);
                }
            });
            if (searchTerm) filterDetails.push(`Search: "${searchTerm}"`);
            
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" class="no-data text-center">
                        <div class="py-5">
                            <i class="fas fa-search fa-3x text-warning mb-4"></i>
                            <h4 class="text-warning mb-3">No Results Found</h4>
                            <h6 class="text-muted mb-3">No schedules match your current filter criteria</h6>
                            <p class="text-muted mb-3">Active filters:</p>
                            <div class="mb-4">
                                ${filterDetails.map(filter => `<span class="badge bg-warning text-dark me-2 mb-2">${filter}</span>`).join('')}
                            </div>
                            <div class="d-flex gap-2 justify-content-center flex-wrap">
                                <button class="btn btn-warning btn-lg" onclick="clearAllFilters()">
                                    <i class="fas fa-times me-2"></i>Clear All Filters
                                </button>
                                <button class="btn btn-outline-secondary btn-lg" onclick="showAllSchedules()">
                                    <i class="fas fa-eye me-2"></i>View All Schedules
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            // Show simple message when no schedules exist in database
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" class="no-data text-center">
                        <div class="py-4">
                            <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">No schedules found in the database</h5>
                        </div>
                    </td>
                </tr>
            `;
        }
        return;
    }
    
    tbody.innerHTML = schedulesToShow.map(schedule => `
        <tr>
            <td><span class="badge bg-primary">${schedule.season || 'N/A'}</span></td>
            <td><span class="badge ${schedule.event_type === 'Baseball' ? 'bg-success' : 'bg-warning'}">${schedule.event_type || 'N/A'}</span></td>
            <td><strong>${schedule.day || 'N/A'}</strong></td>
            <td>${formatDate(schedule.date)}</td>
            <td>${schedule.start_time || 'N/A'} ${schedule.am_pm || ''}</td>
            <td><span class="badge bg-info">${schedule.division || 'N/A'}</span></td>
            <td>
                <div><strong>${schedule.home_team || 'N/A'}</strong></div>
                <small class="text-muted">${schedule.home_coach || 'N/A'}</small>
            </td>
            <td>
                <div><strong>${schedule.visitor_team || 'N/A'}</strong></div>
                <small class="text-muted">${schedule.visitor_coach || 'N/A'}</small>
            </td>
            <td>${schedule.venue || 'N/A'}</td>
            <td>
                <div><strong>Plate:</strong> ${schedule.plate_umpire || 'N/A'}</div>
                <div><strong>Base:</strong> ${schedule.base_umpire || 'N/A'}</div>
            </td>
            <td>
                <div>
                    ${schedule.concession_stand === 'No Concession' ? 
                        '<span class="badge bg-secondary">No Concession</span>' : 
                        schedule.concession_stand ? 
                            `<span class="badge bg-success">${schedule.concession_stand}</span>` :
                            '<span class="badge bg-secondary">No Info</span>'
                    }
                </div>
                ${schedule.concession_staff ? `<br><small class="text-muted">${schedule.concession_staff}</small>` : ''}
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="showUmpireRequestForm(${schedule.id})">
                    <i class="fas fa-edit"></i>Umpire
                </button>
                <button class="btn btn-sm btn-outline-info" onclick="showConcessionStaffRequestForm(${schedule.id})">
                    <i class="fas fa-user-edit"></i>Staff
                </button>
            </td>
        </tr>
    `).join('');
}

// Load umpire requests
async function loadUmpireRequests() {
    try {
        const response = await fetch('/api/umpire-requests');
        if (!response.ok) throw new Error('Failed to fetch umpire requests');
        
        allUmpireRequests = await response.json();
    } catch (error) {
        console.error('Error loading umpire requests:', error);
    }
}

// Load concession staff requests
async function loadConcessionStaffRequests() {
    try {
        const response = await fetch('/api/concession-staff-requests');
        if (!response.ok) throw new Error('Failed to fetch concession staff requests');
        
        allConcessionStaffRequests = await response.json();
    } catch (error) {
        console.error('Error loading concession staff requests:', error);
    }
}

// Show umpire request form
function showUmpireRequestForm(gameId) {
    const schedule = allSchedules.find(s => s.id === gameId);
    if (!schedule) return;
    
    // Populate form fields
    document.getElementById('requestGameId').value = gameId;
    document.getElementById('gameDetails').textContent = `${schedule.home_team} vs ${schedule.visitor_team} on ${formatDate(schedule.date)} at ${schedule.start_time}`;
    document.getElementById('currentUmpires').textContent = `Plate: ${schedule.plate_umpire || 'N/A'}, Base: ${schedule.base_umpire || 'N/A'}`;
    
    // Show form
    document.getElementById('umpireRequestForm').style.display = 'block';
    
    // Scroll to form
    document.getElementById('umpireRequestForm').scrollIntoView({ behavior: 'smooth' });
}

// Hide umpire request form
function hideUmpireRequestForm() {
    document.getElementById('umpireRequestForm').style.display = 'none';
    document.getElementById('umpireRequestFormElement').reset();
}

// Handle umpire request
async function handleUmpireRequest(e) {
    e.preventDefault();
    
    const formData = {
        game_id: document.getElementById('requestGameId').value,
        current_plate_umpire: document.getElementById('currentUmpires').textContent.split('Plate: ')[1]?.split(',')[0] || '',
        current_base_umpire: document.getElementById('currentUmpires').textContent.split('Base: ')[1] || '',
        requested_plate_umpire: document.getElementById('requestedPlateUmpire').value,
        requested_base_umpire: document.getElementById('requestedBaseUmpire').value,
        reason: document.getElementById('changeReason').value
    };
    
    try {
        const response = await fetch('/api/umpire-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to submit umpire request');
        
        showAlert('Umpire change request submitted successfully!', 'success');
        hideUmpireRequestForm();
        
        // Reload both requests and schedules to show updates
        await Promise.all([
            loadUmpireRequests(),
            loadSchedules()
        ]);
    } catch (error) {
        console.error('Error submitting umpire request:', error);
        showAlert('Error submitting umpire request. Please try again.', 'danger');
    }
}

// Show concession staff request form
function showConcessionStaffRequestForm(gameId) {
    const schedule = allSchedules.find(s => s.id === gameId);
    if (!schedule) return;
    
    // Populate form fields
    document.getElementById('concessionRequestGameId').value = gameId;
    document.getElementById('concessionGameDetails').textContent = `${schedule.home_team} vs ${schedule.visitor_team} on ${formatDate(schedule.date)} at ${schedule.start_time}`;
    document.getElementById('currentConcessionStaff').textContent = schedule.concession_staff || 'No staff assigned';
    
    // Show form
    document.getElementById('concessionStaffRequestForm').style.display = 'block';
    
    // Scroll to form
    document.getElementById('concessionStaffRequestForm').scrollIntoView({ behavior: 'smooth' });
}

// Hide concession staff request form
function hideConcessionStaffRequestForm() {
    document.getElementById('concessionStaffRequestForm').style.display = 'none';
    document.getElementById('concessionStaffRequestFormElement').reset();
}

// Handle concession staff request
async function handleConcessionStaffRequest(e) {
    e.preventDefault();
    
    const formData = {
        game_id: document.getElementById('concessionRequestGameId').value,
        current_concession_staff: document.getElementById('currentConcessionStaff').textContent,
        requested_concession_staff: document.getElementById('requestedConcessionStaff').value,
        reason: document.getElementById('concessionChangeReason').value
    };
    
    try {
        const response = await fetch('/api/concession-staff-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to submit concession staff request');
        
        showAlert('Concession staff change request submitted successfully!', 'success');
        hideConcessionStaffRequestForm();
        
        // Reload both requests and schedules to show updates
        await Promise.all([
            loadConcessionStaffRequests(),
            loadSchedules()
        ]);
    } catch (error) {
        console.error('Error submitting concession staff request:', error);
        showAlert('Error submitting concession staff request. Please try again.', 'danger');
    }
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Enhanced 3D UI Functions
function updateStats() {
    // Update total games
    const totalGames = document.getElementById('totalGames');
    if (totalGames && allSchedules) {
        totalGames.textContent = allSchedules.length;
    }
    
    // Update total teams
    const totalTeams = document.getElementById('totalTeams');
    if (totalTeams && allSchedules) {
        const uniqueTeams = new Set([
            ...allSchedules.map(s => s.home_team).filter(Boolean),
            ...allSchedules.map(s => s.visitor_team).filter(Boolean)
        ]);
        totalTeams.textContent = uniqueTeams.size;
    }
    
    // Update total venues
    const totalVenues = document.getElementById('totalVenues');
    if (totalVenues && allSchedules) {
        const uniqueVenues = new Set(allSchedules.map(s => s.venue).filter(Boolean));
        totalVenues.textContent = uniqueVenues.size;
    }
    
    // Update total concessions
    const totalConcessions = document.getElementById('totalConcessions');
    if (totalConcessions && allSchedules) {
        const uniqueConcessions = new Set(allSchedules.map(s => s.concession_stand).filter(Boolean));
        totalConcessions.textContent = uniqueConcessions.size;
    }
}

// Add 3D hover effects to cards
function add3DEffects() {
    const cards = document.querySelectorAll('.admin-card, .filter-section, .schedule-table');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02) rotateX(2deg)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1) rotateX(0deg)';
        });
    });
}

// Enhanced theme toggle with 3D effects
function initEnhancedTheme() {
    try {
        const saved = localStorage.getItem('theme') || 'light';
        if (saved === 'dark') document.documentElement.classList.add('theme-dark');
        
        const nav = document.querySelector('.navbar .container');
        if (nav) {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-primary btn-sm shadow-3d';
            btn.type = 'button';
            btn.style.marginLeft = 'auto';
            btn.innerHTML = '<i class="fas fa-moon me-1"></i>Theme';
            btn.onclick = () => {
                document.documentElement.classList.toggle('theme-dark');
                const dark = document.documentElement.classList.contains('theme-dark');
                localStorage.setItem('theme', dark ? 'dark' : 'light');
                
                // Add 3D effect to button
                btn.style.transform = 'scale(1.1) rotateY(180deg)';
                setTimeout(() => {
                    btn.style.transform = 'scale(1) rotateY(0deg)';
                }, 300);
            };
            nav.appendChild(btn);
        }
    } catch (e) { 
        console.warn('Enhanced theme init failed', e); 
    }
}

// Initialize enhanced theme
initEnhancedTheme(); 