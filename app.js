// Employee Attendance App Logic
const form = document.getElementById('attendance-form');
const nameInput = document.getElementById('employee-name');
const tableBody = document.querySelector('#attendance-table tbody');
const downloadBtn = document.getElementById('download-report');
const reportDateInput = document.getElementById('report-date');

let records = [];

// Load records from localStorage if available
function loadRecords() {
    const saved = localStorage.getItem('attendanceRecords');
    if (saved) {
        try {
            records = JSON.parse(saved);
        } catch (e) {
            records = [];
        }
    }
    // If no records exist, add a test record for verification
    if (!records || records.length === 0) {
        const now = new Date();
        const date = now.toISOString().slice(0, 10);
        const time = now.toLocaleTimeString();
        records = [{ name: 'Test User', date, time }];
        saveRecords();
    }
}

function saveRecords() {
    localStorage.setItem('attendanceRecords', JSON.stringify(records));
}

loadRecords();
renderTable();

function addRecord(name) {
    const now = new Date();
    // Store date in ISO format (yyyy-mm-dd)
    const date = now.toISOString().slice(0, 10);
    const time = now.toLocaleTimeString();
    const record = { name, date, time };
    records.push(record);
    saveRecords();
    renderTable();
}

function renderTable() {
    tableBody.innerHTML = '';
    let filteredRecords = records;
    const selectedDate = reportDateInput.value;
    if (selectedDate) {
        filteredRecords = records.filter(rec => rec.date === selectedDate);
    }
    filteredRecords.forEach((rec, idx) => {
        const row = document.createElement('tr');
        if (rec.isEditing) {
            row.innerHTML = `
                <td><input type="text" id="edit-name-${idx}" value="${rec.name}"></td>
                <td>${rec.date}</td>
                <td><input type="text" id="edit-time-${idx}" value="${rec.time}"></td>
                <td>
                    <button style="margin-right:8px;" onclick="saveEdit(${idx})">Save</button>
                    <button onclick="cancelEdit(${idx})">Cancel</button>
                </td>
            `;
        } else {
            row.innerHTML = `
                <td>${rec.name}</td>
                <td>${rec.date}</td>
                <td>${rec.time}</td>
                <td>
                    <button onclick="editRecord(${idx})">Edit</button>
                    <button onclick="deleteRecord(${idx})">Delete</button>
                </td>
            `;
        }
        tableBody.appendChild(row);
    });
}

function deleteRecord(index) {
    records.splice(index, 1);
    saveRecords();
    renderTable();
}

function editRecord(index) {
    records[index].isEditing = true;
    renderTable();
}

function saveEdit(index) {
    const nameInput = document.getElementById(`edit-name-${index}`);
    const timeInput = document.getElementById(`edit-time-${index}`);
    if (nameInput && timeInput) {
        records[index].name = nameInput.value.trim();
        records[index].time = timeInput.value.trim();
        // Do NOT overwrite the date when editing
    }
    delete records[index].isEditing;
    saveRecords();
    renderTable();
}

function cancelEdit(index) {
    delete records[index].isEditing;
    renderTable();
}

form.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (name) {
        addRecord(name);
        nameInput.value = '';
    }
});


function downloadCSV() {
    let selectedDate = reportDateInput.value;
    // Add UTF-8 BOM for Excel compatibility
    let csv = '\uFEFFName,Date,Time\n'; // Use comma for columns
    let filteredRecords = records;
    if (selectedDate) {
        // selectedDate is already yyyy-mm-dd
        filteredRecords = records.filter(rec => rec.date === selectedDate);
    }
    filteredRecords.forEach(rec => {
        // Date is already in yyyy-mm-dd format
    const safeName = `"${rec.name.replace(/"/g, '""')}"`;
    // Prefix time with single quote to force Excel to treat as text
    const safeTime = `"'${rec.time.replace(/"/g, '""')}"`;
    csv += `${safeName},${rec.date},${safeTime}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedDate ? selectedDate : 'all'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


// Re-render table when date changes
reportDateInput.addEventListener('change', renderTable);
downloadBtn.addEventListener('click', downloadCSV);
