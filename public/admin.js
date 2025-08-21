// Global variables
let allSchedules = [];
let allUmpireRequests = [];
let allStaff = [];
let selectedSchedules = new Set();
let csvData = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadSchedules();
    loadUmpireRequests();
    loadStaff();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Schedule form submission
    document.getElementById('scheduleForm').addEventListener('submit', handleScheduleSubmit);
    
    // CSV file input
    document.getElementById('csvFile').addEventListener('change', handleCSVFileSelect);
    
    // CSV drag and drop
    const csvUploadArea = document.getElementById('csvUploadArea');
    csvUploadArea.addEventListener('dragover', handleDragOver);
    csvUploadArea.addEventListener('drop', handleDrop);
    csvUploadArea.addEventListener('dragleave', handleDragLeave);
}

// Load all schedules
async function loadSchedules() {
    try {
        const response = await fetch('/api/schedules');
        if (!response.ok) throw new Error('Failed to fetch schedules');
        
        allSchedules = await response.json();
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
        renderUmpireRequestsTable();
    } catch (error) {
        console.error('Error loading umpire requests:', error);
        showAlert('Error loading umpire requests. Please try again.', 'danger');
    }
}

// Load staff directory
async function loadStaff() {
    try {
        const response = await fetch('/api/staff');
        if (!response.ok) throw new Error('Failed to fetch staff');
        
        allStaff = await response.json();
        renderStaffTable();
        populateStaffDropdowns();
    } catch (error) {
        console.error('Error loading staff:', error);
        showAlert('Error loading staff directory. Please try again.', 'danger');
        // Initialize empty array to prevent errors
        allStaff = [];
    }
}

// Populate staff dropdowns in forms
function populateStaffDropdowns() {
    if (!allStaff || allStaff.length === 0) {
        console.log('No staff data available yet');
        return;
    }

    const isRole = (s, key) => ((s.role || '').toLowerCase().includes(key));

    const umpireOptions = allStaff
        .filter(staff => isRole(staff, 'umpire'))
        .map(staff => `<option value="${staff.name}">${staff.name}</option>`) 
        .join('');

    const concessionOptions = allStaff
        .filter(staff => isRole(staff, 'concession'))
        .map(staff => `<option value="${staff.name}">${staff.name}</option>`)
        .join('');

    // Populate concession staff dropdowns
    const concessionStaffSelects = ['concessionStaff', 'editConcessionStaff'];
    concessionStaffSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select Staff Member</option>' + concessionOptions;
        }
    });

    // Populate umpire dropdowns
    const umpireSelects = ['plateUmpire', 'baseUmpire', 'editPlateUmpire', 'editBaseUmpire'];
    umpireSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select Umpire</option>' + umpireOptions;
        }
    });
}

