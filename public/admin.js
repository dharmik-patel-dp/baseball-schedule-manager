// Global variables
let allSchedules = [];
let allUmpireRequests = [];
let allConcessionStaffRequests = [];
let allStaff = [];
let selectedSchedules = new Set();
let csvData = null;
let filteredSchedules = []; // Add filtered schedules array

// Section navigation function
function showSection(sectionName) {
    try {
        // Hide all sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const selectedSection = document.getElementById(sectionName);
        if (selectedSection) {
            selectedSection.classList.add('active');
        }
        
        // Update navigation active state
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            switch(sectionName) {
                case 'dashboard':
                    pageTitle.textContent = 'Dashboard Overview';
                    break;
                case 'schedules':
                    pageTitle.textContent = 'Game Schedules Management';
                    break;
                case 'staff':
                    pageTitle.textContent = 'Staff Directory Management';
                    break;
                case 'requests':
                    pageTitle.textContent = 'Change Requests Management';
                    break;
            }
        }
        
        // Load data for the section
        switch(sectionName) {
            case 'schedules':
                if (typeof loadSchedules === 'function') loadSchedules();
                break;
            case 'staff':
                if (typeof loadStaff === 'function') loadStaff();
                break;
            case 'requests':
                if (typeof loadUmpireRequests === 'function') loadUmpireRequests();
                if (typeof loadConcessionStaffRequests === 'function') loadConcessionStaffRequests();
                break;
            case 'dashboard':
                if (typeof updateAdminStats === 'function') updateAdminStats();
                break;
        }
    } catch (error) {
        console.error('Error switching to section:', sectionName, error);
        showAlert('Error switching sections. Please try again.', 'danger');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize theme first
        initAdminEnhancedTheme();
        
        // Setup event listeners
    setupEventListeners();
        
        // Load data in proper order
        await loadSchedules(); // Wait for schedules to load first
        await loadUmpireRequests(); // Then load requests (which need schedules)
        await loadConcessionStaffRequests(); // Then load concession requests
        await loadStaff();
        await loadPlateUmpires();
        await loadBaseUmpires();
        
        // Add 3D effects after DOM loads
        setTimeout(addAdmin3DEffects, 1000);
        
        // Update stats after data loads
        if (typeof updateAdminStats === 'function') {
            setTimeout(updateAdminStats, 500);
        }
        
    } catch (error) {
        console.error('Error during initialization:', error);
        showAlert('Error initializing admin panel. Please refresh the page.', 'danger');
    }
});

// Setup event listeners
function setupEventListeners() {
    // Schedule form submission
    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', handleScheduleSubmit);
    }
    
    // Edit schedule form submission
    const editScheduleForm = document.getElementById('editScheduleForm');
    if (editScheduleForm) {
        editScheduleForm.addEventListener('submit', handleEditScheduleSubmit);
    }
    
    // Staff form submission
    const staffForm = document.getElementById('staffForm');
    if (staffForm) {
        staffForm.addEventListener('submit', handleStaffSubmit);
    }
    
    // Edit staff form submission
    const editStaffForm = document.getElementById('editStaffForm');
    if (editStaffForm) {
        editStaffForm.addEventListener('submit', handleEditStaffSubmit);
    }
    
    // Edit Plate Umpire form submission
    const editPlateUmpireForm = document.getElementById('editPlateUmpireForm');
    if (editPlateUmpireForm) {
        editPlateUmpireForm.addEventListener('submit', handleEditPlateUmpireSubmit);
    }
    
    // Edit Base Umpire form submission
    const editBaseUmpireForm = document.getElementById('editBaseUmpireForm');
    if (editBaseUmpireForm) {
        editBaseUmpireForm.addEventListener('submit', handleEditBaseUmpireSubmit);
    }
    
    // CSV file input
    const csvFileInput = document.getElementById('csvFileInput');
    if (csvFileInput) {
        csvFileInput.addEventListener('change', handleCSVFileSelect);
    }
    
    // CSV modal close event to reset data
    const uploadModal = document.getElementById('uploadModal');
    if (uploadModal) {
        uploadModal.addEventListener('hidden.bs.modal', () => {
            resetCSVModalState();
        });
    }
    
    // CSV drag and drop - handled by HTML event handlers
    // const csvUploadArea = document.getElementById('csvUploadArea');
    // if (csvUploadArea) {
    //     csvUploadArea.addEventListener('dragover', handleDragOver);
    //     csvUploadArea.addEventListener('drop', handleDrop);
    //     csvUploadArea.addEventListener('dragleave', handleDragLeave);
    //     csvUploadArea.addEventListener('click', () => csvFile?.click());
    // }

    // Staff CSV Modal event listeners
    const staffUploadModal = document.getElementById('staffUploadModal');
    if (staffUploadModal) {
        staffUploadModal.addEventListener('hidden.bs.modal', () => {
            resetStaffCSVModalState();
        });
    }

    // Plate Umpire form submission
    const plateUmpireForm = document.getElementById('plateUmpireForm');
    if (plateUmpireForm) {
        plateUmpireForm.addEventListener('submit', handlePlateUmpireSubmit);
    }

    // Base Umpire form submission
    const baseUmpireForm = document.getElementById('baseUmpireForm');
    if (baseUmpireForm) {
        baseUmpireForm.addEventListener('submit', handleBaseUmpireSubmit);
    }

    // Modal close events for CSV uploads
    const plateUmpiresUploadModal = document.getElementById('plateUmpiresUploadModal');
    if (plateUmpiresUploadModal) {
        plateUmpiresUploadModal.addEventListener('hidden.bs.modal', resetPlateUmpiresCSVModalState);
    }

    const baseUmpiresUploadModal = document.getElementById('baseUmpiresUploadModal');
    if (baseUmpiresUploadModal) {
        baseUmpiresUploadModal.addEventListener('hidden.bs.modal', resetBaseUmpiresCSVModalState);
    }
}

// Missing functions that were referenced in HTML
function showUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }
}

function showCreateScheduleModal() {
    const modal = document.getElementById('createScheduleModal');
    if (modal) {
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }
}

function toggleTheme() {
    // Toggle between light and dark theme
    const body = document.body;
    const themeIcon = document.querySelector('.header-actions .btn i');
    
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        if (themeIcon) themeIcon.className = 'fas fa-moon';
    } else {
        body.classList.add('dark-theme');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
    }
}

function showAddStaffModal() {
    const modal = document.getElementById('addStaffModal');
    if (modal) {
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }
}

// Load all schedules
async function loadSchedules() {
    try {
        const response = await fetch('/api/schedules');
        if (!response.ok) throw new Error('Failed to fetch schedules');
        
        allSchedules = await response.json();
        // Initialize filtered schedules with all schedules
        filteredSchedules = [...allSchedules];
        
        // Populate filter dropdowns
        populateFilterDropdowns();
        
        // Render the table
        renderScheduleTable();
    } catch (error) {
        console.error('Error loading schedules:', error);
        showAlert('Error loading schedules. Please try again.', 'danger');
    }
}

// Load umpire requests
async function loadUmpireRequests() {
    try {
        const response = await fetch('/api/umpire-requests');
        if (!response.ok) throw new Error('Failed to fetch umpire requests');
        
        allUmpireRequests = await response.json();
        
        // Enrich requests with game details
        allUmpireRequests = allUmpireRequests.map(request => {
            console.log('🔍 Enriching umpire request:', request);
            
            const game = allSchedules.find(s => s.id == request.game_id);
            if (game) {
                request.game_details = `${game.home_team} vs ${game.visitor_team} on ${formatDate(game.date)} at ${game.start_time}`;
                // Also enrich current umpire data if not already present
                if (!request.current_plate_umpire || request.current_plate_umpire === '') {
                    request.current_plate_umpire = game.plate_umpire || 'N/A';
                }
                if (!request.current_base_umpire || request.current_base_umpire === '') {
                    request.current_base_umpire = game.base_umpire || 'N/A';
                }
                
                // Handle empty requested umpire fields
                if (!request.requested_plate_umpire || request.requested_plate_umpire === '') {
                    request.requested_plate_umpire = 'No change';
                }
                if (!request.requested_base_umpire || request.requested_base_umpire === '') {
                    request.requested_base_umpire = 'No change';
                }
                
                console.log('🔍 Enriched request:', {
                    game_details: request.game_details,
                    current_plate: request.current_plate_umpire,
                    current_base: request.current_base_umpire,
                    requested_plate: request.requested_plate_umpire,
                    requested_base: request.requested_base_umpire
                });
            } else {
                request.game_details = 'Game not found';
            }
            return request;
        });
        
        renderUmpireRequestsTable();
    } catch (error) {
        console.error('Error loading umpire requests:', error);
        showAlert('Error loading umpire requests. Please try again.', 'danger');
    }
}

// Load concession staff requests
async function loadConcessionStaffRequests() {
    try {
        const response = await fetch('/api/concession-staff-requests');
        if (!response.ok) throw new Error('Failed to fetch concession staff requests');
        
        allConcessionStaffRequests = await response.json();
        
        // Enrich requests with game details
        allConcessionStaffRequests = allConcessionStaffRequests.map(request => {
            const game = allSchedules.find(s => s.id == request.game_id);
            if (game) {
                request.game_details = `${game.home_team} vs ${game.visitor_team} on ${formatDate(game.date)} at ${game.start_time}`;
                // Also enrich current concession staff data if not already present
                if (!request.current_concession_staff) {
                    request.current_concession_staff = game.concession_staff || 'No staff assigned';
                }
            } else {
                request.game_details = 'Game not found';
            }
            return request;
        });
        
        renderConcessionStaffRequestsTable();
    } catch (error) {
        console.error('Error loading concession staff requests:', error);
        showAlert('Error loading concession staff requests. Please try again.', 'danger');
    }
}

// Load staff
async function loadStaff() {
    try {
        const response = await fetch('/api/staff');
        if (!response.ok) throw new Error('Failed to fetch staff');
        
        allStaff = await response.json();
        renderStaffTable();
        populateStaffDropdowns();
    } catch (error) {
        console.error('Error loading staff:', error);
        showAlert('Error loading staff. Please try again.', 'danger');
    }
}

// Populate staff dropdowns in forms
function populateStaffDropdowns() {
    if (!allStaff || allStaff.length === 0) {
        console.log('No staff data available for dropdowns');
        return;
    }

    // Get staff names for dropdowns
    const staffNames = allStaff.map(staff => staff.name);
    
    // Populate create form dropdowns
    const plateUmpireSelect = document.getElementById('plateUmpire');
    if (plateUmpireSelect) {
        plateUmpireSelect.innerHTML = '<option value="">Select Plate Umpire</option>';
        staffNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            plateUmpireSelect.appendChild(option);
        });
    }
    
    const baseUmpireSelect = document.getElementById('baseUmpire');
    if (baseUmpireSelect) {
        baseUmpireSelect.innerHTML = '<option value="">Select Base Umpire</option>';
        staffNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            baseUmpireSelect.appendChild(option);
        });
    }
    
    const concessionStaffSelect = document.getElementById('concessionStaff');
    if (concessionStaffSelect) {
        concessionStaffSelect.innerHTML = '<option value="">Select Concession Staff</option>';
        staffNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            concessionStaffSelect.appendChild(option);
        });
    }
    
    // Populate edit form dropdowns
    const editPlateUmpireSelect = document.getElementById('editPlateUmpire');
    if (editPlateUmpireSelect) {
        editPlateUmpireSelect.innerHTML = '<option value="">Select Plate Umpire</option>';
        staffNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            editPlateUmpireSelect.appendChild(option);
        });
    }
    
    const editBaseUmpireSelect = document.getElementById('editBaseUmpire');
    if (editBaseUmpireSelect) {
        editBaseUmpireSelect.innerHTML = '<option value="">Select Base Umpire</option>';
        staffNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            editBaseUmpireSelect.appendChild(option);
        });
    }
    
    const editConcessionStaffSelect = document.getElementById('editConcessionStaff');
    if (editConcessionStaffSelect) {
        editConcessionStaffSelect.innerHTML = '<option value="">Select Concession Staff</option>';
        staffNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            editConcessionStaffSelect.appendChild(option);
        });
    }
    
    console.log('✅ Staff dropdowns populated with', staffNames.length, 'staff members');
}

