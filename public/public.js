// Global variables
let allSchedules = [];
let filteredSchedules = [];
let filterOptions = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadSchedules();
    loadFilterOptions();
    setupEventListeners();
    updateFilterStatus();
});

// Setup event listeners
function setupEventListeners() {
    // Umpire request form submission
    document.getElementById('umpireRequestFormElement').addEventListener('submit', handleUmpireRequest);
    
    // Filter change events
    const filterElements = [
        'seasonFilter', 'eventTypeFilter', 'dayFilter', 'divisionFilter',
        'homeTeamFilter', 'visitorTeamFilter', 'venueFilter', 'homeCoachFilter',
        'visitorCoachFilter', 'plateUmpireFilter', 'baseUmpireFilter',
        'concessionStandFilter', 'concessionStaffFilter', 'dateFilter', 'timeFilter'
    ];
    
    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', applyFilters);
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
        filterOptions.concession_staff = staffData.map(staff => staff.name);
        
        populateFilterDropdowns();
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
        'homeTeamFilter': 'home_team',
        'visitorTeamFilter': 'visitor_team',
        'venueFilter': 'venue',
        'homeCoachFilter': 'home_coach',
        'visitorCoachFilter': 'visitor_coach',
        'plateUmpireFilter': 'plate_umpire',
        'baseUmpireFilter': 'base_umpire',
        'concessionStandFilter': 'concession_stand',
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

// Apply filters
function applyFilters() {
    const filters = {
        season: document.getElementById('seasonFilter')?.value || '',
        eventType: document.getElementById('eventTypeFilter')?.value || '',
        day: document.getElementById('dayFilter')?.value || '',
        division: document.getElementById('divisionFilter')?.value || '',
        homeTeam: document.getElementById('homeTeamFilter')?.value || '',
        visitorTeam: document.getElementById('visitorTeamFilter')?.value || '',
        venue: document.getElementById('venueFilter')?.value || '',
        homeCoach: document.getElementById('homeCoachFilter')?.value || '',
        visitorCoach: document.getElementById('visitorCoachFilter')?.value || '',
        plateUmpire: document.getElementById('plateUmpireFilter')?.value || '',
        baseUmpire: document.getElementById('baseUmpireFilter')?.value || '',
        concessionStand: document.getElementById('concessionStandFilter')?.value || '',
        concessionStaff: document.getElementById('concessionStaffFilter')?.value || '',
        date: document.getElementById('dateFilter')?.value || '',
        time: document.getElementById('timeFilter')?.value || ''
    };

    filteredSchedules = allSchedules.filter(schedule => {
        return Object.entries(filters).every(([key, value]) => {
            if (!value) return true; // No filter applied
            
            switch (key) {
                case 'season':
                    return schedule.season === value;
                case 'eventType':
                    return schedule.event_type === value;
                case 'day':
                    return schedule.day === value;
                case 'division':
                    return schedule.division === value;
                case 'homeTeam':
                    return schedule.home_team === value;
                case 'visitorTeam':
                    return schedule.visitor_team === value;
                case 'venue':
                    return schedule.venue === value;
                case 'homeCoach':
                    return schedule.home_coach === value;
                case 'visitorCoach':
                    return schedule.visitor_coach === value;
                case 'plateUmpire':
                    return schedule.plate_umpire === value;
                case 'baseUmpire':
                    return schedule.base_umpire === value;
                case 'concessionStand':
                    if (value === 'No Concession') {
                        return schedule.concession_stand === 'No Concession';
                    } else if (value) {
                        return schedule.concession_stand === value;
                    }
                    return true;
                case 'concessionStaff':
                    if (value) {
                        return schedule.concession_staff === value;
                    }
                    return true;
                case 'date':
                    return schedule.date === value;
                case 'time':
                    return schedule.start_time === value;
                default:
                    return true;
            }
        });
    });

    renderScheduleTable();
    updateFilterStatus();
}

// Clear all filters
function clearFilters() {
    const filterElements = [
        'seasonFilter', 'eventTypeFilter', 'dayFilter', 'divisionFilter',
        'homeTeamFilter', 'visitorTeamFilter', 'venueFilter', 'homeCoachFilter',
        'visitorCoachFilter', 'plateUmpireFilter', 'baseUmpireFilter',
        'concessionStandFilter', 'concessionStaffFilter', 'dateFilter', 'timeFilter'
    ];
    
    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    
    filteredSchedules = [...allSchedules];
    renderScheduleTable();
    updateFilterStatus();
}

// Render schedule table
function renderScheduleTable() {
    const tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;
    
    if (filteredSchedules.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="no-data">
                    <i class="fas fa-info-circle me-2"></i>No schedules found matching your filters.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredSchedules.map(schedule => `
        <tr>
            <td><span class="badge bg-primary">${schedule.season || 'N/A'}</span></td>
            <td>
                <span class="badge ${schedule.event_type === 'Baseball' ? 'bg-success' : 'bg-warning'}">
                    ${schedule.event_type || 'N/A'}
                </span>
            </td>
            <td><strong>${schedule.day || 'N/A'}</strong></td>
            <td>${formatDate(schedule.date)}</td>
            <td>${schedule.start_time || 'N/A'} ${schedule.am_pm || ''}</td>
            <td><span class="badge bg-info">${schedule.division || 'N/A'}</span></td>
            <td>
                <div><strong>${schedule.home_team || 'N/A'}</strong></div>
                <small class="text-muted">Coach: ${schedule.home_coach || 'N/A'}</small>
            </td>
            <td>
                <div><strong>${schedule.visitor_team || 'N/A'}</strong></div>
                <small class="text-muted">Coach: ${schedule.visitor_coach || 'N/A'}</small>
            </td>
            <td>${schedule.venue || 'N/A'}</td>
            <td>
                <div><strong>Plate:</strong> ${schedule.plate_umpire || 'N/A'}</div>
                <div><strong>Base:</strong> ${schedule.base_umpire || 'N/A'}</div>
            </td>
            <td>
                <div class="concession-info">
                    ${schedule.concession_stand === 'No Concession' ? 
                        '<span class="badge bg-secondary">No Concession</span>' : 
                        schedule.concession_stand ? 
                            `<span class="badge bg-success">${schedule.concession_stand}</span>` :
                            '<span class="badge bg-secondary">No Info</span>'
                    }
                    ${schedule.concession_staff ? 
                        `<div class="staff-info mt-1">
                            <i class="fas fa-user me-1"></i>
                            <strong>Staff:</strong> ${schedule.concession_staff}
                        </div>` : 
                        schedule.concession_stand && schedule.concession_stand !== 'No Concession' ?
                            `<div class="staff-info mt-1">
                                <i class="fas fa-user me-1"></i>
                                <span class="text-muted">Staff: TBD</span>
                            </div>` : ''
                    }
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="showUmpireRequestForm(${schedule.id})">
                    <i class="fas fa-edit me-1"></i>Request Change
                </button>
            </td>
        </tr>
    `).join('');
}

// Format date for display
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

// Show umpire request form
function showUmpireRequestForm(gameId) {
    try {
        const schedule = allSchedules.find(s => s.id === gameId);
        if (!schedule) {
            showAlert('Game not found.', 'danger');
            return;
        }

        // Populate form fields
        const requestGameId = document.getElementById('requestGameId');
        const gameDetails = document.getElementById('gameDetails');
        const currentUmpires = document.getElementById('currentUmpires');
        
        if (requestGameId) requestGameId.value = gameId;
        
        if (gameDetails) {
            gameDetails.innerHTML = `
                <strong>${schedule.home_team || 'N/A'} vs ${schedule.visitor_team || 'N/A'}</strong><br>
                ${schedule.date || 'N/A'} at ${schedule.start_time || 'N/A'} ${schedule.am_pm || ''}<br>
                ${schedule.venue || 'N/A'} - ${schedule.division || 'N/A'}
            `;
        }
        
        if (currentUmpires) {
            currentUmpires.innerHTML = `
                <strong>Plate:</strong> ${schedule.plate_umpire || 'N/A'}<br>
                <strong>Base:</strong> ${schedule.base_umpire || 'N/A'}
            `;
        }
        
        // Clear previous values
        const requestedPlateUmpire = document.getElementById('requestedPlateUmpire');
        const requestedBaseUmpire = document.getElementById('requestedBaseUmpire');
        const changeReason = document.getElementById('changeReason');
        
        if (requestedPlateUmpire) requestedPlateUmpire.value = '';
        if (requestedBaseUmpire) requestedBaseUmpire.value = '';
        if (changeReason) changeReason.value = '';
        
        // Show form
        const umpireRequestForm = document.getElementById('umpireRequestForm');
        if (umpireRequestForm) {
            umpireRequestForm.style.display = 'block';
            // Scroll to form
            umpireRequestForm.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error showing umpire request form:', error);
        showAlert('Error showing umpire request form.', 'danger');
    }
}

// Hide umpire request form
function hideUmpireRequestForm() {
    try {
        const umpireRequestForm = document.getElementById('umpireRequestForm');
        if (umpireRequestForm) {
            umpireRequestForm.style.display = 'none';
        }
    } catch (error) {
        console.error('Error hiding umpire request form:', error);
    }
}

// Handle umpire request submission
async function handleUmpireRequest(event) {
    event.preventDefault();
    
    const gameId = document.getElementById('requestGameId').value;
    const schedule = allSchedules.find(s => s.id === parseInt(gameId));
    if (!schedule) return;

    const formData = {
        game_id: parseInt(gameId),
        current_plate_umpire: schedule.plate_umpire,
        current_base_umpire: schedule.base_umpire,
        requested_plate_umpire: document.getElementById('requestedPlateUmpire').value || null,
        requested_base_umpire: document.getElementById('requestedBaseUmpire').value || null,
        reason: document.getElementById('changeReason').value
    };

    // Validate that at least one umpire change is requested
    if (!formData.requested_plate_umpire && !formData.requested_base_umpire) {
        showAlert('Please request at least one umpire change.', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/umpire-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to submit request');

        const result = await response.json();
        showAlert('Umpire change request submitted successfully!', 'success');
        hideUmpireRequestForm();
        
        // Reset form
        document.getElementById('umpireRequestFormElement').reset();
        
    } catch (error) {
        console.error('Error submitting request:', error);
        showAlert('Error submitting request. Please try again.', 'danger');
    }
}

// Toggle filters on mobile
function toggleFilters() {
    const filterSection = document.getElementById('filterSection');
    filterSection.classList.toggle('show');
}

// Show alert message
function showAlert(message, type) {
    try {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) {
            console.error('Alert container not found');
            return;
        }
        
        const alertId = 'alert-' + Date.now();
        
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" id="${alertId}" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        alertContainer.innerHTML = alertHtml;
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                alert.remove();
            }
        }, 5000);
    } catch (error) {
        console.error('Error showing alert:', error);
        // Fallback to console log if alert fails
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Update filter status display
function updateFilterStatus() {
    const filterStatus = document.getElementById('filterStatus');
    if (!filterStatus) return;
    
    const activeFilters = [
        'seasonFilter', 'eventTypeFilter', 'dayFilter', 'divisionFilter',
        'homeTeamFilter', 'visitorTeamFilter', 'venueFilter', 'homeCoachFilter',
        'visitorCoachFilter', 'plateUmpireFilter', 'baseUmpireFilter',
        'concessionStandFilter', 'concessionStaffFilter', 'dateFilter', 'timeFilter'
    ].filter(id => {
        const element = document.getElementById(id);
        return element && element.value !== '';
    });
    
    if (activeFilters.length === 0) {
        filterStatus.innerHTML = '<i class="fas fa-info-circle"></i><span>Ready to filter games</span>';
        filterStatus.className = 'filter-status';
    } else {
        const filterCount = activeFilters.length;
        filterStatus.innerHTML = `<i class="fas fa-filter"></i><span>${filterCount} active filter${filterCount > 1 ? 's' : ''} applied</span>`;
        filterStatus.className = 'filter-status active';
    }
}

// Export functions for global access
window.showUmpireRequestForm = showUmpireRequestForm;
window.hideUmpireRequestForm = hideUmpireRequestForm;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.toggleFilters = toggleFilters; 