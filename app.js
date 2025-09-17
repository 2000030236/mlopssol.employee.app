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
}

function saveRecords() {
    localStorage.setItem('attendanceRecords', JSON.stringify(records));
}

loadRecords();
renderTable();

function addRecord(name) {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    const record = { name, date, time };
    records.push(record);
    saveRecords();
    renderTable();
}

function renderTable() {
    tableBody.innerHTML = '';
    records.forEach((rec, idx) => {
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
        records[index].date = new Date().toLocaleDateString();
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
    let csv = '\uFEFF"Name";"Date";"Time"\n';
    let filteredRecords = records;
    if (selectedDate) {
        // Convert selectedDate (yyyy-mm-dd) to local date string format
        const dateObj = new Date(selectedDate);
        // Format as yyyy-mm-dd for comparison and output
        const formattedDate = dateObj.toISOString().slice(0, 10);
        filteredRecords = records.filter(rec => {
            // Try to match both local and ISO formats
            const recDate = new Date(rec.date);
            return recDate.toISOString().slice(0, 10) === formattedDate;
        });
    }
    filteredRecords.forEach(rec => {
        // Output date as yyyy-mm-dd and wrap in quotes for Excel, force text format
        let outDate;
        const d = new Date(rec.date);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            outDate = `${day}/${month}/${year}`;
        } else {
            outDate = rec.date;
        }
        // Format date and time as text for Excel
        let outDateText = ` '${outDate}`;
        let outTimeText = ` '${rec.time}`;
        csv += `"${rec.name}";"${outDateText}";"${outTimeText}"\n`;
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

downloadBtn.addEventListener('click', downloadCSV);