// Render staff table
function renderStaffTable() {
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) return;
    
    if (allStaff.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data">
                    <i class="fas fa-info-circle me-2"></i>No staff members found. Add your first staff member above.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = allStaff.map(staff => `
        <tr>
            <td><strong>${staff.name || 'N/A'}</strong></td>
            <td>${staff.email || '<em class="text-muted">Not provided</em>'}</td>
            <td>${staff.phone || '<em class="text-muted">Not provided</em>'}</td>
            <td>${staff.parent_name || '<em class="text-muted">Not provided</em>'}</td>
            <td>${staff.parent_email || '<em class="text-muted">Not provided</em>'}</td>
            <td>${staff.parent_phone || '<em class="text-muted">Not provided</em>'}</td>
            <td><span class="badge bg-info">${staff.role || 'Staff'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editStaff(${staff.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteStaff(${staff.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Show add staff modal
function showAddStaffModal() {
    document.getElementById('addStaffForm').reset();
    const modal = new bootstrap.Modal(document.getElementById('addStaffModal'));
    modal.show();
}

// Add staff member
async function addStaffMember() {
    const formData = {
        name: document.getElementById('staffName').value,
        email: document.getElementById('staffEmail').value,
        phone: document.getElementById('staffPhone').value,
        parent_name: document.getElementById('staffParentName').value,
        parent_email: document.getElementById('staffParentEmail').value,
        parent_phone: document.getElementById('staffParentPhone').value,
        role: document.getElementById('staffRole').value
    };

    try {
        const response = await fetch('/api/staff', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to add staff member');

        const result = await response.json();
        showAlert('Staff member added successfully!', 'success');
        
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addStaffModal'));
        modal.hide();
        
        // Reload staff and schedules
        loadStaff();
        
    } catch (error) {
        console.error('Error adding staff member:', error);
        showAlert('Error adding staff member. Please try again.', 'danger');
    }
}

// Edit staff member
function editStaff(staffId) {
    const staff = allStaff.find(s => s.id === staffId);
    if (!staff) return;

    // Populate edit form
    document.getElementById('editStaffId').value = staff.id;
    document.getElementById('editStaffName').value = staff.name;
    document.getElementById('editStaffEmail').value = staff.email || '';
    document.getElementById('editStaffPhone').value = staff.phone || '';
    document.getElementById('editStaffParentName').value = staff.parent_name || '';
    document.getElementById('editStaffParentEmail').value = staff.parent_email || '';
    document.getElementById('editStaffParentPhone').value = staff.parent_phone || '';
    document.getElementById('editStaffRole').value = staff.role || 'Staff';

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editStaffModal'));
    modal.show();
}

// Update staff member
async function updateStaffMember() {
    const staffId = document.getElementById('editStaffId').value;
    
    const formData = {
        name: document.getElementById('editStaffName').value,
        email: document.getElementById('editStaffEmail').value,
        phone: document.getElementById('editStaffPhone').value,
        parent_name: document.getElementById('editStaffParentName').value,
        parent_email: document.getElementById('editStaffParentEmail').value,
        parent_phone: document.getElementById('editStaffParentPhone').value,
        role: document.getElementById('editStaffRole').value
    };

    try {
        const response = await fetch(`/api/staff/${staffId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to update staff member');

        const result = await response.json();
        showAlert('Staff member updated successfully!', 'success');
        
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editStaffModal'));
        modal.hide();
        
        // Reload staff and schedules
        loadStaff();
        
    } catch (error) {
        console.error('Error updating staff member:', error);
        showAlert('Error updating staff member. Please try again.', 'danger');
    }
}

// Delete staff member
async function deleteStaff(staffId) {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
        const response = await fetch(`/api/staff/${staffId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete staff member');

        const result = await response.json();
        showAlert('Staff member deleted successfully!', 'success');
        
        // Reload staff and schedules
        loadStaff();
        
    } catch (error) {
        console.error('Error deleting staff member:', error);
        showAlert('Error deleting staff member. Please try again.', 'danger');
    }
}

// Handle schedule form submission
async function handleScheduleSubmit(event) {
    event.preventDefault();
    
    const formData = {
        season: document.getElementById('season').value,
        event_type: document.getElementById('eventType').value,
        day: document.getElementById('day').value,
        date: document.getElementById('date').value,
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

    try {
        const response = await fetch('/api/schedules', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to create schedule');

        const result = await response.json();
        showAlert('Schedule created successfully!', 'success');
        
        // Reset form
        document.getElementById('scheduleForm').reset();
        
        // Reload schedules
        loadSchedules();
        
    } catch (error) {
        console.error('Error creating schedule:', error);
        showAlert('Error creating schedule. Please try again.', 'danger');
    }
}

// Render schedule table
function renderScheduleTable() {
    const tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;
    
    if (allSchedules.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="13" class="no-data">
                    <i class="fas fa-info-circle me-2"></i>No schedules found. Create your first schedule above.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = allSchedules.map(schedule => `
        <tr>
            <td>
                <input type="checkbox" class="schedule-checkbox" value="${schedule.id}" onchange="toggleScheduleSelection(${schedule.id})">
            </td>
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
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editSchedule(${schedule.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteSchedule(${schedule.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Render umpire requests table
function renderUmpireRequestsTable() {
    const tbody = document.getElementById('umpireRequestsTableBody');
    if (!tbody) return;
    
    if (allUmpireRequests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <i class="fas fa-info-circle me-2"></i>No umpire change requests found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = allUmpireRequests.map(request => `
        <tr>
            <td>
                <div><strong>${request.home_team || 'N/A'} vs ${request.visitor_team || 'N/A'}</strong></div>
                <div>${formatDate(request.date)} at ${request.start_time || 'N/A'}</div>
                <div><small class="text-muted">${request.venue || 'N/A'} - ${request.division || 'N/A'}</small></div>
            </td>
            <td>
                <div><strong>Plate:</strong> ${request.current_plate_umpire || 'N/A'}</div>
                <div><strong>Base:</strong> ${request.current_base_umpire || 'N/A'}</div>
            </td>
            <td>
                ${request.requested_plate_umpire ? `<div><strong>Plate:</strong> ${request.requested_plate_umpire}</div>` : ''}
                ${request.requested_base_umpire ? `<div><strong>Base:</strong> ${request.requested_base_umpire}</div>` : ''}
                ${!request.requested_plate_umpire && !request.requested_base_umpire ? '<em>No changes requested</em>' : ''}
            </td>
            <td>${request.reason || 'N/A'}</td>
            <td>
                <span class="badge status-badge ${getStatusBadgeClass(request.status)}">
                    ${request.status || 'pending'}
                </span>
            </td>
            <td>${formatDate(request.created_at)}</td>
            <td>
                <button class="btn btn-sm btn-outline-success me-1" onclick="updateRequestStatus(${request.id}, 'approved')">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger me-1" onclick="updateRequestStatus(${request.id}, 'rejected')">
                    <i class="fas fa-times"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="updateRequestStatus(${request.id}, 'pending')">
                    <i class="fas fa-clock"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Get status badge class
function getStatusBadgeClass(status) {
    switch (status) {
        case 'approved': return 'bg-success';
        case 'rejected': return 'bg-danger';
        case 'pending': return 'bg-warning';
        default: return 'bg-secondary';
    }
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

// Edit schedule
function editSchedule(scheduleId) {
    const schedule = allSchedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    console.log('Editing schedule:', schedule);

    // Populate edit form
    document.getElementById('editScheduleId').value = schedule.id;
    document.getElementById('editSeason').value = schedule.season || '';
    document.getElementById('editEventType').value = schedule.event_type || '';
    document.getElementById('editDay').value = schedule.day || '';
    document.getElementById('editDate').value = schedule.date || '';
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

    console.log('Concession stand value set to:', schedule.concession_stand);
    console.log('Concession staff value set to:', schedule.concession_staff);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editScheduleModal'));
    modal.show();
}

// Update schedule
async function updateSchedule() {
    const scheduleId = document.getElementById('editScheduleId').value;
    
    const formData = {
        season: document.getElementById('editSeason').value,
        event_type: document.getElementById('editEventType').value,
        day: document.getElementById('editDay').value,
        date: document.getElementById('editDate').value,
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

    // Debug logging
    console.log('Updating schedule with ID:', scheduleId);
    console.log('Form data:', formData);
    console.log('Concession stand value:', document.getElementById('editConcessionStand').value);

    try {
        const response = await fetch(`/api/schedules/${scheduleId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response error:', errorText);
            throw new Error(`Failed to update schedule: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Update successful:', result);
        showAlert('Schedule updated successfully!', 'success');
        
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editScheduleModal'));
        modal.hide();
        
        // Reload schedules
        loadSchedules();
        
    } catch (error) {
        console.error('Error updating schedule:', error);
        showAlert(`Error updating schedule: ${error.message}`, 'danger');
    }
}

// Delete schedule
async function deleteSchedule(scheduleId) {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
        const response = await fetch(`/api/schedules/${scheduleId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete schedule');

        const result = await response.json();
        showAlert('Schedule deleted successfully!', 'success');
        
        // Reload schedules
        loadSchedules();
        
    } catch (error) {
        console.error('Error deleting schedule:', error);
        showAlert('Error deleting schedule. Please try again.', 'danger');
    }
}

// Toggle schedule selection
function toggleScheduleSelection(scheduleId) {
    if (selectedSchedules.has(scheduleId)) {
        selectedSchedules.delete(scheduleId);
    } else {
        selectedSchedules.add(scheduleId);
    }
    
    updateBulkDeleteButton();
}

// Toggle select all
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const scheduleCheckboxes = document.querySelectorAll('.schedule-checkbox');
    
    if (selectAllCheckbox.checked) {
        scheduleCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
            selectedSchedules.add(parseInt(checkbox.value));
        });
    } else {
        scheduleCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
            selectedSchedules.delete(parseInt(checkbox.value));
        });
    }
    
    updateBulkDeleteButton();
}

// Update bulk delete button visibility
function updateBulkDeleteButton() {
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    if (selectedSchedules.size > 0) {
        bulkDeleteBtn.style.display = 'inline-block';
        bulkDeleteBtn.textContent = `Delete Selected (${selectedSchedules.size})`;
    } else {
        bulkDeleteBtn.style.display = 'none';
    }
}

// Bulk delete schedules
async function bulkDelete() {
    if (selectedSchedules.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedSchedules.size} selected schedules?`)) return;

    try {
        const response = await fetch('/api/schedules/bulk-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids: Array.from(selectedSchedules) })
        });

        if (!response.ok) throw new Error('Failed to delete schedules');

        const result = await response.json();
        showAlert(result.message, 'success');
        
        // Clear selection
        selectedSchedules.clear();
        document.getElementById('selectAll').checked = false;
        updateBulkDeleteButton();
        
        // Reload schedules
        loadSchedules();
        
    } catch (error) {
        console.error('Error deleting schedules:', error);
        showAlert('Error deleting schedules. Please try again.', 'danger');
    }
}

// Update umpire request status
async function updateRequestStatus(requestId, status) {
    try {
        const response = await fetch(`/api/umpire-requests/${requestId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) throw new Error('Failed to update request status');

        const result = await response.json();
        showAlert(`Request status updated to ${status}`, 'success');
        
        // Reload umpire requests
        loadUmpireRequests();
        
    } catch (error) {
        console.error('Error updating request status:', error);
        showAlert('Error updating request status. Please try again.', 'danger');
    }
}

// Handle CSV file selection
function handleCSVFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processCSVFile(file);
    }
}

// Handle drag and drop
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            processCSVFile(file);
        } else {
            showAlert('Please select a valid CSV file.', 'warning');
        }
    }
}

