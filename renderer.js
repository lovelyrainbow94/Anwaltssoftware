document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.sidebar ul li');
    const views = document.querySelectorAll('.main-content > .view'); // Select only direct children
    const actionButtons = document.querySelectorAll('.action-btn');
    const caseDetailView = document.getElementById('case-detail-view');

    let currentView = 'dashboard';

    function renderDailyPlan() {
        const dailyTasksList = document.getElementById('daily-tasks-list');
        const dailyDeadlinesList = document.getElementById('daily-deadlines-list');
        dailyTasksList.innerHTML = '';
        dailyDeadlinesList.innerHTML = '';

        const today = new Date().toISOString().split('T')[0];

        const todayTasks = tasks.filter(t => t.dueDate === today && t.status !== 'Erledigt');
        if (todayTasks.length > 0) {
            todayTasks.forEach(task => {
                const li = document.createElement('li');
                li.textContent = task.title;
                dailyTasksList.appendChild(li);
            });
        } else {
            dailyTasksList.innerHTML = '<li>Keine Aufgaben für heute.</li>';
        }

        const todayDeadlines = deadlines.filter(d => d.endDate === today);
        if (todayDeadlines.length > 0) {
            todayDeadlines.forEach(deadline => {
                const li = document.createElement('li');
                li.textContent = deadline.title;
                dailyDeadlinesList.appendChild(li);
            });
        } else {
            dailyDeadlinesList.innerHTML = '<li>Keine Fristen für heute.</li>';
        }
    }

    function renderReminders() {
        const remindersList = document.getElementById('reminders-list');
        remindersList.innerHTML = '';

        const today = new Date();
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);

        const upcomingTasks = tasks.filter(task => {
            if (!task.dueDate || task.status === 'Erledigt') return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= today && dueDate <= sevenDaysFromNow;
        });

        if (upcomingTasks.length > 0) {
             upcomingTasks.forEach(task => {
                const caseItem = cases.find(c => c.id === task.caseId);
                const caseTitle = caseItem ? `Akte: ${caseItem.title}` : 'Keine Akte zugeordnet';
                const taskCard = document.createElement('div');
                taskCard.className = 'card';
                taskCard.innerHTML = `
                    <h4>${task.title}</h4>
                    <p>${caseTitle}</p>
                    <p><strong>Fällig:</strong> ${task.dueDate}</p>
                    <p><strong>Status:</strong> ${task.status}</p>
                `;
                remindersList.appendChild(taskCard);
            });
        } else {
            remindersList.innerHTML = '<p>Keine anstehenden Aufgaben in den nächsten 7 Tagen.</p>';
        }
    }

    function switchView(viewName, isDetailView = false) {
        // Hide all views
        views.forEach(view => view.classList.remove('active'));

        if (isDetailView) {
            // Show only the detail view
            caseDetailView.classList.add('active');
            // De-select all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
        } else {
            // Hide detail view
            caseDetailView.classList.remove('active');
            const targetNavItem = document.querySelector(`.sidebar ul li[data-view="${viewName}"]`);
            if (targetNavItem) {
                // De-select all nav items
                navItems.forEach(nav => nav.classList.remove('active'));
                // Select the correct nav item
                targetNavItem.classList.add('active');
                // Show the corresponding main view
                const viewId = `${viewName}-view`;
                document.getElementById(viewId).classList.add('active');
                currentView = viewName;

                // Render dynamic views
                if (viewName === 'daily-plan') {
                    renderDailyPlan();
                } else if (viewName === 'reminders') {
                    renderReminders();
                }
            }
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.getAttribute('data-view');
            switchView(viewName);
        });
    });

    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewName = button.getAttribute('data-view');
            switchView(viewName);
        });
    });

    // Dashboard Clock
    const dateElement = document.getElementById('date');
    const timeElement = document.getElementById('time');

    function updateDateTime() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('de-DE', options);
        timeElement.textContent = now.toLocaleTimeString('de-DE');
    }

    if (dateElement && timeElement) {
        updateDateTime();
        setInterval(updateDateTime, 1000);
    }

    // --- Client Management ---
    const clientModal = document.getElementById('client-modal');
    const addClientBtn = document.getElementById('add-client-btn');
    const closeModalBtn = clientModal.querySelector('.close-btn');
    const clientForm = document.getElementById('client-form');
    const clientList = document.getElementById('client-list');
    const clientModalTitle = document.getElementById('client-modal-title');
    const clientIdInput = document.getElementById('client-id');

    let clients = [];

    function saveClients() {
        localStorage.setItem('clients', JSON.stringify(clients));
    }

    function loadClients() {
        const storedClients = localStorage.getItem('clients');
        if (storedClients) {
            clients = JSON.parse(storedClients);
        }
    }

    function renderClients() {
        clientList.innerHTML = '';
        if (clients.length === 0) {
            clientList.innerHTML = '<p>Noch keine Klienten angelegt.</p>';
            return;
        }
        clients.forEach(client => {
            const clientCard = document.createElement('div');
            clientCard.className = 'card';
            clientCard.innerHTML = `
                <h4>${client.name}</h4>
                <p>${client.email}</p>
                <p>${client.phone}</p>
                <button class="btn-edit" data-id="${client.id}">Bearbeiten</button>
                <button class="btn-delete" data-id="${client.id}">Löschen</button>
            `;
            // Edit button
            clientCard.querySelector('.btn-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                openClientModal(client.id);
            });
            // Delete button
            clientCard.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Sind Sie sicher, dass Sie ${client.name} löschen möchten?`)) {
                    deleteClient(client.id);
                }
            });
            clientList.appendChild(clientCard);
        });
    }

    function openClientModal(id = null) {
        clientForm.reset();
        if (id) {
            // Edit mode
            const client = clients.find(c => c.id === id);
            clientModalTitle.textContent = 'Klient bearbeiten';
            clientIdInput.value = client.id;
            document.getElementById('client-name').value = client.name;
            document.getElementById('client-email').value = client.email;
            document.getElementById('client-phone').value = client.phone;
            document.getElementById('client-address').value = client.address;
        } else {
            // Create mode
            clientModalTitle.textContent = 'Neuen Klient anlegen';
            clientIdInput.value = '';
        }
        clientModal.style.display = 'block';
    }

    function closeClientModal() {
        clientModal.style.display = 'none';
    }

    function deleteClient(id) {
        clients = clients.filter(c => c.id !== id);
        saveClients();
        renderClients();
        showNotification('Klient erfolgreich gelöscht', 'success');
    }

    addClientBtn.addEventListener('click', () => openClientModal());
    closeModalBtn.addEventListener('click', closeClientModal);
    window.addEventListener('click', (event) => {
        if (event.target == clientModal) {
            closeClientModal();
        }
    });

    clientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = clientIdInput.value;
        const clientData = {
            name: document.getElementById('client-name').value,
            email: document.getElementById('client-email').value,
            phone: document.getElementById('client-phone').value,
            address: document.getElementById('client-address').value,
        };

        if (id) {
            // Update existing client
            const index = clients.findIndex(c => c.id == id);
            clients[index] = { ...clients[index], ...clientData };
            showNotification('Klient erfolgreich aktualisiert', 'success');
        } else {
            // Create new client
            clientData.id = Date.now(); // Simple unique ID
            clients.push(clientData);
            showNotification('Klient erfolgreich erstellt', 'success');
        }

        saveClients();
        renderClients();
        closeClientModal();
    });

    // Initial load
    loadClients();
    renderClients();


    // --- Case Management ---
    const caseModal = document.getElementById('case-modal');
    const addCaseBtn = document.getElementById('add-case-btn');
    const closeCaseModalBtn = caseModal.querySelector('.close-btn');
    const caseForm = document.getElementById('case-form');
    const caseList = document.getElementById('case-list');
    const caseModalTitle = document.getElementById('case-modal-title');
    const caseIdInput = document.getElementById('case-id');
    const caseClientSelect = document.getElementById('case-client-select');

    let cases = [];

    function saveCases() {
        localStorage.setItem('cases', JSON.stringify(cases));
    }

    function loadCases() {
        const storedCases = localStorage.getItem('cases');
        if (storedCases) {
            cases = JSON.parse(storedCases);
        }
    }

    function renderCases() {
        caseList.innerHTML = '';
        if (cases.length === 0) {
            caseList.innerHTML = '<p>Noch keine Akten angelegt.</p>';
            return;
        }
        cases.forEach(caseItem => {
            const client = clients.find(c => c.id === caseItem.clientId);
            const clientName = client ? client.name : 'Unbekannter Klient';
            const caseCard = document.createElement('div');
            caseCard.className = 'card';
            caseCard.innerHTML = `
                <h4>${caseItem.title}</h4>
                <p>Klient: ${clientName}</p>
                <button class="btn-edit" data-id="${caseItem.id}">Bearbeiten</button>
                <button class="btn-delete" data-id="${caseItem.id}">Löschen</button>
            `;
            // Edit button
            caseCard.querySelector('.btn-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                openCaseModal(caseItem.id);
            });
            // Delete button
            caseCard.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Sind Sie sicher, dass Sie die Akte "${caseItem.title}" löschen möchten?`)) {
                    deleteCase(caseItem.id);
                }
            });
            caseList.appendChild(caseCard);
        });
    }

    function populateClientSelect() {
        caseClientSelect.innerHTML = '<option value="" disabled selected>Bitte Klient wählen</option>';
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            caseClientSelect.appendChild(option);
        });
    }

    function openCaseModal(id = null) {
        caseForm.reset();
        populateClientSelect();
        if (id) {
            // Edit mode
            const caseItem = cases.find(c => c.id === id);
            caseModalTitle.textContent = 'Akte bearbeiten';
            caseIdInput.value = caseItem.id;
            document.getElementById('case-title').value = caseItem.title;
            document.getElementById('case-client-select').value = caseItem.clientId;
            document.getElementById('case-description').value = caseItem.description;
        } else {
            // Create mode
            caseModalTitle.textContent = 'Neue Akte anlegen';
            caseIdInput.value = '';
        }
        caseModal.style.display = 'block';
    }

    function closeCaseModal() {
        caseModal.style.display = 'none';
    }

    function deleteCase(id) {
        cases = cases.filter(c => c.id !== id);
        saveCases();
        renderCases();
        showNotification('Akte erfolgreich gelöscht', 'success');
    }

    addCaseBtn.addEventListener('click', () => openCaseModal());
    closeCaseModalBtn.addEventListener('click', closeCaseModal);
    window.addEventListener('click', (event) => {
        if (event.target == caseModal) {
            closeCaseModal();
        }
    });

    caseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = caseIdInput.value;
        const caseData = {
            title: document.getElementById('case-title').value,
            clientId: parseInt(document.getElementById('case-client-select').value, 10),
            description: document.getElementById('case-description').value,
            documents: id ? cases.find(c => c.id == id).documents : [] // Preserve documents on edit
        };

        if (id) {
            // Update existing case
            const index = cases.findIndex(c => c.id == id);
            cases[index] = { ...cases[index], ...caseData };
            showNotification('Akte erfolgreich aktualisiert', 'success');
        } else {
            // Create new case
            caseData.id = Date.now(); // Simple unique ID
            cases.push(caseData);
            showNotification('Akte erfolgreich erstellt', 'success');
        }

        saveCases();
        renderCases();
        closeCaseModal();
    });

    // Initial load for cases
    loadCases();
    renderCases();

    function showCaseDetail(caseId) {
        const caseItem = cases.find(c => c.id === caseId);
        if (!caseItem) return;

        const client = clients.find(c => c.id === caseItem.clientId);
        const clientName = client ? client.name : 'Unbekannter Klient';

        caseDetailView.innerHTML = `
            <span class="back-to-cases">&larr; Zurück zur Aktenübersicht</span>
            <div class="case-detail-header">
                <h3>${caseItem.title}</h3>
                <p><strong>Klient:</strong> ${clientName}</p>
                <p><strong>Beschreibung:</strong> ${caseItem.description || 'Keine Beschreibung'}</p>
            </div>

            <div class="document-section">
                <h4>Dokumente & Verknüpfungen</h4>
                <button class="btn-import-file" data-id="${caseItem.id}">Datei importieren</button>
                <button class="btn-link-file" data-id="${caseItem.id}">Extern verknüpfen</button>
                <ul class="document-list" id="document-list-container">
                    <!-- Documents will be rendered here -->
                </ul>
            </div>
        `;

        renderDocuments(caseItem);

        // Add event listeners for the new buttons
        caseDetailView.querySelector('.back-to-cases').addEventListener('click', () => {
            switchView('cases');
        });

        caseDetailView.querySelector('.btn-import-file').addEventListener('click', async () => {
            const result = await window.electronAPI.importFile(caseItem.id);
            if (result && !result.error) {
                caseItem.documents.push(result);
                saveCases();
                showCaseDetail(caseItem.id); // Re-render the detail view
                showNotification('Datei erfolgreich importiert', 'success');
            } else if (result && result.error) {
                showNotification(`Fehler: ${result.error}`, 'error');
            }
        });

        caseDetailView.querySelector('.btn-link-file').addEventListener('click', async () => {
            const result = await window.electronAPI.linkFile();
            if (result) {
                caseItem.documents.push(result);
                saveCases();
                showCaseDetail(caseItem.id); // Re-render the detail view
                showNotification('Datei erfolgreich verknüpft', 'success');
            }
        });

        switchView('cases', true); // Switch to detail view mode
    }

    function renderDocuments(caseItem) {
        const container = document.getElementById('document-list-container');
        container.innerHTML = '';
        if (!caseItem.documents || caseItem.documents.length === 0) {
            container.innerHTML = '<li>Keine Dokumente für diese Akte vorhanden.</li>';
            return;
        }

        caseItem.documents.forEach((doc, index) => {
            const docItem = document.createElement('li');
            docItem.className = 'document-item';
            const docTypeClass = doc.type === 'imported' ? 'doc-type-imported' : 'doc-type-linked';
            docItem.innerHTML = `
                <div>
                    <span class="document-item-name">${doc.name}</span>
                    <span class="doc-type-indicator ${docTypeClass}">${doc.type}</span>
                </div>
                <div class="document-item-actions">
                    <button class="btn-delete-doc" data-index="${index}">Löschen</button>
                </div>
            `;

            docItem.querySelector('.document-item-name').addEventListener('click', () => {
                window.electronAPI.openFile(doc.path);
            });

            docItem.querySelector('.btn-delete-doc').addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!confirm(`Sind Sie sicher, dass Sie das Dokument "${doc.name}" entfernen möchten?`)) {
                    return;
                }

                if (doc.type === 'imported') {
                    const result = await window.electronAPI.deleteImportedFile(doc.path);
                    if (!result.success) {
                        showNotification(`Fehler beim Löschen der Datei: ${result.error}`, 'error');
                        return; // Stop if the file can't be deleted
                    }
                }

                // Remove from array, save, and re-render
                caseItem.documents.splice(index, 1);
                saveCases();
                showCaseDetail(caseItem.id);
                showNotification('Dokument erfolgreich entfernt', 'success');
            });

            container.appendChild(docItem);
        });
    }

    function renderCases() {
        caseList.innerHTML = '';
        if (cases.length === 0) {
            caseList.innerHTML = '<p>Noch keine Akten angelegt.</p>';
            return;
        }
        cases.forEach(caseItem => {
            const client = clients.find(c => c.id === caseItem.clientId);
            const clientName = client ? client.name : 'Unbekannter Klient';
            const caseCard = document.createElement('div');
            caseCard.className = 'card';
            caseCard.innerHTML = `
                <h4>${caseItem.title}</h4>
                <p>Klient: ${clientName}</p>
                <button class="btn-edit" data-id="${caseItem.id}">Bearbeiten</button>
                <button class="btn-delete" data-id="${caseItem.id}">Löschen</button>
            `;
            caseCard.addEventListener('click', () => {
                showCaseDetail(caseItem.id);
            });
            // Edit button
            caseCard.querySelector('.btn-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                openCaseModal(caseItem.id);
            });
            // Delete button
            caseCard.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Sind Sie sicher, dass Sie die Akte "${caseItem.title}" löschen möchten?`)) {
                    deleteCase(caseItem.id);
                }
            });
            caseList.appendChild(caseCard);
        });
    }

    // --- Task Management ---
    const taskModal = document.getElementById('task-modal');
    const addTaskBtn = document.getElementById('add-task-btn');
    const closeTaskModalBtn = taskModal.querySelector('.close-btn');
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    const taskModalTitle = document.getElementById('task-modal-title');
    const taskIdInput = document.getElementById('task-id');
    const taskCaseSelect = document.getElementById('task-case-select');

    let tasks = [];

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        }
    }

    function renderTasks() {
        taskList.innerHTML = '';
        if (tasks.length === 0) {
            taskList.innerHTML = '<p>Noch keine Aufgaben angelegt.</p>';
            return;
        }
        tasks.forEach(task => {
            const caseItem = cases.find(c => c.id === task.caseId);
            const caseTitle = caseItem ? `Akte: ${caseItem.title}` : 'Keine Akte zugeordnet';
            const taskCard = document.createElement('div');
            taskCard.className = 'card';
            taskCard.innerHTML = `
                <h4>${task.title}</h4>
                <p>${caseTitle}</p>
                <p><strong>Fällig:</strong> ${task.dueDate || 'Kein Datum'}</p>
                <p><strong>Status:</strong> ${task.status}</p>
                <button class="btn-edit" data-id="${task.id}">Bearbeiten</button>
                <button class="btn-delete" data-id="${task.id}">Löschen</button>
            `;
            // Edit button
            taskCard.querySelector('.btn-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                openTaskModal(task.id);
            });
            // Delete button
            taskCard.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Sind Sie sicher, dass Sie die Aufgabe "${task.title}" löschen möchten?`)) {
                    deleteTask(task.id);
                }
            });
            taskList.appendChild(taskCard);
        });
    }

    function populateCaseSelectForTask() {
        taskCaseSelect.innerHTML = '<option value="">Keine Akte</option>';
        cases.forEach(caseItem => {
            const option = document.createElement('option');
            option.value = caseItem.id;
            option.textContent = caseItem.title;
            taskCaseSelect.appendChild(option);
        });
    }

    function openTaskModal(id = null) {
        taskForm.reset();
        populateCaseSelectForTask();
        if (id) {
            // Edit mode
            const task = tasks.find(t => t.id === id);
            taskModalTitle.textContent = 'Aufgabe bearbeiten';
            taskIdInput.value = task.id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-case-select').value = task.caseId;
            document.getElementById('task-due-date').value = task.dueDate;
            document.getElementById('task-status').value = task.status;
        } else {
            // Create mode
            taskModalTitle.textContent = 'Neue Aufgabe anlegen';
            taskIdInput.value = '';
        }
        taskModal.style.display = 'block';
    }

    function closeTaskModal() {
        taskModal.style.display = 'none';
    }

    function deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
        showNotification('Aufgabe erfolgreich gelöscht', 'success');
    }

    addTaskBtn.addEventListener('click', () => openTaskModal());
    closeTaskModalBtn.addEventListener('click', closeTaskModal);
    window.addEventListener('click', (event) => {
        if (event.target == taskModal) {
            closeTaskModal();
        }
    });

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = taskIdInput.value;
        const taskData = {
            title: document.getElementById('task-title').value,
            caseId: document.getElementById('task-case-select').value ? parseInt(document.getElementById('task-case-select').value, 10) : null,
            dueDate: document.getElementById('task-due-date').value,
            status: document.getElementById('task-status').value,
        };

        if (id) {
            // Update existing task
            const index = tasks.findIndex(t => t.id == id);
            tasks[index] = { ...tasks[index], ...taskData };
            showNotification('Aufgabe erfolgreich aktualisiert', 'success');
        } else {
            // Create new task
            taskData.id = Date.now();
            tasks.push(taskData);
            showNotification('Aufgabe erfolgreich erstellt', 'success');
        }

        saveTasks();
        renderTasks();
        closeTaskModal();
    });

    // Initial load for tasks
    loadTasks();
    renderTasks();

    // --- Deadline Management ---
    const deadlineModal = document.getElementById('deadline-modal');
    const addDeadlineBtn = document.getElementById('add-deadline-btn');
    const closeDeadlineModalBtn = deadlineModal.querySelector('.close-btn');
    const deadlineForm = document.getElementById('deadline-form');
    const deadlinesTableBody = document.getElementById('deadlines-table-body');
    const deadlineModalTitle = document.getElementById('deadline-modal-title');
    const deadlineIdInput = document.getElementById('deadline-id');
    const deadlineCaseSelect = document.getElementById('deadline-case-select');
    const calculateDeadlineBtn = document.getElementById('calculate-deadline-btn');

    let deadlines = [];

    function saveDeadlines() {
        localStorage.setItem('deadlines', JSON.stringify(deadlines));
    }

    function loadDeadlines() {
        const storedDeadlines = localStorage.getItem('deadlines');
        if (storedDeadlines) {
            deadlines = JSON.parse(storedDeadlines);
        }
    }

    function renderDeadlines() {
        deadlinesTableBody.innerHTML = '';
        if (deadlines.length === 0) {
            deadlinesTableBody.innerHTML = '<tr><td colspan="4">Noch keine Fristen angelegt.</td></tr>';
            return;
        }
        deadlines.forEach(deadline => {
            const caseItem = cases.find(c => c.id === deadline.caseId);
            const caseTitle = caseItem ? caseItem.title : 'Keine';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${deadline.title}</td>
                <td>${caseTitle}</td>
                <td>${deadline.endDate}</td>
                <td>
                    <button class="btn-edit" data-id="${deadline.id}">Bearbeiten</button>
                    <button class="btn-delete" data-id="${deadline.id}">Löschen</button>
                </td>
            `;
            // Add event listeners
            row.querySelector('.btn-edit').addEventListener('click', () => openDeadlineModal(deadline.id));
            row.querySelector('.btn-delete').addEventListener('click', () => {
                 if (confirm(`Sind Sie sicher, dass Sie die Frist "${deadline.title}" löschen möchten?`)) {
                    deleteDeadline(deadline.id);
                }
            });
            deadlinesTableBody.appendChild(row);
        });
    }

    function populateCaseSelectForDeadline() {
        deadlineCaseSelect.innerHTML = '<option value="">Keine Akte</option>';
        cases.forEach(caseItem => {
            const option = document.createElement('option');
            option.value = caseItem.id;
            option.textContent = caseItem.title;
            deadlineCaseSelect.appendChild(option);
        });
    }

    function openDeadlineModal(id = null) {
        deadlineForm.reset();
        populateCaseSelectForDeadline();
        if (id) {
            const deadline = deadlines.find(d => d.id === id);
            deadlineModalTitle.textContent = 'Frist bearbeiten';
            deadlineIdInput.value = deadline.id;
            document.getElementById('deadline-title').value = deadline.title;
            document.getElementById('deadline-case-select').value = deadline.caseId;
            document.getElementById('deadline-end-date').value = deadline.endDate;
        } else {
            deadlineModalTitle.textContent = 'Neue Frist anlegen';
            deadlineIdInput.value = '';
        }
        deadlineModal.style.display = 'block';
    }

    function closeDeadlineModal() {
        deadlineModal.style.display = 'none';
    }

    function deleteDeadline(id) {
        deadlines = deadlines.filter(d => d.id !== id);
        saveDeadlines();
        renderDeadlines();
        showNotification('Frist erfolgreich gelöscht', 'success');
    }

    calculateDeadlineBtn.addEventListener('click', () => {
        const startDateInput = document.getElementById('deadline-start-date');
        const daysInput = document.getElementById('deadline-days-to-add');
        const endDateInput = document.getElementById('deadline-end-date');

        if (startDateInput.value && daysInput.value) {
            const startDate = new Date(startDateInput.value);
            const daysToAdd = parseInt(daysInput.value, 10);
            startDate.setDate(startDate.getDate() + daysToAdd);
            // Format to YYYY-MM-DD for the input field
            endDateInput.value = startDate.toISOString().split('T')[0];
        } else {
            showNotification('Bitte Startdatum und Tage zum Hinzufügen angeben.', 'error');
        }
    });

    addDeadlineBtn.addEventListener('click', () => openDeadlineModal());
    closeDeadlineModalBtn.addEventListener('click', closeDeadlineModal);
     window.addEventListener('click', (event) => {
        if (event.target == deadlineModal) {
            closeDeadlineModal();
        }
    });

    deadlineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = deadlineIdInput.value;
        const deadlineData = {
            title: document.getElementById('deadline-title').value,
            caseId: document.getElementById('deadline-case-select').value ? parseInt(document.getElementById('deadline-case-select').value, 10) : null,
            endDate: document.getElementById('deadline-end-date').value,
        };

        if (id) {
            const index = deadlines.findIndex(d => d.id == id);
            deadlines[index] = { ...deadlines[index], ...deadlineData };
            showNotification('Frist erfolgreich aktualisiert', 'success');
        } else {
            deadlineData.id = Date.now();
            deadlines.push(deadlineData);
            showNotification('Frist erfolgreich erstellt', 'success');
        }

        saveDeadlines();
        renderDeadlines();
        closeDeadlineModal();
    });

    // Initial load for deadlines
    loadDeadlines();
    renderDeadlines();

    // --- Data Backup/Restore ---
    const exportBtn = document.getElementById('export-data-btn');
    const importBtn = document.getElementById('import-data-btn');
    const structureBtn = document.getElementById('download-structure-btn');

    exportBtn.addEventListener('click', async () => {
        const allData = {
            clients: clients,
            cases: cases,
            tasks: tasks,
            deadlines: deadlines,
        };
        const result = await window.electronAPI.exportData(allData);
        if (result.success) {
            showNotification(result.message, 'success');
        } else if (result.error) {
            showNotification(`Fehler: ${result.error}`, 'error');
        }
    });

    importBtn.addEventListener('click', async () => {
        const confirmed = confirm("ACHTUNG!\n\nDadurch werden ALLE aktuellen Daten in der Anwendung mit den Daten aus der Sicherungsdatei überschrieben.\n\nDieser Vorgang kann nicht rückgängig gemacht werden.\n\nMöchten Sie fortfahren?");
        if (!confirmed) {
            showNotification('Import abgebrochen', 'success');
            return;
        }

        const result = await window.electronAPI.importData();
        if (result.success) {
            // Replace data and save to localStorage
            localStorage.setItem('clients', JSON.stringify(result.data.clients || []));
            localStorage.setItem('cases', JSON.stringify(result.data.cases || []));
            localStorage.setItem('tasks', JSON.stringify(result.data.tasks || []));
            localStorage.setItem('deadlines', JSON.stringify(result.data.deadlines || []));

            showNotification('Daten erfolgreich importiert. Anwendung wird neu gestartet.', 'success');

            // Reload the app to reflect changes
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } else if (result.error) {
            showNotification(`Fehler beim Import: ${result.error}`, 'error');
        }
    });

    structureBtn.addEventListener('click', async () => {
        const result = await window.electronAPI.saveStructure();
        if (result.success) {
            showNotification(result.message, 'success');
        } else if (result.error) {
            showNotification(`Fehler: ${result.error}`, 'error');
        }
    });
});

function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    // Trigger the animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Hide and remove the notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            container.removeChild(notification);
        }, 500); // Wait for fade out animation
    }, 3000);
}
