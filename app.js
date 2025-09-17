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

function downloadXLS() {
    let selectedDate = reportDateInput.value;
    let filteredRecords = records;
    if (selectedDate) {
        const dateObj = new Date(selectedDate);
        const formattedDate = dateObj.toISOString().slice(0, 10);
        filteredRecords = records.filter(rec => {
            const recDate = new Date(rec.date);
            return recDate.toISOString().slice(0, 10) === formattedDate;
        });
    }
    let table = '<table border="1"><tr><th>Name</th><th>Date</th><th>Time</th></tr>';
    filteredRecords.forEach(rec => {
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
        table += `<tr><td>${rec.name}</td><td>${outDate}</td><td>${rec.time}</td></tr>`;
    });
    table += '</table>';
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedDate ? selectedDate : 'all'}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
// ...existing code...

downloadBtn.addEventListener('click', downloadXLS);