// Render schedule table
function renderScheduleTable() {
    const tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;
    
    // Use filtered schedules if available, otherwise use all schedules
    const schedulesToRender = filteredSchedules.length > 0 ? filteredSchedules : allSchedules;
    
    if (schedulesToRender.length === 0) {
        // Check if filters are active
        const seasonFilter = document.getElementById('filterSeason')?.value || '';
        const eventTypeFilter = document.getElementById('filterEventType')?.value || '';
        const divisionFilter = document.getElementById('filterDivision')?.value || '';
        const venueFilter = document.getElementById('filterVenue')?.value || '';
        const dateRangeFilter = document.getElementById('filterDateRange')?.value || '';
        const searchFilter = document.getElementById('filterSearch')?.value || '';
        
        const activeFilters = [];
        if (seasonFilter) activeFilters.push(`Season: ${seasonFilter}`);
        if (eventTypeFilter) activeFilters.push(`Event Type: ${eventTypeFilter}`);
        if (divisionFilter) activeFilters.push(`Division: ${divisionFilter}`);
        if (venueFilter) activeFilters.push(`Venue: ${venueFilter}`);
        if (dateRangeFilter) activeFilters.push(`Date Range: ${dateRangeFilter}`);
        if (searchFilter) activeFilters.push(`Search: "${searchFilter}"`);
        
        if (activeFilters.length > 0) {
        tbody.innerHTML = `
            <tr>
                    <td colspan="11" class="no-data text-center">
                        <div class="py-5">
                            <i class="fas fa-search fa-3x text-warning mb-4"></i>
                            <h4 class="text-warning mb-3">No Results Found</h4>
                            <h6 class="text-muted mb-3">No schedules match your current filter criteria</h6>
                            <p class="text-muted mb-3">Active filters:</p>
                            <div class="mb-4">
                                ${activeFilters.map(filter => `<span class="badge bg-warning text-dark me-2 mb-2">${filter}</span>`).join('')}
                            </div>
                            <div class="d-flex gap-2 justify-content-center">
                                <button class="btn btn-warning btn-lg" onclick="clearAllFilters()">
                                    <i class="fas fa-times me-2"></i>Clear All Filters
                                </button>
                                <button class="btn btn-outline-secondary btn-lg" onclick="showSection('schedules')">
                                    <i class="fas fa-eye me-2"></i>View All Schedules
                                </button>
                            </div>
                        </div>
                </td>
            </tr>
        `;
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="no-data text-center">
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

    tbody.innerHTML = schedulesToRender.map(schedule => `
        <tr>
            <td><input type="checkbox" class="schedule-select" data-id="${schedule.id}" onchange="onScheduleSelectChange()"></td>
            <td><span class="badge bg-primary">${schedule.season || 'N/A'}</span></td>
            <td><span class="badge ${schedule.event_type === 'Baseball' ? 'bg-success' : 'bg-warning'}">${schedule.event_type || 'N/A'}</span></td>
            <td>${formatDate(schedule.date)}</td>
            <td>${schedule.start_time || 'N/A'} ${schedule.am_pm || ''}</td>
            <td><span class="badge bg-info">${schedule.division || 'N/A'}</span></td>
            <td>
                <div><strong>${schedule.home_team || 'N/A'}</strong> vs <strong>${schedule.visitor_team || 'N/A'}</strong></div>
                <small class="text-muted">${schedule.home_coach || 'N/A'} / ${schedule.visitor_coach || 'N/A'}</small>
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
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editSchedule(${schedule.id})" title="Edit Schedule">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteSchedule(${schedule.id})" title="Delete Schedule">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // Reset header select-all checkbox state
    const selectAll = document.getElementById('selectAllSchedules');
    if (selectAll) selectAll.checked = false;
}

// Handle select-all toggle
function toggleSelectAllSchedules(checkbox) {
    const checkboxes = document.querySelectorAll('.schedule-select');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
    onScheduleSelectChange();
}

// Update bulk delete button enabled state
function onScheduleSelectChange() {
    const anySelected = Array.from(document.querySelectorAll('.schedule-select')).some(cb => cb.checked);
    const bulkBtn = document.getElementById('bulkDeleteBtn');
    if (bulkBtn) bulkBtn.disabled = !anySelected;
}

// Bulk delete selected schedules
async function bulkDeleteSelected() {
    const selected = Array.from(document.querySelectorAll('.schedule-select'))
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.getAttribute('data-id'), 10))
        .filter(id => !Number.isNaN(id));

    if (selected.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selected.length} selected schedule(s)? This action cannot be undone.`)) {
        return;
    }

    try {
        // Perform deletions sequentially to reuse existing DELETE endpoint
        for (const id of selected) {
            const response = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error(`Failed to delete schedule ${id}`);
        }

        showAlert(`Deleted ${selected.length} schedule(s) successfully!`, 'success');
        await loadSchedules();
    } catch (error) {
        console.error('❌ Error during bulk delete:', error);
        showAlert('Error deleting selected schedules. Please try again.', 'danger');
    }
}

// Render umpire requests table
function renderUmpireRequestsTable() {
    const tbody = document.getElementById('umpireRequestsTableBody');
    if (!tbody) return;
    
    const pendingRequests = (allUmpireRequests || []).filter(req => req.status === 'pending');
    
    console.log('🔍 Rendering umpire requests table with data:', pendingRequests);
    console.log('🔍 Sample request object:', pendingRequests[0]);

    if (pendingRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No pending umpire requests</td></tr>';
        return;
    }
    
    tbody.innerHTML = pendingRequests.map(request => {
        console.log('🔍 Processing request:', request);
        console.log('🔍 Requested plate umpire:', request.requested_plate_umpire);
        console.log('🔍 Requested base umpire:', request.requested_base_umpire);
        
        return `
        <tr>
            <td>${request.game_details || 'N/A'}</td>
            <td>${request.current_plate_umpire || 'N/A'} / ${request.current_base_umpire || 'N/A'}</td>
            <td>${request.requested_plate_umpire || 'N/A'} / ${request.requested_base_umpire || 'N/A'}</td>
            <td>${request.reason || 'N/A'}</td>
            <td><span class="badge bg-${getStatusBadgeClass(request.status)}">${request.status}</span></td>
            <td>
                ${request.status === 'pending' ? `
                    <button class="btn btn-sm btn-outline-success me-1" onclick="updateRequestStatus(${request.id}, 'approved')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="updateRequestStatus(${request.id}, 'rejected')">
                        <i class="fas fa-times"></i>
                    </button>
                ` : 'No actions needed'}
                </td>
            </tr>
        `;
    }).join('');
}

// Render concession staff requests table
function renderConcessionStaffRequestsTable() {
    const tbody = document.getElementById('concessionStaffRequestsTableBody');
    if (!tbody) return;
    
    const pendingRequests = (allConcessionStaffRequests || []).filter(req => req.status === 'pending');

    if (pendingRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No pending concession staff requests</td></tr>';
        return;
    }

    tbody.innerHTML = pendingRequests.map(request => `
        <tr>
            <td>${request.game_details || 'N/A'}</td>
            <td>${request.current_concession_staff || 'N/A'}</td>
            <td>${request.requested_concession_staff || 'N/A'}</td>
            <td>${request.reason || 'N/A'}</td>
            <td><span class="badge bg-${getStatusBadgeClass(request.status)}">${request.status}</span></td>
            <td>
                ${request.status === 'pending' ? `
                    <button class="btn btn-sm btn-outline-success me-1" onclick="updateConcessionRequestStatus(${request.id}, 'approved')">
                    <i class="fas fa-check"></i>
                </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="updateConcessionRequestStatus(${request.id}, 'rejected')">
                    <i class="fas fa-times"></i>
                </button>
                ` : 'No actions needed'}
            </td>
        </tr>
    `).join('');
}

// Render staff table
function renderStaffTable() {
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) return;
    
    if (allStaff.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No staff members found</td></tr>';
        return;
    }
    
    tbody.innerHTML = allStaff.map(staff => `
        <tr>
            <td><input type="checkbox" name="staffCheckbox" value="${staff.id}" onchange="toggleStaffSelection(this)"></td>
            <td><strong>${staff.name || 'N/A'}</strong></td>
            <td><span class="badge bg-info">${staff.role || 'N/A'}</span></td>
            <td>${staff.phone || '<em class="text-muted">Not provided</em>'}</td>
            <td>${staff.email || '<em class="text-muted">Not provided</em>'}</td>
            <td>${staff.parent_name || '<em class="text-muted">Not provided</em>'}</td>
            <td>${staff.parent_phone || '<em class="text-muted">Not provided</em>'}</td>
            <td>${staff.parent_email || '<em class="text-muted">Not provided</em>'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editStaff(${staff.id})" title="Edit Staff">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteStaff(${staff.id})" title="Delete Staff">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Update bulk delete UI after rendering
    updateBulkDeleteStaffUI();
}

// Handle schedule form submission
async function handleScheduleSubmit(e) {
    e.preventDefault();
    
    const formData = {
        season: document.getElementById('season').value,
        event_type: document.getElementById('eventType').value,
        day: document.getElementById('day').value,
        date: document.getElementById('scheduleDate').value,
        start_time: document.getElementById('startTime').value,
        am_pm: document.getElementById('amPm').value,
        division: document.getElementById('division').value,
        home_team: document.getElementById('homeTeam').value,
        home_coach: document.getElementById('homeCoach').value,
        visitor_team: document.getElementById('visitorTeam').value,
        visitor_coach: document.getElementById('visitorCoach').value,
        venue: document.getElementById('venue').value,
        plate_umpire: document.getElementById('plateUmpire').value,
        base_umpire: document.getElementById('baseUmpire').value,
        concession_stand: document.getElementById('concessionStand').value,
        concession_staff: document.getElementById('concessionStaff').value
    };
    
    console.log('📝 Creating schedule with data:', formData);
    
    try {
        const response = await fetch('/api/schedules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to create schedule');
        
        const result = await response.json();
        console.log('✅ Schedule created successfully:', result);
        
        showAlert('Schedule created successfully!', 'success');
        document.getElementById('scheduleForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('createScheduleModal')).hide();
        
        // Reload schedules to show the new one
        await loadSchedules();
        
        // Also refresh requests since they depend on schedule data
        await loadUmpireRequests();
        await loadConcessionStaffRequests();
    } catch (error) {
        console.error('❌ Error creating schedule:', error);
        showAlert('Error creating schedule. Please try again.', 'danger');
    }
}

// Handle staff form submission
async function handleStaffSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('staffName').value,
        role: document.getElementById('staffRole').value,
        phone: document.getElementById('staffPhone').value,
        email: document.getElementById('staffEmail').value,
        parent_name: document.getElementById('staffParentName').value,
        parent_phone: document.getElementById('staffParentPhone').value,
        parent_email: document.getElementById('staffParentEmail').value
    };
    
    console.log('📝 Adding staff member with data:', formData);
    
    try {
        const response = await fetch('/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to add staff member');
        
        const result = await response.json();
        console.log('✅ Staff member added successfully:', result);
        
        showAlert('Staff member added successfully!', 'success');
        document.getElementById('staffForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addStaffModal')).hide();
        
        // Reload staff to show the new one
        await loadStaff();
    } catch (error) {
        console.error('❌ Error adding staff member:', error);
        showAlert('Error adding staff member. Please try again.', 'danger');
    }
}

// Handle plate umpire form submission
async function handlePlateUmpireSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('plateUmpireName').value,
        email: document.getElementById('plateUmpireEmail').value,
        phone: document.getElementById('plateUmpirePhone').value,
        availability: document.getElementById('plateUmpireAvailability').value
    };
    
    console.log('📝 Adding plate umpire with data:', formData);
    
    try {
        const response = await fetch('/api/plate-umpires', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to add plate umpire');
        
        const result = await response.json();
        console.log('✅ Plate umpire added successfully:', result);
        
        showAlert('Plate umpire added successfully!', 'success');
        document.getElementById('plateUmpireForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addPlateUmpireModal')).hide();
        
        // Reload plate umpires to show the new one
        await loadPlateUmpires();
    } catch (error) {
        console.error('❌ Error adding plate umpire:', error);
        showAlert('Error adding plate umpire. Please try again.', 'danger');
    }
}

// Handle base umpire form submission
async function handleBaseUmpireSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('baseUmpireName').value,
        email: document.getElementById('baseUmpireEmail').value,
        phone: document.getElementById('baseUmpirePhone').value,
        availability: document.getElementById('baseUmpireAvailability').value
    };
    
    console.log('📝 Adding base umpire with data:', formData);
    
    try {
        const response = await fetch('/api/base-umpires', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to add base umpire');
        
        const result = await response.json();
        console.log('✅ Base umpire added successfully:', result);
        
        showAlert('Base umpire added successfully!', 'success');
        document.getElementById('baseUmpireForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addBaseUmpireModal')).hide();
        
        // Reload base umpires to show the new one
        await loadBaseUmpires();
    } catch (error) {
        console.error('❌ Error adding base umpire:', error);
        showAlert('Error adding base umpire. Please try again.', 'danger');
    }
}

// Update umpire request status
async function updateRequestStatus(requestId, status) {
    try {
        console.log(`🔄 Updating umpire request ${requestId} to status: ${status}`);
        
        const response = await fetch(`/api/umpire-requests/${requestId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) throw new Error('Failed to update request status');
        
        const result = await response.json();
        console.log('✅ Umpire request status updated:', result);
        
        showAlert(`Request ${status} successfully!`, 'success');
        
        // Reload both umpire requests and schedules to show updates
        console.log('🔄 Reloading data after status update...');
        await Promise.all([
            loadUmpireRequests(),
            loadSchedules()
        ]);
        
        console.log('✅ Data reloaded successfully');
    } catch (error) {
        console.error('❌ Error updating request status:', error);
        showAlert('Error updating request status. Please try again.', 'danger');
    }
}