// Process CSV file
function processCSVFile(file) {
    if (!file) {
        showAlert('No file selected.', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const lines = csv.split('\n');
            if (lines.length < 2) {
                showAlert('CSV file must have at least a header row and one data row.', 'warning');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim());
            
            // Validate headers
            const requiredHeaders = [
                'season', 'event_type', 'day', 'date', 'start_time', 'am_pm', 'division',
                'home_team', 'home_coach', 'visitor_team', 'visitor_coach',
                'venue', 'plate_umpire', 'base_umpire', 'concession_stand', 'concession_staff'
            ];
            
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            if (missingHeaders.length > 0) {
                showAlert(`Missing required columns: ${missingHeaders.join(', ')}`, 'danger');
                return;
            }
            
            // Parse CSV data
            csvData = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',').map(v => v.trim());
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    csvData.push(row);
                }
            }
            
            if (csvData.length === 0) {
                showAlert('No valid data rows found in CSV file.', 'warning');
                return;
            }
            
            // Show preview
            showCSVPreview();
        } catch (error) {
            console.error('Error processing CSV:', error);
            showAlert('Error processing CSV file. Please check the file format.', 'danger');
        }
    };
    
    reader.onerror = function() {
        showAlert('Error reading CSV file.', 'danger');
    };
    
    reader.readAsText(file);
}