// Update concession request status
async function updateConcessionRequestStatus(requestId, status) {
    try {
        console.log(`🔄 Updating concession staff request ${requestId} to status: ${status}`);
        
        const response = await fetch(`/api/concession-staff-requests/${requestId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) throw new Error('Failed to update request status');
        
        const result = await response.json();
        console.log('✅ Concession staff request status updated:', result);
        
        showAlert(`Request ${status} successfully!`, 'success');
        
        // Reload both concession staff requests and schedules to show updates
        console.log('🔄 Reloading data after status update...');
        await Promise.all([
            loadConcessionStaffRequests(),
            loadSchedules()
        ]);
        
        console.log('✅ Data reloaded successfully');
    } catch (error) {
        console.error('❌ Error updating request status:', error);
        showAlert('Error updating request status. Please try again.', 'danger');
    }
}

// CSV handling functions
function handleCSVFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        // Validate file type
        if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
            showAlert('Please select a valid CSV file', 'warning');
            e.target.value = '';
            return;
        }
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            showAlert('File size must be less than 5MB', 'warning');
            e.target.value = '';
            return;
        }
        
        csvData = file;
        console.log('📁 CSV file selected:', file.name, 'Size:', (file.size / 1024).toFixed(2) + 'KB');
        showAlert(`CSV file selected: ${file.name}`, 'success');
        
        // Update upload button text
        const uploadBtn = document.querySelector('#uploadModal .btn-primary');
        if (uploadBtn) {
            uploadBtn.innerHTML = `<i class="fas fa-upload me-2"></i>Upload ${file.name}`;
        }
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#4e73df';
    e.currentTarget.style.backgroundColor = '#f8f9fc';
}

function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    
    if (!file) {
        showAlert('No file dropped', 'warning');
        return;
    }
    
    // Validate file type
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
        showAlert('Please drop a valid CSV file', 'warning');
        return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('File size must be less than 5MB', 'warning');
        return;
    }
    
    csvData = file;
    console.log('📁 CSV file dropped:', file.name, 'Size:', (file.size / 1024).toFixed(2) + 'KB');
    showAlert(`CSV file dropped: ${file.name}`, 'success');
    
    // Update upload button text
    const uploadBtn = document.querySelector('#uploadModal .btn-primary');
    if (uploadBtn) {
        uploadBtn.innerHTML = `<i class="fas fa-upload me-2"></i>Upload ${file.name}`;
    }
    
    // Reset drag area styling
    e.currentTarget.style.borderColor = '#e3e6f0';
    e.currentTarget.style.backgroundColor = '#f8f9fc';
}

function handleDragLeave(e) {
    e.currentTarget.style.borderColor = '#e3e6f0';
    e.currentTarget.style.backgroundColor = '#f8f9fc';
}

async function uploadCSV() {
    if (!csvData) {
        showAlert('Please select a CSV file first', 'warning');
        return;
    }
    
    console.log('📤 Uploading CSV file:', csvData.name);
    
    // Show loading state
    const uploadBtn = document.querySelector('#uploadModal .btn-primary');
    const originalText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Uploading...';
    uploadBtn.disabled = true;
    
    const formData = new FormData();
    formData.append('csv', csvData);
    
    try {
        const response = await fetch('/api/upload-csv', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to upload CSV');
        }
        
        console.log('✅ CSV upload result:', result);
        
        // Render detailed CSV result report inside modal
        renderCSVResultReport(result);
        
        // If committed, reload schedules and optionally close modal
        if (result.committed) {
            await loadSchedules();
            showAlert(`CSV uploaded successfully! ${result.totalRows} rows processed, ${result.successCount} inserted.`, 'success');
            // Auto-close after 15 seconds
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
                if (modal) modal.hide();
                resetCSVModalState();
            }, 15000);
        } else {
            // Keep modal open so the admin can see errors
            showAlert(`CSV validation failed. Please review the row errors.`, 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error uploading CSV:', error);
        showAlert(`Error uploading CSV: ${error.message}`, 'danger');
    } finally {
        // Reset button state
        uploadBtn.innerHTML = originalText;
        uploadBtn.disabled = false;
    }
}

function resetCSVModalState() {
    csvData = null;
    const uploadBtn = document.querySelector('#uploadModal .btn-primary');
    if (uploadBtn) {
        uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Upload';
    }
    const csvFileInput = document.getElementById('csvFileInput');
    if (csvFileInput) {
        csvFileInput.value = '';
    }
    const report = document.getElementById('csvResultReport');
    if (report) report.style.display = 'none';
    const summary = document.getElementById('csvResultSummary');
    if (summary) {
        summary.className = 'alert';
        summary.innerHTML = '';
    }
    const rowErrors = document.getElementById('csvRowErrors');
    if (rowErrors) rowErrors.innerHTML = '';
}

function renderCSVResultReport(result) {
    const report = document.getElementById('csvResultReport');
    const summary = document.getElementById('csvResultSummary');
    const rowErrors = document.getElementById('csvRowErrors');
    if (!report || !summary || !rowErrors) return;

    report.style.display = 'block';

    const total = result.totalRows ?? result.total ?? 0;
    const success = result.successCount ?? result.inserted ?? 0;
    const errors = result.errorCount ?? result.errors ?? 0;
    const committed = result.committed === true;
    const rows = Array.isArray(result.rowErrors) ? result.rowErrors : [];
    const isFormatError = result.formatError === true;

    summary.className = `alert ${committed ? 'alert-success' : isFormatError ? 'alert-danger' : errors > 0 ? 'alert-warning' : 'alert-info'}`;
    
    if (isFormatError) {
        summary.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle text-danger me-2"></i>
                <div>
                    <strong>CSV Format Error!</strong><br>
                    <span class="text-danger">${result.message}</span>
                </div>
            </div>
        `;
    } else {
        summary.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas ${committed ? 'fa-check-circle text-success' : errors > 0 ? 'fa-exclamation-triangle text-warning' : 'fa-info-circle text-info'} me-2"></i>
                <div>
                    <strong>${committed ? 'Upload Successful' : errors > 0 ? 'Validation Report' : 'Upload Result'}</strong><br>
                    Processed: <strong>${total}</strong> &nbsp; Inserted: <strong>${success}</strong> &nbsp; Errors: <strong>${errors}</strong>
                </div>
            </div>
        `;
    }

    if (isFormatError) {
        // Show format error details
        rowErrors.innerHTML = `
            <div class="card border-danger">
                <div class="card-header py-2 bg-danger text-white">
                    <strong><i class="fas fa-times-circle me-2"></i>Format Mismatch</strong>
                </div>
                <div class="card-body p-3">
                    <div class="row">
                        <div class="col-md-6">
                            <h6 class="text-danger">Expected Columns:</h6>
                            <div class="d-flex flex-wrap gap-1">
                                ${(result.expectedColumns || []).map(col => 
                                    `<span class="badge bg-success">${col}</span>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6 class="text-danger">Received Columns:</h6>
                            <div class="d-flex flex-wrap gap-1">
                                ${(result.receivedColumns || []).map(col => 
                                    `<span class="badge bg-secondary">${col}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <h6 class="text-danger">Missing Required Columns:</h6>
                        <div class="d-flex flex-wrap gap-1">
                            ${(result.rowErrors?.[0]?.errors || []).map(error => 
                                `<span class="badge bg-danger">${escapeHtml(error)}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (rows.length > 0) {
        rowErrors.innerHTML = `
            <div class="card">
                <div class="card-header py-2">
                    <strong>Row Errors (${rows.length})</strong>
                </div>
                <div class="card-body p-2" style="max-height: 240px; overflow:auto;">
                    ${rows.map(r => `
                        <div class="mb-2 small">
                            <span class="badge bg-danger me-2">Row ${r.row}</span>
                            ${Array.isArray(r.errors) ? r.errors.map(e => `<span class="badge bg-light text-dark me-1">${escapeHtml(e)}</span>`).join('') : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        rowErrors.innerHTML = '';
    }
}

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Staff CSV Upload Functions
let staffCsvData = null;

function showStaffUploadModal() {
    const modal = new bootstrap.Modal(document.getElementById('staffUploadModal'));
    modal.show();
}

function handleStaffCSVFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
        showAlert('Please select a valid CSV file', 'warning');
        e.target.value = '';
        return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('File size must be less than 5MB', 'warning');
        e.target.value = '';
        return;
    }
    
    staffCsvData = file;
    console.log('📁 Staff CSV file selected:', file.name, 'Size:', (file.size / 1024).toFixed(2) + 'KB');
    showAlert(`Staff CSV file selected: ${file.name}`, 'success');
    
    // Update upload button text
    const uploadBtn = document.querySelector('#staffUploadModal .btn-primary');
    if (uploadBtn) {
        uploadBtn.innerHTML = `<i class="fas fa-upload me-2"></i>Upload ${file.name}`;
    }
}

function handleStaffDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#4e73df';
    e.currentTarget.style.backgroundColor = '#f8f9fc';
}

function handleStaffDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    
    if (!file) {
        showAlert('No file dropped', 'warning');
        return;
    }
    
    // Validate file type
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
        showAlert('Please drop a valid CSV file', 'warning');
        return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('File size must be less than 5MB', 'warning');
        return;
    }
    
    staffCsvData = file;
    console.log('📁 Staff CSV file dropped:', file.name, 'Size:', (file.size / 1024).toFixed(2) + 'KB');
    showAlert(`Staff CSV file dropped: ${file.name}`, 'success');
    
    // Update upload button text
    const uploadBtn = document.querySelector('#staffUploadModal .btn-primary');
    if (uploadBtn) {
        uploadBtn.innerHTML = `<i class="fas fa-upload me-2"></i>Upload ${file.name}`;
    }
    
    // Reset drag area styling
    e.currentTarget.style.borderColor = '#e3e6f0';
    e.currentTarget.style.backgroundColor = '#f8f9fc';
}

function handleStaffDragLeave(e) {
    e.currentTarget.style.borderColor = '#e3e6f0';
    e.currentTarget.style.backgroundColor = '#f8f9fc';
}

async function uploadStaffCSV() {
    if (!staffCsvData) {
        showAlert('Please select a staff CSV file first', 'warning');
        return;
    }
    
    console.log('📤 Uploading staff CSV file:', staffCsvData.name);
    
    // Show loading state
    const uploadBtn = document.querySelector('#staffUploadModal .btn-primary');
    const originalText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Uploading...';
    uploadBtn.disabled = true;
    
    const formData = new FormData();
    formData.append('csv', staffCsvData);
    
    try {
        const response = await fetch('/api/upload-staff-csv', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to upload staff CSV');
        }
        
        console.log('✅ Staff CSV upload result:', result);
        
        // Render detailed staff CSV result report inside modal
        renderStaffCSVResultReport(result);
        
        // If committed, reload staff and optionally close modal
        if (result.committed) {
            await loadStaff();
            showAlert(`Staff CSV uploaded successfully! ${result.totalRows} rows processed, ${result.successCount} inserted.`, 'success');
            // Auto-close after 15 seconds
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('staffUploadModal'));
                if (modal) modal.hide();
                resetStaffCSVModalState();
            }, 15000);
        } else {
            // Keep modal open so the admin can see errors
            showAlert(`Staff CSV validation failed. Please review the row errors.`, 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error uploading staff CSV:', error);
        showAlert(`Error uploading staff CSV: ${error.message}`, 'danger');
    } finally {
        // Reset button state
        uploadBtn.innerHTML = originalText;
        uploadBtn.disabled = false;
    }
}

function resetStaffCSVModalState() {
    staffCsvData = null;
    const uploadBtn = document.querySelector('#staffUploadModal .btn-primary');
    if (uploadBtn) {
        uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Upload Staff';
    }
    const csvFileInput = document.getElementById('staffCsvFile');
    if (csvFileInput) {
        csvFileInput.value = '';
    }
    const report = document.getElementById('staffCsvResultReport');
    if (report) report.style.display = 'none';
    const summary = document.getElementById('staffCsvResultSummary');
    if (summary) {
        summary.className = 'alert';
        summary.innerHTML = '';
    }
    const rowErrors = document.getElementById('staffCsvRowErrors');
    if (rowErrors) rowErrors.innerHTML = '';
}

function renderStaffCSVResultReport(result) {
    const report = document.getElementById('staffCsvResultReport');
    const summary = document.getElementById('staffCsvResultSummary');
    const rowErrors = document.getElementById('staffCsvRowErrors');
    if (!report || !summary || !rowErrors) return;

    report.style.display = 'block';

    const total = result.totalRows ?? result.total ?? 0;
    const success = result.successCount ?? result.inserted ?? 0;
    const errors = result.errorCount ?? result.errors ?? 0;
    const committed = result.committed === true;
    const rows = Array.isArray(result.rowErrors) ? result.rowErrors : [];
    const isFormatError = result.formatError === true;

    summary.className = `alert ${committed ? 'alert-success' : isFormatError ? 'alert-danger' : errors > 0 ? 'alert-warning' : 'alert-info'}`;
    
    if (isFormatError) {
        summary.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle text-danger me-2"></i>
                <div>
                    <strong>Staff CSV Format Error!</strong><br>
                    <span class="text-danger">${result.message}</span>
                </div>
            </div>
        `;
    } else {
        summary.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas ${committed ? 'fa-check-circle text-success' : errors > 0 ? 'fa-exclamation-triangle text-warning' : 'fa-info-circle text-info'} me-2"></i>
                <div>
                    <strong>${committed ? 'Staff Upload Successful' : errors > 0 ? 'Staff Validation Report' : 'Staff Upload Result'}</strong><br>
                    Processed: <strong>${total}</strong> &nbsp; Inserted: <strong>${success}</strong> &nbsp; Errors: <strong>${errors}</strong>
                </div>
            </div>
        `;
    }

    if (isFormatError) {
        // Show format error details
        rowErrors.innerHTML = `
            <div class="card border-danger">
                <div class="card-header py-2 bg-danger text-white">
                    <strong><i class="fas fa-times-circle me-2"></i>Staff CSV Format Mismatch</strong>
                </div>
                <div class="card-body p-3">
                    <div class="row">
                        <div class="col-md-6">
                            <h6 class="text-danger">Expected Columns:</h6>
                            <div class="d-flex flex-wrap gap-1">
                                ${(result.expectedColumns || []).map(col => 
                                    `<span class="badge bg-success">${col}</span>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6 class="text-danger">Received Columns:</h6>
                            <div class="d-flex flex-wrap gap-1">
                                ${(result.receivedColumns || []).map(col => 
                                    `<span class="badge bg-secondary">${col}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <h6 class="text-danger">Missing Required Columns:</h6>
                        <div class="d-flex flex-wrap gap-1">
                            ${(result.rowErrors?.[0]?.errors || []).map(error => 
                                `<span class="badge bg-danger">${escapeHtml(error)}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (rows.length > 0) {
        rowErrors.innerHTML = `
            <div class="card">
                <div class="card-header py-2">
                    <strong>Row Errors (${rows.length})</strong>
                </div>
                <div class="card-body p-2" style="max-height: 240px; overflow:auto;">
                    ${rows.map(r => `
                        <div class="mb-2 small">
                            <span class="badge bg-danger me-2">Row ${r.row}</span>
                            ${Array.isArray(r.errors) ? r.errors.map(e => `<span class="badge bg-light text-dark me-1">${escapeHtml(e)}</span>`).join('') : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        rowErrors.innerHTML = '';
    }
}

// Staff Bulk Delete Functions
let selectedStaffIds = new Set();

function toggleSelectAllStaff(checkbox) {
    const staffCheckboxes = document.querySelectorAll('input[name="staffCheckbox"]');
    staffCheckboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        if (checkbox.checked) {
            selectedStaffIds.add(parseInt(cb.value));
        } else {
            selectedStaffIds.delete(parseInt(cb.value));
        }
    });
    updateBulkDeleteStaffUI();
}

function toggleStaffSelection(checkbox) {
    const staffId = parseInt(checkbox.value);
    if (checkbox.checked) {
        selectedStaffIds.add(staffId);
    } else {
        selectedStaffIds.delete(staffId);
    }
    updateBulkDeleteStaffUI();
}

function updateBulkDeleteStaffUI() {
    const bulkDeleteBtn = document.getElementById('bulkDeleteStaffBtn');
    const selectedCountSpan = document.getElementById('selectedCount');
    const selectAllCheckbox = document.getElementById('selectAllStaff');
    
    if (selectedStaffIds.size > 0) {
        bulkDeleteBtn.style.display = 'inline-block';
        selectedCountSpan.textContent = selectedStaffIds.size;
    } else {
        bulkDeleteBtn.style.display = 'none';
        selectedCountSpan.textContent = '0';
    }
    
    // Update select all checkbox state
    const staffCheckboxes = document.querySelectorAll('input[name="staffCheckbox"]');
    const checkedCount = Array.from(staffCheckboxes).filter(cb => cb.checked).length;
    
    if (checkedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === staffCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

function bulkDeleteStaff() {
    if (selectedStaffIds.size === 0) {
        showAlert('Please select staff members to delete', 'warning');
        return;
    }
    
    // Show confirmation modal
    const modal = new bootstrap.Modal(document.getElementById('bulkDeleteStaffModal'));
    const deleteCount = document.getElementById('deleteCount');
    const staffToDelete = document.getElementById('staffToDelete');
    
    deleteCount.textContent = selectedStaffIds.size;
    
    // Get staff names for display
    const selectedStaff = Array.from(selectedStaffIds).map(id => {
        const staff = allStaff.find(s => s.id === id);
        return staff ? staff.name : `Staff ID ${id}`;
    });
    
    staffToDelete.innerHTML = selectedStaff.map(name => 
        `<div class="mb-1"><i class="fas fa-user me-2"></i>${escapeHtml(name)}</div>`
    ).join('');
    
    modal.show();
}

async function confirmBulkDeleteStaff() {
    try {
        const response = await fetch('/api/staff/bulk-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ids: Array.from(selectedStaffIds)
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete staff members');
        }
        
        const result = await response.json();
        console.log('✅ Bulk delete result:', result);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('bulkDeleteStaffModal'));
        if (modal) modal.hide();
        
        // Show success message
        showAlert(result.message, 'success');
        
        // Clear selection and reload staff
        selectedStaffIds.clear();
        await loadStaff();
        
    } catch (error) {
        console.error('❌ Error bulk deleting staff:', error);
        showAlert(`Error deleting staff members: ${error.message}`, 'danger');
    }
}

// Utility functions
function getStatusBadgeClass(status) {
    switch (status) {
        case 'approved': return 'success';
        case 'rejected': return 'danger';
        case 'pending': return 'warning';
        default: return 'secondary';
    }
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Fix: Use correct selector for admin.html
    const container = document.querySelector('.main-content') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
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

// Enhanced 3D UI Functions for Admin
function updateAdminStats() {
    // Update total games
    const adminTotalGames = document.getElementById('adminTotalGames');
    if (adminTotalGames && allSchedules) {
        adminTotalGames.textContent = allSchedules.length;
    }
    
    // Update pending requests
    const pendingRequests = document.getElementById('pendingRequests');
    if (pendingRequests) {
        const pendingUmpire = (allUmpireRequests || []).filter(req => req.status === 'pending').length;
        const pendingConcession = (allConcessionStaffRequests || []).filter(req => req.status === 'pending').length;
        pendingRequests.textContent = pendingUmpire + pendingConcession;
    }
    
    // Update total staff
    const totalStaff = document.getElementById('totalStaff');
    if (totalStaff && allStaff) {
        totalStaff.textContent = allStaff.length;
    }
    
    // Update total concession stands
    const totalConcessionStands = document.getElementById('totalConcessionStands');
    if (totalConcessionStands && allSchedules) {
        const uniqueConcessions = new Set(allSchedules.map(s => s.concession_stand).filter(Boolean));
        totalConcessionStands.textContent = uniqueConcessions.size;
    }
}

// Add 3D hover effects to admin cards
function addAdmin3DEffects() {
    const cards = document.querySelectorAll('.dashboard-card, .table-container');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02) rotateX(2deg)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1) rotateX(0deg)';
        });
    });
}

// Enhanced theme toggle with 3D effects for admin
function initAdminEnhancedTheme() {
    try {
        const saved = localStorage.getItem('theme') || 'light';
        if (saved === 'dark') {
            document.body.classList.add('dark-theme');
            const themeIcon = document.querySelector('.header-actions .btn i');
            if (themeIcon) themeIcon.className = 'fas fa-sun';
        }
        
        // Save theme preference
        localStorage.setItem('theme', saved);
    } catch (error) {
        console.error('Error initializing theme:', error);
    }
}

// Initialize enhanced theme for admin
initAdminEnhancedTheme();

// Edit schedule function
function editSchedule(id) {
    const schedule = allSchedules.find(s => s.id === id);
    if (!schedule) {
        showAlert('Schedule not found!', 'danger');
        return;
    }

    console.log('📝 Editing schedule:', schedule);

    // Populate edit form fields
    document.getElementById('editScheduleId').value = schedule.id;
    document.getElementById('editSeason').value = schedule.season || '';
    document.getElementById('editEventType').value = schedule.event_type || '';
    document.getElementById('editDay').value = schedule.day || '';
    document.getElementById('editScheduleDate').value = schedule.date || '';
    document.getElementById('editStartTime').value = schedule.start_time || '';
    document.getElementById('editAmPm').value = schedule.am_pm || '';
    document.getElementById('editDivision').value = schedule.division || '';
    document.getElementById('editHomeTeam').value = schedule.home_team || '';
    document.getElementById('editHomeCoach').value = schedule.home_coach || '';
    document.getElementById('editVisitorTeam').value = schedule.visitor_team || '';
    document.getElementById('editVisitorCoach').value = schedule.visitor_coach || '';
    document.getElementById('editVenue').value = schedule.venue || '';
    document.getElementById('editPlateUmpire').value = schedule.plate_umpire || '';
    document.getElementById('editBaseUmpire').value = schedule.base_umpire || '';
    document.getElementById('editConcessionStand').value = schedule.concession_stand || '';
    document.getElementById('editConcessionStaff').value = schedule.concession_staff || '';

    // Show edit modal
    const modal = new bootstrap.Modal(document.getElementById('editScheduleModal'));
    modal.show();
}

// Handle edit schedule form submission
async function handleEditScheduleSubmit(e) {
    e.preventDefault();
    
    const scheduleId = document.getElementById('editScheduleId').value;
    const formData = {
        season: document.getElementById('editSeason').value,
        event_type: document.getElementById('editEventType').value,
        day: document.getElementById('editDay').value,
        date: document.getElementById('editScheduleDate').value,
        start_time: document.getElementById('editStartTime').value,
        am_pm: document.getElementById('editAmPm').value,
        division: document.getElementById('editDivision').value,
        home_team: document.getElementById('editHomeTeam').value,
        home_coach: document.getElementById('editHomeCoach').value,
        visitor_team: document.getElementById('editVisitorTeam').value,
        visitor_coach: document.getElementById('editVisitorCoach').value,
        venue: document.getElementById('editVenue').value,
        plate_umpire: document.getElementById('editPlateUmpire').value,
        base_umpire: document.getElementById('editBaseUmpire').value,
        concession_stand: document.getElementById('editConcessionStand').value,
        concession_staff: document.getElementById('editConcessionStaff').value
    };
    
    console.log('📝 Updating schedule:', scheduleId, 'with data:', formData);

    try {
        const response = await fetch(`/api/schedules/${scheduleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to update schedule');

        const result = await response.json();
        console.log('✅ Schedule updated successfully:', result);
        
        showAlert('Schedule updated successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('editScheduleModal')).hide();
        
        // Reload schedules to show the updated one
        await loadSchedules();
        
        // Also refresh requests since they depend on schedule data
        await loadUmpireRequests();
        await loadConcessionStaffRequests();
    } catch (error) {
        console.error('❌ Error updating schedule:', error);
        showAlert('Error updating schedule. Please try again.', 'danger');
    }
}

// Delete schedule function
async function deleteSchedule(id) {
    if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
        return;
    }

    console.log('��️ Deleting schedule:', id);

    try {
        const response = await fetch(`/api/schedules/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete schedule');

        const result = await response.json();
        console.log('✅ Schedule deleted successfully:', result);

        showAlert('Schedule deleted successfully!', 'success');
        
        // Reload schedules to remove the deleted one
        await loadSchedules();
        
        // Also refresh requests since they depend on schedule data
        await loadUmpireRequests();
        await loadConcessionStaffRequests();
    } catch (error) {
        console.error('❌ Error deleting schedule:', error);
        showAlert('Error deleting schedule. Please try again.', 'danger');
    }
}

// Edit staff function
function editStaff(id) {
    const staff = allStaff.find(s => s.id === id);
    if (!staff) {
        showAlert('Staff member not found!', 'danger');
        return;
    }

    console.log('📝 Editing staff member:', staff);

    // Populate edit form fields
    document.getElementById('editStaffId').value = staff.id;
    document.getElementById('editStaffName').value = staff.name || '';
    document.getElementById('editStaffRole').value = staff.role || '';
    document.getElementById('editStaffPhone').value = staff.phone || '';
    document.getElementById('editStaffEmail').value = staff.email || '';
    document.getElementById('editStaffParentName').value = staff.parent_name || '';
    document.getElementById('editStaffParentPhone').value = staff.parent_phone || '';
    document.getElementById('editStaffParentEmail').value = staff.parent_email || '';

    // Show edit modal
    const modal = new bootstrap.Modal(document.getElementById('editStaffModal'));
    modal.show();
}

// Handle edit staff form submission
async function handleEditStaffSubmit(e) {
    e.preventDefault();
    
    const staffId = document.getElementById('editStaffId').value;
    const formData = {
        name: document.getElementById('editStaffName').value,
        role: document.getElementById('editStaffRole').value,
        phone: document.getElementById('editStaffPhone').value,
        email: document.getElementById('editStaffEmail').value,
        parent_name: document.getElementById('editStaffParentName').value,
        parent_phone: document.getElementById('editStaffParentPhone').value,
        parent_email: document.getElementById('editStaffParentEmail').value
    };
    
    console.log('📝 Updating staff member:', staffId, 'with data:', formData);
    
    try {
        const response = await fetch(`/api/staff/${staffId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to update staff member');
        
        const result = await response.json();
        console.log('✅ Staff member updated successfully:', result);
        
        showAlert('Staff member updated successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('editStaffModal')).hide();
        
        // Reload staff to show the updated one
        await loadStaff();
    } catch (error) {
        console.error('❌ Error updating staff member:', error);
        showAlert('Error updating staff member. Please try again.', 'danger');
    }
}

// Delete staff function
async function deleteStaff(id) {
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
        return;
    }

    console.log('🗑️ Deleting staff member:', id);

    try {
        const response = await fetch(`/api/staff/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete staff member');

        const result = await response.json();
        console.log('✅ Staff member deleted successfully:', result);
        
        showAlert('Staff member deleted successfully!', 'success');
        
        // Reload staff to remove the deleted member
        await loadStaff();
    } catch (error) {
        console.error('❌ Error deleting staff member:', error);
        showAlert('Error deleting staff member. Please try again.', 'danger');
    }
}

// Advanced Filter Functions
function populateFilterDropdowns() {
    if (!allSchedules || allSchedules.length === 0) return;
    
    // Get all unique values from all schedules
    const allSeasons = [...new Set(allSchedules.map(s => s.season).filter(Boolean))].sort();
    const allEventTypes = [...new Set(allSchedules.map(s => s.event_type).filter(Boolean))].sort();
    const allDivisions = [...new Set(allSchedules.map(s => s.division).filter(Boolean))].sort();
    const allVenues = [...new Set(allSchedules.map(s => s.venue).filter(Boolean))].sort();
    
    // Populate season filter
    const seasonFilter = document.getElementById('filterSeason');
    if (seasonFilter) {
        seasonFilter.innerHTML = '<option value="">All Seasons</option>';
        allSeasons.forEach(season => {
            const option = document.createElement('option');
            option.value = season;
            option.textContent = season;
            seasonFilter.appendChild(option);
        });
    }
    
    // Populate other filters with all available options initially
    populateCascadingFilters(allEventTypes, allDivisions, allVenues);
    
    // Update counts
    updateFilterCounts();
}

function populateCascadingFilters(eventTypes, divisions, venues) {
    // Populate event type filter
    const eventTypeFilter = document.getElementById('filterEventType');
    if (eventTypeFilter) {
        eventTypeFilter.innerHTML = '<option value="">All Event Types</option>';
        eventTypes.forEach(eventType => {
            const option = document.createElement('option');
            option.value = eventType;
            option.textContent = eventType;
            eventTypeFilter.appendChild(option);
        });
    }
    
    // Populate division filter
    const divisionFilter = document.getElementById('filterDivision');
    if (divisionFilter) {
        divisionFilter.innerHTML = '<option value="">All Divisions</option>';
        divisions.forEach(division => {
            const option = document.createElement('option');
            option.value = division;
            option.textContent = division;
            divisionFilter.appendChild(option);
        });
    }
    
    // Populate venue filter
    const venueFilter = document.getElementById('filterVenue');
    if (venueFilter) {
        venueFilter.innerHTML = '<option value="">All Venues</option>';
        venues.forEach(venue => {
            const option = document.createElement('option');
            option.value = venue;
            option.textContent = venue;
            venueFilter.appendChild(option);
        });
    }
}

function updateCascadingFilterOptions() {
    // Get available options from currently filtered schedules
    const availableEventTypes = [...new Set(filteredSchedules.map(s => s.event_type).filter(Boolean))].sort();
    const availableDivisions = [...new Set(filteredSchedules.map(s => s.division).filter(Boolean))].sort();
    const availableVenues = [...new Set(filteredSchedules.map(s => s.venue).filter(Boolean))].sort();
    

    
    // Update event type filter options
    const eventTypeFilter = document.getElementById('filterEventType');
    if (eventTypeFilter) {
        const currentValue = eventTypeFilter.value;
        eventTypeFilter.innerHTML = '<option value="">All Event Types</option>';
        availableEventTypes.forEach(eventType => {
            const option = document.createElement('option');
            option.value = eventType;
            option.textContent = eventType;
            if (eventType === currentValue) option.selected = true;
            eventTypeFilter.appendChild(option);
        });
        
        // If current selection is not available in filtered results, reset it
        if (currentValue && !availableEventTypes.includes(currentValue)) {
            eventTypeFilter.value = '';
            // Also reset dependent filters
            const divisionFilter = document.getElementById('filterDivision');
            const venueFilter = document.getElementById('filterVenue');
            if (divisionFilter) divisionFilter.value = '';
            if (venueFilter) venueFilter.value = '';
        }
    }
    
    // Update division filter options
    const divisionFilter = document.getElementById('filterDivision');
    if (divisionFilter) {
        const currentValue = divisionFilter.value;
        divisionFilter.innerHTML = '<option value="">All Divisions</option>';
        availableDivisions.forEach(division => {
            const option = document.createElement('option');
            option.value = division;
            option.textContent = division;
            if (division === currentValue) option.selected = true;
            divisionFilter.appendChild(option);
        });
        
        // If current selection is not available in filtered results, reset it
        if (currentValue && !availableDivisions.includes(currentValue)) {
            divisionFilter.value = '';
            // Also reset dependent filter
            const venueFilter = document.getElementById('filterVenue');
            if (venueFilter) venueFilter.value = '';
        }
    }
    
    // Update venue filter options
    const venueFilter = document.getElementById('filterVenue');
    if (venueFilter) {
        const currentValue = venueFilter.value;
        venueFilter.innerHTML = '<option value="">All Venues</option>';
        availableVenues.forEach(venue => {
            const option = document.createElement('option');
            option.value = venue;
            option.textContent = venue;
            if (venue === currentValue) option.selected = true;
            venueFilter.appendChild(option);
        });
        
        // If current selection is not available in filtered results, reset it
        if (currentValue && !availableVenues.includes(currentValue)) {
            venueFilter.value = '';
        }
    }
}

function applyFilters() {
    const seasonFilter = document.getElementById('filterSeason')?.value || '';
    const eventTypeFilter = document.getElementById('filterEventType')?.value || '';
    const divisionFilter = document.getElementById('filterDivision')?.value || '';
    const venueFilter = document.getElementById('filterVenue')?.value || '';
    const dateRangeFilter = document.getElementById('filterDateRange')?.value || '';
    const searchFilter = document.getElementById('filterSearch')?.value || '';
    
    // Start with all schedules
    filteredSchedules = [...allSchedules];
    
    // Apply season filter
    if (seasonFilter) {
        filteredSchedules = filteredSchedules.filter(schedule => 
            schedule.season === seasonFilter
        );
    }
    
    // Apply event type filter
    if (eventTypeFilter) {
        filteredSchedules = filteredSchedules.filter(schedule => 
            schedule.event_type === eventTypeFilter
        );
    }
    
    // Apply division filter
    if (divisionFilter) {
        filteredSchedules = filteredSchedules.filter(schedule => 
            schedule.division === divisionFilter
        );
    }
    
    // Apply venue filter
    if (venueFilter) {
        filteredSchedules = filteredSchedules.filter(schedule => 
            schedule.venue === venueFilter
        );
    }
    
    // Update cascading filter options based on current filtered data
    updateCascadingFilterOptions();
    
    // Apply date range filter
    if (dateRangeFilter) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        filteredSchedules = filteredSchedules.filter(schedule => {
            if (!schedule.date) return false;
            const scheduleDate = new Date(schedule.date);
            scheduleDate.setHours(0, 0, 0, 0);
            
            switch (dateRangeFilter) {
                case 'today':
                    return scheduleDate.getTime() === today.getTime();
                case 'tomorrow':
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return scheduleDate.getTime() === tomorrow.getTime();
                case 'this-week':
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay());
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
                case 'next-week':
                    const nextWeekStart = new Date(today);
                    nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
                    const nextWeekEnd = new Date(nextWeekStart);
                    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
                    return scheduleDate >= nextWeekStart && scheduleDate <= nextWeekEnd;
                case 'this-month':
                    return scheduleDate.getMonth() === today.getMonth() && 
                           scheduleDate.getFullYear() === today.getFullYear();
                default:
                    return true;
            }
        });
    }
    
    // Apply search filter (search across multiple fields)
    if (searchFilter) {
        const searchLower = searchFilter.toLowerCase();
        filteredSchedules = filteredSchedules.filter(schedule => 
            (schedule.home_team && schedule.home_team.toLowerCase().includes(searchLower)) ||
            (schedule.visitor_team && schedule.visitor_team.toLowerCase().includes(searchLower)) ||
            (schedule.home_coach && schedule.home_coach.toLowerCase().includes(searchLower)) ||
            (schedule.visitor_coach && schedule.visitor_coach.toLowerCase().includes(searchLower)) ||
            (schedule.plate_umpire && schedule.plate_umpire.toLowerCase().includes(searchLower)) ||
            (schedule.base_umpire && schedule.base_umpire.toLowerCase().includes(searchLower)) ||
            (schedule.concession_staff && schedule.concession_staff.toLowerCase().includes(searchLower)) ||
            (schedule.venue && schedule.venue.toLowerCase().includes(searchLower)) ||
            (schedule.division && schedule.division.toLowerCase().includes(searchLower))
        );
    }
    
    // Show/hide "No Results" banner
    showNoResultsBanner();
    
    // Render the filtered table
    renderScheduleTable();
    updateFilterCounts();
}

function clearAllFilters() {
    // Reset all filter inputs
    const filterInputs = [
        'filterSeason',
        'filterEventType', 
        'filterDivision',
        'filterVenue',
        'filterDateRange',
        'filterSearch'
    ];
    
    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'SELECT') {
                element.selectedIndex = 0;
    } else {
                element.value = '';
            }
        }
    });
    
    // Reset filtered schedules to all schedules
    filteredSchedules = [...allSchedules];
    
    // Repopulate all filter dropdowns with original options
    populateFilterDropdowns();
    
    // Re-render table and update counts
    renderScheduleTable();
    updateFilterCounts();
    
    // Hide the no results banner
    showNoResultsBanner();
}

function updateFilterCounts() {
    const totalCount = allSchedules.length;
    const filteredCount = filteredSchedules.length;
    
    const totalCountElement = document.getElementById('totalCount');
    const filteredCountElement = document.getElementById('filteredCount');
    
    if (totalCountElement) totalCountElement.textContent = totalCount;
    if (filteredCountElement) filteredCountElement.textContent = filteredCount;
    
    // Check if any filters are active
    const seasonFilter = document.getElementById('filterSeason')?.value || '';
    const eventTypeFilter = document.getElementById('filterEventType')?.value || '';
    const divisionFilter = document.getElementById('filterDivision')?.value || '';
    const venueFilter = document.getElementById('filterVenue')?.value || '';
    const dateRangeFilter = document.getElementById('filterDateRange')?.value || '';
    const searchFilter = document.getElementById('filterSearch')?.value || '';
    
    const hasActiveFilters = seasonFilter || eventTypeFilter || divisionFilter || venueFilter || dateRangeFilter || searchFilter;
    
    // Update the filter counts display with better messaging
    if (hasActiveFilters && filteredCount === 0) {
        // Show warning when filters are active but return no results
        if (filteredCountElement) {
            filteredCountElement.innerHTML = `<span class="text-warning">0</span> <small class="text-muted">(No matches)</small>`;
        }
    } else if (hasActiveFilters && filteredCount > 0) {
        // Show success when filters return results
        if (filteredCountElement) {
            filteredCountElement.innerHTML = `<span class="text-success">${filteredCount}</span>`;
        }
    } else {
        // Show normal count when no filters are active
        if (filteredCountElement) {
            filteredCountElement.textContent = filteredCount;
        }
    }
}

// Show or hide the "No Results" banner
function showNoResultsBanner() {
    const bannerContainer = document.getElementById('noResultsBanner');
    if (!bannerContainer) return;
    
    // Check if any filters are active
    const seasonFilter = document.getElementById('filterSeason')?.value || '';
    const eventTypeFilter = document.getElementById('filterEventType')?.value || '';
    const divisionFilter = document.getElementById('filterDivision')?.value || '';
    const venueFilter = document.getElementById('filterVenue')?.value || '';
    const dateRangeFilter = document.getElementById('filterDateRange')?.value || '';
    const searchFilter = document.getElementById('filterSearch')?.value || '';
    
    const hasActiveFilters = seasonFilter || eventTypeFilter || divisionFilter || venueFilter || dateRangeFilter || searchFilter;
    
    if (hasActiveFilters && filteredSchedules.length === 0) {
        // Show banner when filters are active but return no results
        const activeFilters = [];
        if (seasonFilter) activeFilters.push(`Season: ${seasonFilter}`);
        if (eventTypeFilter) activeFilters.push(`Event Type: ${eventTypeFilter}`);
        if (divisionFilter) activeFilters.push(`Division: ${divisionFilter}`);
        if (venueFilter) activeFilters.push(`Venue: ${venueFilter}`);
        if (dateRangeFilter) activeFilters.push(`Date Range: ${dateRangeFilter}`);
        if (searchFilter) activeFilters.push(`Search: "${searchFilter}"`);
        
        bannerContainer.innerHTML = `
            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                <div class="d-flex align-items-center">
                    <i class="fas fa-exclamation-triangle fa-2x me-3 text-warning"></i>
                    <div class="flex-grow-1">
                        <h5 class="alert-heading mb-2">No Results Found!</h5>
                        <p class="mb-2">Your current filter criteria returned no matching schedules.</p>
                        <div class="mb-3">
                            <strong>Active Filters:</strong>
                            ${activeFilters.map(filter => `<span class="badge bg-warning text-dark me-2">${filter}</span>`).join('')}
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-warning btn-sm" onclick="clearAllFilters()">
                                <i class="fas fa-times me-2"></i>Clear All Filters
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="showSection('schedules')">
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
}

// Duplicate functions removed - these are already defined above

// Umpire Management Functions
let allPlateUmpires = [];
let allBaseUmpires = [];

// CSV upload data for umpires
let plateUmpiresCsvData = null;
let baseUmpiresCsvData = null;

function showAddPlateUmpireModal() {
    const modal = new bootstrap.Modal(document.getElementById('addPlateUmpireModal'));
    modal.show();
}

function showAddBaseUmpireModal() {
    const modal = new bootstrap.Modal(document.getElementById('addBaseUmpireModal'));
    modal.show();
}

function showPlateUmpiresUploadModal() {
    const modal = new bootstrap.Modal(document.getElementById('plateUmpiresUploadModal'));
    modal.show();
}

function showBaseUmpiresUploadModal() {
    const modal = new bootstrap.Modal(document.getElementById('baseUmpiresUploadModal'));
    modal.show();
}

function showEditPlateUmpireModal(id) {
    const umpire = allPlateUmpires.find(u => u.id === id);
    if (!umpire) return;
    
    document.getElementById('editPlateUmpireId').value = umpire.id;
    document.getElementById('editPlateUmpireName').value = umpire.name;
    document.getElementById('editPlateUmpireEmail').value = umpire.email || '';
    document.getElementById('editPlateUmpirePhone').value = umpire.phone || '';
    document.getElementById('editPlateUmpireAvailability').value = umpire.availability || 'Available';
    
    const modal = new bootstrap.Modal(document.getElementById('editPlateUmpireModal'));
    modal.show();
}

function showEditBaseUmpireModal(id) {
    const umpire = allBaseUmpires.find(u => u.id === id);
    if (!umpire) return;
    
    document.getElementById('editBaseUmpireId').value = umpire.id;
    document.getElementById('editBaseUmpireName').value = umpire.name;
    document.getElementById('editBaseUmpireEmail').value = umpire.email || '';
    document.getElementById('editBaseUmpirePhone').value = umpire.phone || '';
    document.getElementById('editBaseUmpireAvailability').value = umpire.availability || 'Available';
    
    const modal = new bootstrap.Modal(document.getElementById('editBaseUmpireModal'));
    modal.show();
}

// Plate Umpires CSV Functions
function handlePlateUmpiresCSVFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        plateUmpiresCsvData = file;
        document.getElementById('plateUmpiresCsvUploadArea').classList.add('file-selected');
        document.getElementById('plateUmpiresCsvUploadArea').innerHTML = `
            <i class="fas fa-file-csv text-success"></i>
            <h5>File Selected: ${file.name}</h5>
            <p>Ready to upload</p>
        `;
    }
}

function handlePlateUmpiresDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handlePlateUmpiresDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            plateUmpiresCsvData = file;
            document.getElementById('plateUmpiresCsvUploadArea').classList.add('file-selected');
            document.getElementById('plateUmpiresCsvUploadArea').innerHTML = `
                <i class="fas fa-file-csv text-success"></i>
                <h5>File Selected: ${file.name}</h5>
                <p>Ready to upload</p>
            `;
        } else {
            showAlert('Please select a valid CSV file', 'warning');
        }
    }
}

function handlePlateUmpiresDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

async function uploadPlateUmpiresCSV() {
    if (!plateUmpiresCsvData) {
        showAlert('Please select a CSV file first', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('csv', plateUmpiresCsvData);

    try {
        const response = await fetch('/api/upload-plate-umpires-csv', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (response.ok) {
            renderPlateUmpiresCSVResultReport(result);
            // Auto-close after 15 seconds on success
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('plateUmpiresUploadModal')).hide();
                resetPlateUmpiresCSVModalState();
                loadPlateUmpires(); // Reload the table
            }, 15000);
        } else {
            renderPlateUmpiresCSVResultReport(result);
        }
    } catch (error) {
        console.error('❌ Error uploading plate umpires CSV:', error);
        showAlert('Error uploading CSV file', 'danger');
    }
}

function renderPlateUmpiresCSVResultReport(result) {
    const summary = document.getElementById('plateUmpiresCsvResultSummary');
    const rowErrors = document.getElementById('plateUmpiresCsvRowErrors');
    const reportDiv = document.getElementById('plateUmpiresCsvResultReport');

    if (!summary || !rowErrors || !reportDiv) return;

    reportDiv.style.display = 'block';

    const isFormatError = result.formatError;
    const alertClass = result.committed ? 'alert-success' : 'alert-danger';

    summary.className = `alert ${alertClass}`;
    
    if (isFormatError) {
        summary.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle text-danger me-2"></i>
                <div>
                    <strong>CSV Format Error!</strong><br>
                    <span class="text-danger">${result.message}</span>
                </div>
            </div>
        `;
        rowErrors.innerHTML = `
            <div class="card border-danger">
                <div class="card-header py-2 bg-danger text-white">
                    <strong><i class="fas fa-times-circle me-2"></i>Format Mismatch</strong>
                </div>
                <div class="card-body p-3">
                    <div class="row">
                        <div class="col-md-6">
                            <h6 class="text-danger">Expected Columns:</h6>
                            <div class="d-flex flex-wrap gap-1">
                                ${(result.expectedColumns || []).map(col => 
                                    `<span class="badge bg-success">${col}</span>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6 class="text-danger">Received Columns:</h6>
                            <div class="d-flex flex-wrap gap-1">
                                ${(result.receivedColumns || []).map(col => 
                                    `<span class="badge bg-secondary">${col}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <h6 class="text-danger">Missing Required Columns:</h6>
                        <div class="d-flex flex-wrap gap-1">
                            ${(result.rowErrors?.[0]?.errors || []).map(error => 
                                `<span class="badge bg-danger">${escapeHtml(error)}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        summary.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${result.committed ? 'check-circle text-success' : 'exclamation-triangle text-warning'} me-2"></i>
                <div>
                    <strong>${result.message}</strong><br>
                    <span class="text-${result.committed ? 'success' : 'warning'}">
                        ${result.committed ? `${result.successCount} of ${result.totalRows} plate umpires added successfully` : `${result.errorCount} errors found`}
                    </span>
                </div>
            </div>
        `;

        if (result.rowErrors && result.rowErrors.length > 0) {
            rowErrors.innerHTML = `
                <div class="card border-warning">
                    <div class="card-header py-2 bg-warning text-dark">
                        <strong><i class="fas fa-exclamation-triangle me-2"></i>Row Errors (${result.rowErrors.length})</strong>
                    </div>
                    <div class="card-body p-3">
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Row</th>
                                        <th>Errors</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${result.rowErrors.map(error => `
                                        <tr>
                                            <td><strong>${error.row}</strong></td>
                                            <td>
                                                ${error.errors.map(err => `<span class="badge bg-danger">${escapeHtml(err)}</span>`).join(' ')}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        } else {
            rowErrors.innerHTML = '';
        }
    }
}

function resetPlateUmpiresCSVModalState() {
    plateUmpiresCsvData = null;
    document.getElementById('plateUmpiresCsvUploadArea').classList.remove('file-selected');
    document.getElementById('plateUmpiresCsvUploadArea').innerHTML = `
        <i class="fas fa-user-tie"></i>
        <h5>Drag & Drop Plate Umpires CSV File</h5>
        <p>or click to browse</p>
        <input type="file" id="plateUmpiresCsvFile" accept=".csv" style="display: none;" onchange="handlePlateUmpiresCSVFileSelect(event)">
    `;
    document.getElementById('plateUmpiresCsvResultReport').style.display = 'none';
}

// Base Umpires CSV Functions
function handleBaseUmpiresCSVFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        baseUmpiresCsvData = file;
        document.getElementById('baseUmpiresCsvUploadArea').classList.add('file-selected');
        document.getElementById('baseUmpiresCsvUploadArea').innerHTML = `
            <i class="fas fa-file-csv text-success"></i>
            <h5>File Selected: ${file.name}</h5>
            <p>Ready to upload</p>
        `;
    }
}

function handleBaseUmpiresDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleBaseUmpiresDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            baseUmpiresCsvData = file;
            document.getElementById('baseUmpiresCsvUploadArea').classList.add('file-selected');
            document.getElementById('baseUmpiresCsvUploadArea').innerHTML = `
                <i class="fas fa-file-csv text-success"></i>
                <h5>File Selected: ${file.name}</h5>
                <p>Ready to upload</p>
            `;
        } else {
            showAlert('Please select a valid CSV file', 'warning');
        }
    }
}

function handleBaseUmpiresDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

async function uploadBaseUmpiresCSV() {
    if (!baseUmpiresCsvData) {
        showAlert('Please select a CSV file first', 'warning');
            return;
        }
        
    const formData = new FormData();
    formData.append('csv', baseUmpiresCsvData);

    try {
        const response = await fetch('/api/upload-base-umpires-csv', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (response.ok) {
            renderBaseUmpiresCSVResultReport(result);
            // Auto-close after 15 seconds on success
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('baseUmpiresUploadModal')).hide();
                resetBaseUmpiresCSVModalState();
                loadBaseUmpires(); // Reload the table
            }, 15000);
        } else {
            renderBaseUmpiresCSVResultReport(result);
        }
    } catch (error) {
        console.error('❌ Error uploading base umpires CSV:', error);
        showAlert('Error uploading CSV file', 'danger');
    }
}

function renderBaseUmpiresCSVResultReport(result) {
    const summary = document.getElementById('baseUmpiresCsvResultSummary');
    const rowErrors = document.getElementById('baseUmpiresCsvRowErrors');
    const reportDiv = document.getElementById('baseUmpiresCsvResultReport');

    if (!summary || !rowErrors || !reportDiv) return;

    reportDiv.style.display = 'block';

    const isFormatError = result.formatError;
    const alertClass = result.committed ? 'alert-success' : 'alert-danger';

    summary.className = `alert ${alertClass}`;
    
    if (isFormatError) {
        summary.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle text-danger me-2"></i>
                <div>
                    <strong>CSV Format Error!</strong><br>
                    <span class="text-danger">${result.message}</span>
                </div>
            </div>
        `;
        rowErrors.innerHTML = `
            <div class="card border-danger">
                <div class="card-header py-2 bg-danger text-white">
                    <strong><i class="fas fa-times-circle me-2"></i>Format Mismatch</strong>
                </div>
                <div class="card-body p-3">
                    <div class="row">
                        <div class="col-md-6">
                            <h6 class="text-danger">Expected Columns:</h6>
                            <div class="d-flex flex-wrap gap-1">
                                ${(result.expectedColumns || []).map(col => 
                                    `<span class="badge bg-success">${col}</span>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6 class="text-danger">Received Columns:</h6>
                            <div class="d-flex flex-wrap gap-1">
                                ${(result.receivedColumns || []).map(col => 
                                    `<span class="badge bg-secondary">${col}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <h6 class="text-danger">Missing Required Columns:</h6>
                        <div class="d-flex flex-wrap gap-1">
                            ${(result.rowErrors?.[0]?.errors || []).map(error => 
                                `<span class="badge bg-danger">${escapeHtml(error)}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        summary.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${result.committed ? 'check-circle text-success' : 'exclamation-triangle text-warning'} me-2"></i>
                <div>
                    <strong>${result.message}</strong><br>
                    <span class="text-${result.committed ? 'success' : 'warning'}">
                        ${result.committed ? `${result.successCount} of ${result.totalRows} base umpires added successfully` : `${result.errorCount} errors found`}
                    </span>
                </div>
            </div>
        `;

        if (result.rowErrors && result.rowErrors.length > 0) {
            rowErrors.innerHTML = `
                <div class="card border-warning">
                    <div class="card-header py-2 bg-warning text-dark">
                        <strong><i class="fas fa-exclamation-triangle me-2"></i>Row Errors (${result.rowErrors.length})</strong>
                    </div>
                    <div class="card-body p-3">
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Row</th>
                                        <th>Errors</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${result.rowErrors.map(error => `
                                        <tr>
                                            <td><strong>${error.row}</strong></td>
                                            <td>
                                                ${error.errors.map(err => `<span class="badge bg-danger">${escapeHtml(err)}</span>`).join(' ')}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        } else {
            rowErrors.innerHTML = '';
        }
    }
}

function resetBaseUmpiresCSVModalState() {
    baseUmpiresCsvData = null;
    document.getElementById('baseUmpiresCsvUploadArea').classList.remove('file-selected');
    document.getElementById('baseUmpiresCsvUploadArea').innerHTML = `
        <i class="fas fa-user-tie"></i>
        <h5>Drag & Drop Base Umpires CSV File</h5>
        <p>or click to browse</p>
        <input type="file" id="baseUmpiresCsvFile" accept=".csv" style="display: none;" onchange="handleBaseUmpiresCSVFileSelect(event)">
    `;
    document.getElementById('baseUmpiresCsvResultReport').style.display = 'none';
}

async function loadPlateUmpires() {
    try {
        const response = await fetch('/api/plate-umpires');
        if (!response.ok) throw new Error('Failed to fetch plate umpires');
        
        allPlateUmpires = await response.json();
        renderPlateUmpiresTable();
    } catch (error) {
        console.error('❌ Error loading plate umpires:', error);
        showAlert('Error loading plate umpires', 'danger');
    }
}

async function loadBaseUmpires() {
    try {
        const response = await fetch('/api/base-umpires');
        if (!response.ok) throw new Error('Failed to fetch base umpires');
        
        allBaseUmpires = await response.json();
        renderBaseUmpiresTable();
    } catch (error) {
        console.error('❌ Error loading base umpires:', error);
        showAlert('Error loading base umpires', 'danger');
    }
}

function renderPlateUmpiresTable() {
    const tbody = document.getElementById('plateUmpiresTableBody');
    if (!tbody) return;
    
    if (allPlateUmpires.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No plate umpires found</td></tr>';
        return;
    }
    
    tbody.innerHTML = allPlateUmpires.map(umpire => `
        <tr>
            <td>
                <input type="checkbox" name="plateUmpireCheckbox" value="${umpire.id}" 
                       onchange="togglePlateUmpireSelection(this)" 
                       ${selectedPlateUmpireIds.has(umpire.id) ? 'checked' : ''}>
            </td>
            <td><strong>${umpire.name || 'N/A'}</strong></td>
            <td>${umpire.email || '<em class="text-muted">Not provided</em>'}</td>
            <td>${umpire.phone || '<em class="text-muted">Not provided</em>'}</td>
            <td><span class="badge bg-${getAvailabilityBadgeClass(umpire.availability)}">${umpire.availability || 'Available'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="showEditPlateUmpireModal(${umpire.id})" title="Edit Plate Umpire">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deletePlateUmpire(${umpire.id})" title="Delete Plate Umpire">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderBaseUmpiresTable() {
    const tbody = document.getElementById('baseUmpiresTableBody');
    if (!tbody) return;
    
    if (allBaseUmpires.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No base umpires found</td></tr>';
        return;
    }
    
    tbody.innerHTML = allBaseUmpires.map(umpire => `
        <tr>
            <td>
                <input type="checkbox" name="baseUmpireCheckbox" value="${umpire.id}" 
                       onchange="toggleBaseUmpireSelection(this)" 
                       ${selectedBaseUmpireIds.has(umpire.id) ? 'checked' : ''}>
            </td>
            <td><strong>${umpire.name || 'N/A'}</strong></td>
            <td>${umpire.email || '<em class="text-muted">Not provided</em>'}</td>
            <td>${umpire.phone || '<em class="text-muted">Not provided</em>'}</td>
            <td><span class="badge bg-${getAvailabilityBadgeClass(umpire.availability)}">${umpire.availability || 'Available'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="showEditBaseUmpireModal(${umpire.id})" title="Edit Base Umpire">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteBaseUmpire(${umpire.id})" title="Delete Base Umpire">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getAvailabilityBadgeClass(availability) {
    switch (availability) {
        case 'Available': return 'success';
        case 'Unavailable': return 'danger';
        case 'Part-time': return 'warning';
        default: return 'secondary';
    }
}

async function deletePlateUmpire(id) {
    if (!confirm('Are you sure you want to delete this plate umpire?')) return;
    
    try {
        const response = await fetch(`/api/plate-umpires/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete plate umpire');
        
        showAlert('Plate umpire deleted successfully!', 'success');
        await loadPlateUmpires();
    } catch (error) {
        console.error('❌ Error deleting plate umpire:', error);
        showAlert('Error deleting plate umpire', 'danger');
    }
}

async function deleteBaseUmpire(id) {
    if (!confirm('Are you sure you want to delete this base umpire?')) return;
    
    try {
        const response = await fetch(`/api/base-umpires/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete base umpire');
        
        showAlert('Base umpire deleted successfully!', 'success');
        await loadBaseUmpires();
    } catch (error) {
        console.error('❌ Error deleting base umpire:', error);
        showAlert('Error deleting base umpire', 'danger');
    }
}

// Utility functions

// Handle edit plate umpire form submission
async function handleEditPlateUmpireSubmit(e) {
    e.preventDefault();
    
    const umpireId = document.getElementById('editPlateUmpireId').value;
    const formData = {
        name: document.getElementById('editPlateUmpireName').value,
        email: document.getElementById('editPlateUmpireEmail').value,
        phone: document.getElementById('editPlateUmpirePhone').value,
        availability: document.getElementById('editPlateUmpireAvailability').value
    };
    
    console.log('📝 Updating plate umpire:', umpireId, 'with data:', formData);
    
    try {
        const response = await fetch(`/api/plate-umpires/${umpireId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to update plate umpire');

        const result = await response.json();
        console.log('✅ Plate umpire updated successfully:', result);
        
        showAlert('Plate umpire updated successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('editPlateUmpireModal')).hide();
        
        // Reload plate umpires to show the updated one
        await loadPlateUmpires();
    } catch (error) {
        console.error('❌ Error updating plate umpire:', error);
        showAlert('Error updating plate umpire. Please try again.', 'danger');
    }
}

// Handle edit base umpire form submission
async function handleEditBaseUmpireSubmit(e) {
    e.preventDefault();
    
    const umpireId = document.getElementById('editBaseUmpireId').value;
    const formData = {
        name: document.getElementById('editBaseUmpireName').value,
        email: document.getElementById('editBaseUmpireEmail').value,
        phone: document.getElementById('editBaseUmpirePhone').value,
        availability: document.getElementById('editBaseUmpireAvailability').value
    };
    
    console.log('📝 Updating base umpire:', umpireId, 'with data:', formData);
    
    try {
        const response = await fetch(`/api/base-umpires/${umpireId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to update base umpire');
        
        const result = await response.json();
        console.log('✅ Base umpire updated successfully:', result);
        
        showAlert('Base umpire updated successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('editBaseUmpireModal')).hide();
        
        // Reload base umpires to show the updated one
        await loadBaseUmpires();
    } catch (error) {
        console.error('❌ Error updating base umpire:', error);
        showAlert('Error updating base umpire. Please try again.', 'danger');
    }
}

// Test function to create a sample umpire request (for debugging)
async function createTestUmpireRequest() {
    try {
        const testData = {
            game_id: 249, // Use an existing game ID
            current_plate_umpire: 'Dylan LeLacheur',
            current_base_umpire: 'Scott Patenaude',
            requested_plate_umpire: 'Arthur DeSouza',
            requested_base_umpire: 'Brady Foote',
            reason: 'Test request for debugging'
        };
        
        console.log('🧪 Creating test umpire request:', testData);
        
        const response = await fetch('/api/umpire-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        if (!response.ok) throw new Error('Failed to create test request');
        
        const result = await response.json();
        console.log('✅ Test umpire request created:', result);
        
        // Reload requests to show the new one
        await loadUmpireRequests();
        
        showAlert('Test umpire request created successfully!', 'success');
    } catch (error) {
        console.error('❌ Error creating test request:', error);
        showAlert('Error creating test request. Please try again.', 'danger');
    }
}

// Make the test function available globally for debugging
window.createTestUmpireRequest = createTestUmpireRequest;

// Bulk Delete Plate Umpires Functions
let selectedPlateUmpireIds = new Set();

function toggleSelectAllPlateUmpires() {
    const selectAllCheckbox = document.getElementById('selectAllPlateUmpires');
    const plateUmpireCheckboxes = document.querySelectorAll('input[name="plateUmpireCheckbox"]');
    
    plateUmpireCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        if (selectAllCheckbox.checked) {
            selectedPlateUmpireIds.add(parseInt(checkbox.value));
        } else {
            selectedPlateUmpireIds.delete(parseInt(checkbox.value));
        }
    });
    
    updateBulkDeletePlateUmpiresUI();
}

function togglePlateUmpireSelection(checkbox) {
    if (checkbox.checked) {
        selectedPlateUmpireIds.add(parseInt(checkbox.value));
    } else {
        selectedPlateUmpireIds.delete(parseInt(checkbox.value));
    }
    
    updateBulkDeletePlateUmpiresUI();
}

function updateBulkDeletePlateUmpiresUI() {
    const bulkDeleteBtn = document.getElementById('bulkDeletePlateUmpiresBtn');
    const selectAllCheckbox = document.getElementById('selectAllPlateUmpires');
    
    if (selectedPlateUmpireIds.size > 0) {
        bulkDeleteBtn.style.display = 'inline-block';
    } else {
        bulkDeleteBtn.style.display = 'none';
    }
    
    // Update select all checkbox state
    const plateUmpireCheckboxes = document.querySelectorAll('input[name="plateUmpireCheckbox"]');
    const checkedCount = Array.from(plateUmpireCheckboxes).filter(cb => cb.checked).length;
    
    if (checkedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === plateUmpireCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

function bulkDeletePlateUmpires() {
    if (selectedPlateUmpireIds.size === 0) {
        showAlert('Please select plate umpires to delete', 'warning');
        return;
    }
    
    // Show confirmation modal
    const modal = new bootstrap.Modal(document.getElementById('bulkDeletePlateUmpiresModal'));
    const deleteCount = document.getElementById('deletePlateUmpiresCount');
    const plateUmpiresToDelete = document.getElementById('plateUmpiresToDelete');
    
    deleteCount.textContent = selectedPlateUmpireIds.size;
    
    // Get plate umpire names for display
    const selectedPlateUmpires = Array.from(selectedPlateUmpireIds).map(id => {
        const umpire = allPlateUmpires.find(u => u.id === id);
        return umpire ? umpire.name : `Plate Umpire ID ${id}`;
    });
    
    plateUmpiresToDelete.innerHTML = selectedPlateUmpires.map(name => 
        `<div class="mb-1"><i class="fas fa-user-tie me-2"></i>${escapeHtml(name)}</div>`
    ).join('');
    
    modal.show();
}

async function confirmBulkDeletePlateUmpires() {
    try {
        const response = await fetch('/api/plate-umpires/bulk-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ids: Array.from(selectedPlateUmpireIds)
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete plate umpires');
        }
        
        const result = await response.json();
        console.log('✅ Bulk delete plate umpires result:', result);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('bulkDeletePlateUmpiresModal'));
        if (modal) modal.hide();
        
        // Show success message
        showAlert(result.message, 'success');
        
        // Clear selection and reload plate umpires
        selectedPlateUmpireIds.clear();
        await loadPlateUmpires();
        
    } catch (error) {
        console.error('❌ Error bulk deleting plate umpires:', error);
        showAlert(`Error deleting plate umpires: ${error.message}`, 'danger');
    }
}

// Bulk Delete Base Umpires Functions
let selectedBaseUmpireIds = new Set();

function toggleSelectAllBaseUmpires() {
    const selectAllCheckbox = document.getElementById('selectAllBaseUmpires');
    const baseUmpireCheckboxes = document.querySelectorAll('input[name="baseUmpireCheckbox"]');
    
    baseUmpireCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        if (selectAllCheckbox.checked) {
            selectedBaseUmpireIds.add(parseInt(checkbox.value));
        } else {
            selectedBaseUmpireIds.delete(parseInt(checkbox.value));
        }
    });
    
    updateBulkDeleteBaseUmpiresUI();
}

function toggleBaseUmpireSelection(checkbox) {
    if (checkbox.checked) {
        selectedBaseUmpireIds.add(parseInt(checkbox.value));
    } else {
        selectedBaseUmpireIds.delete(parseInt(checkbox.value));
    }
    
    updateBulkDeleteBaseUmpiresUI();
}

function updateBulkDeleteBaseUmpiresUI() {
    const bulkDeleteBtn = document.getElementById('bulkDeleteBaseUmpiresBtn');
    const selectAllCheckbox = document.getElementById('selectAllBaseUmpires');
    
    if (selectedBaseUmpireIds.size > 0) {
        bulkDeleteBtn.style.display = 'inline-block';
        bulkDeleteBtn.innerHTML = `<i class="fas fa-trash-alt me-2"></i>Delete Selected (${selectedBaseUmpireIds.size})`;
    } else {
        bulkDeleteBtn.style.display = 'none';
    }
    
    // Update select all checkbox state
    const baseUmpireCheckboxes = document.querySelectorAll('input[name="baseUmpireCheckbox"]');
    const checkedCount = Array.from(baseUmpireCheckboxes).filter(cb => cb.checked).length;
    
    if (checkedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === baseUmpireCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

function bulkDeleteBaseUmpires() {
    if (selectedBaseUmpireIds.size === 0) {
        showAlert('Please select base umpires to delete', 'warning');
        return;
    }
    
    // Show confirmation modal
    const modal = new bootstrap.Modal(document.getElementById('bulkDeleteBaseUmpiresModal'));
    const deleteCount = document.getElementById('deleteBaseUmpiresCount');
    const baseUmpiresToDelete = document.getElementById('baseUmpiresToDelete');
    
    deleteCount.textContent = selectedBaseUmpireIds.size;
    
    // Get base umpire names for display
    const selectedBaseUmpires = Array.from(selectedBaseUmpireIds).map(id => {
        const umpire = allBaseUmpires.find(u => u.id === id);
        return umpire ? umpire.name : `Base Umpire ID ${id}`;
    });
    
    baseUmpiresToDelete.innerHTML = selectedBaseUmpires.map(name => 
        `<div class="mb-1"><i class="fas fa-user-tie me-2"></i>${escapeHtml(name)}</div>`
    ).join('');
    
    modal.show();
}

async function confirmBulkDeleteBaseUmpires() {
    try {
        const response = await fetch('/api/base-umpires/bulk-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ids: Array.from(selectedBaseUmpireIds)
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete base umpires');
        }
        
        const result = await response.json();
        console.log('✅ Bulk delete base umpires result:', result);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('bulkDeleteBaseUmpiresModal'));
        if (modal) modal.hide();
        
        // Show success message
        showAlert(result.message, 'success');
        
        // Clear selection and reload base umpires
        selectedBaseUmpireIds.clear();
        await loadBaseUmpires();
        
    } catch (error) {
        console.error('❌ Error bulk deleting base umpires:', error);
        showAlert(`Error deleting base umpires: ${error.message}`, 'danger');
    }
}