// Show CSV preview
function showCSVPreview() {
    if (!csvData || csvData.length === 0) {
        showAlert('No CSV data to preview.', 'warning');
        return;
    }

    try {
        const previewDiv = document.getElementById('csvPreview');
        const previewBody = document.getElementById('csvPreviewBody');
        
        if (!previewDiv || !previewBody) {
            showAlert('Preview elements not found.', 'danger');
            return;
        }
        
        // Show first 5 rows for preview
        const previewRows = csvData.slice(0, 5);
        
        previewBody.innerHTML = previewRows.map(row => `
            <tr>
                <td>${row.season || ''}</td>
                <td>${row.event_type || ''}</td>
                <td>${row.day || ''}</td>
                <td>${row.date || ''}</td>
                <td>${row.start_time || ''}</td>
                <td>${row.am_pm || ''}</td>
                <td>${row.division || ''}</td>
                <td>${row.home_team || ''}</td>
                <td>${row.home_coach || ''}</td>
                <td>${row.visitor_team || ''}</td>
                <td>${row.visitor_coach || ''}</td>
                <td>${row.venue || ''}</td>
                <td>${row.plate_umpire || ''}</td>
                <td>${row.base_umpire || ''}</td>
                <td>${row.concession_stand || ''}</td>
                <td>${row.concession_staff || ''}</td>
            </tr>
        `).join('');
        
        previewDiv.style.display = 'block';
    } catch (error) {
        console.error('Error showing CSV preview:', error);
        showAlert('Error showing CSV preview.', 'danger');
    }
}

// Upload CSV
async function uploadCSV() {
    if (!csvData || csvData.length === 0) {
        showAlert('No CSV data to upload.', 'warning');
        return;
    }
    
    try {
        // Create FormData with CSV content
        const csvContent = [
            'season,event_type,day,date,start_time,am_pm,division,home_team,home_coach,visitor_team,visitor_coach,venue,plate_umpire,base_umpire,concession_stand,concession_staff',
            ...csvData.map(row => [
                row.season || '', row.event_type || '', row.day || '', row.date || '', 
                row.start_time || '', row.am_pm || '', row.division || '',
                row.home_team || '', row.home_coach || '', row.visitor_team || '', 
                row.visitor_coach || '', row.venue || '', row.plate_umpire || '', 
                row.base_umpire || '', row.concession_stand || '', row.concession_staff || ''
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const formData = new FormData();
        formData.append('csv', blob, 'schedules.csv');
        
        const response = await fetch('/api/upload-csv', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Failed to upload CSV');

        const result = await response.json();
        showAlert(`CSV upload completed! ${result.inserted} records inserted, ${result.errors} errors.`, 'success');
        
        // Hide preview and reset
        const previewDiv = document.getElementById('csvPreview');
        if (previewDiv) previewDiv.style.display = 'none';
        
        const csvFile = document.getElementById('csvFile');
        if (csvFile) csvFile.value = '';
        
        csvData = null;
        
        // Reload schedules
        loadSchedules();
        
    } catch (error) {
        console.error('Error uploading CSV:', error);
        showAlert('Error uploading CSV. Please try again.', 'danger');
    }
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

// Export functions for global access
window.editSchedule = editSchedule;
window.updateSchedule = updateSchedule;
window.deleteSchedule = deleteSchedule;
window.toggleScheduleSelection = toggleScheduleSelection;
window.toggleSelectAll = toggleSelectAll;
window.bulkDelete = bulkDelete;
window.updateRequestStatus = updateRequestStatus;
window.uploadCSV = uploadCSV;
window.showAddStaffModal = showAddStaffModal;
window.addStaffMember = addStaffMember;
window.editStaff = editStaff;
window.updateStaffMember = updateStaffMember;
window.deleteStaff = deleteStaff; 