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
        const selectedClientId = document.getElementById('case-client-select').value;
        const caseData = {
            title: document.getElementById('case-title').value,
            clientId: selectedClientId ? parseInt(selectedClientId, 10) : null,
            description: document.getElementById('case-description').value,
        };

        if (id) {
            // Update existing case
            const index = cases.findIndex(c => c.id == id);
            // Ensure we don't overwrite existing complex fields like documents, entries, summary
            cases[index] = { ...cases[index], ...caseData };
            showNotification('Akte erfolgreich aktualisiert', 'success');
        } else {
            // Create new case
            caseData.id = Date.now(); // Simple unique ID
            caseData.summary = ''; // New summary field
            caseData.documents = []; // Initialize documents
            caseData.entries = []; // Initialize new entries array
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
            </div>

            <div class="summary-section">
                <h4>Zusammenfassung</h4>
                <textarea id="case-summary-textarea" rows="6" placeholder="Fassen Sie hier den Fall zusammen...">${caseItem.summary || ''}</textarea>
                <button id="save-summary-btn" class="btn-primary">Zusammenfassung speichern</button>
            </div>

            <div class="entries-section">
                <div class="section-header">
                    <h4>Einträge</h4>
                    <button id="add-entry-btn" class="btn-icon" title="Neuer Eintrag">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
                    </button>
                </div>
                <div id="entries-list-container">
                    <!-- Entries will be rendered here -->
                </div>
            </div>

            <div class="document-section">
                <h4>Dokumente & Verknüpfungen</h4>
                <button class="btn-icon btn-import-file" data-id="${caseItem.id}" title="Datei importieren">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-upload" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>
                </button>
                <button class="btn-icon btn-link-file" data-id="${caseItem.id}" title="Extern verknüpfen">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16"><path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/><path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/></svg>
                </button>
                <button class="btn-icon btn-new-folder" title="Neuer Ordner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder-plus" viewBox="0 0 16 16"><path d="m.5 3 .04.87a1.99 1.99 0 0 0-.342 1.311l.637 7A2 2 0 0 0 2.826 14H9v-1H2.826a1 1 0 0 1-.995-.91l-.637-7A1 1 0 0 1 2.19 4h11.62a1 1 0 0 1 .996 1.09L14.54 8h1.005l.256-2.819A2 2 0 0 0 13.81 3H9.828a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 6.172 1H2.5a2 2 0 0 0-2 2zm5.672-1a1 1 0 0 1 .707.293L7.586 3H2.19c-.24 0-.47.042-.683.12L1.5 2.98a1 1 0 0 1 1-1h2.672a1 1 0 0 1 .707.293z"/><path d="M13.5 10a.5.5 0 0 1 .5.5V12h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V13h-1.5a.5.5 0 0 1 0-1H13v-1.5a.5.5 0 0 1 .5-.5z"/></svg>
                </button>
                <div class="document-list" id="document-list-container">
                    <!-- Documents will be rendered here -->
                </div>
            </div>
        `;

        renderDocuments(caseItem);

        renderEntries(caseItem);

        // Add event listeners for the new buttons
        caseDetailView.querySelector('.back-to-cases').addEventListener('click', () => {
            switchView('cases');
        });

        caseDetailView.querySelector('#add-entry-btn').addEventListener('click', () => {
            openEntryModal(caseItem.id);
        });

        caseDetailView.querySelector('#save-summary-btn').addEventListener('click', () => {
            const summaryText = caseDetailView.querySelector('#case-summary-textarea').value;
            caseItem.summary = summaryText;
            saveCases();
            showNotification('Zusammenfassung gespeichert', 'success');
        });

        caseDetailView.querySelector('.btn-import-file').addEventListener('click', async () => {
            const result = await window.electronAPI.importFile(caseItem.id);
            if (result && !result.error) {
                result.id = 'file_' + Date.now();
                result.type = 'file';
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
                result.id = 'file_' + Date.now();
                result.type = 'file';
                caseItem.documents.push(result);
                saveCases();
                showCaseDetail(caseItem.id); // Re-render the detail view
                showNotification('Datei erfolgreich verknüpft', 'success');
            }
        });

        caseDetailView.querySelector('.btn-new-folder').addEventListener('click', () => {
            const folderName = prompt('Bitte geben Sie einen Namen für den neuen Ordner ein:');
            if (folderName) {
                const newFolder = {
                    id: 'folder_' + Date.now(),
                    type: 'folder',
                    name: folderName,
                    children: []
                };
                caseItem.documents.push(newFolder);
                saveCases();
                showCaseDetail(caseItem.id);
                showNotification('Ordner erfolgreich erstellt', 'success');
            }
        });

        switchView('cases', true); // Switch to detail view mode
    }

    function renderDocuments(caseItem, container, items) {
        // Default to top-level if not provided
        if (!container) container = document.getElementById('document-list-container');
        if (!items) items = caseItem.documents;

        container.innerHTML = ''; // Clear container before rendering

        const folders = items.filter(item => item.type === 'folder');
        const files = items.filter(item => item.type === 'file');

        folders.forEach(folder => {
            const folderEl = document.createElement('div');
            folderEl.className = 'document-item folder-item';
            folderEl.innerHTML = `
                <div class="document-item-name">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder" viewBox="0 0 16 16"><path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-1.178 6.6A2 2 0 0 1 12.733 13H3.266a2 2 0 0 1-1.991-1.819l-1.178-6.6a2 2 0 0 1 .54-1.71zM2 4a1 1 0 0 0-1 1v6.819c0 .52.33.974.832 1.094l1.178 6.6A1 1 0 0 0 3.266 12h9.468a1 1 0 0 0 .992-.886l1.178-6.6A1 1 0 0 0 14 5H2z"/></svg>
                    <span>${folder.name}</span>
                </div>
                <div class="document-item-actions">
                    <button class="btn-delete-doc" data-id="${folder.id}">Löschen</button>
                </div>`;
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'folder-children';
            renderDocuments(caseItem, childrenContainer, folder.children); // Recursive call
            folderEl.appendChild(childrenContainer);
            container.appendChild(folderEl);
        });

        files.forEach(file => {
            const fileEl = document.createElement('div');
            fileEl.className = 'document-item';
            fileEl.innerHTML = `
                <div class="document-item-name">
                    <span>${file.name}</span>
                </div>
                <div class="document-item-actions">
                    <button class="btn-move-doc" data-id="${file.id}">Verschieben</button>
                    <button class="btn-delete-doc" data-id="${file.id}">Löschen</button>
                </div>`;
            fileEl.querySelector('.document-item-name').addEventListener('click', () => window.electronAPI.openFile(file.path));
            container.appendChild(fileEl);
        });

        // Add event listeners after rendering all items in this container
        addDocumentActionListeners(caseItem, container);
    }

    function addDocumentActionListeners(caseItem, container) {
        container.querySelectorAll('.btn-delete-doc').forEach(button => {
            button.addEventListener('click', (e) => handleDeleteDoc(caseItem, e.target.dataset.id));
        });
        container.querySelectorAll('.btn-move-doc').forEach(button => {
            button.addEventListener('click', (e) => openMoveDocModal(caseItem, e.target.dataset.id));
        });
    }

    // Recursive function to find and remove an item from the tree
    function findAndRemove(items, itemId) {
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            if (item.id === itemId) {
                items.splice(i, 1);
                return item;
            }
            if (item.type === 'folder') {
                const found = findAndRemove(item.children, itemId);
                if (found) return found;
            }
        }
        return null;
    }

    async function handleDeleteDoc(caseItem, docId) {
        const itemToRemove = findAndRemove(caseItem.documents, docId);
        if (itemToRemove && confirm(`Sind Sie sicher, dass Sie "${itemToRemove.name}" löschen möchten?`)) {
            // TODO: Recursively delete files if it's a folder
            if (itemToRemove.type === 'file' && itemToRemove.path.includes('imported-case-files')) {
                await window.electronAPI.deleteImportedFile(itemToRemove.path);
            }
            saveCases();
            showCaseDetail(caseItem.id);
            showNotification('Element erfolgreich entfernt', 'success');
        } else {
             // If not found or not confirmed, re-add it to avoid data loss
            if (itemToRemove) caseItem.documents.push(itemToRemove);
        }
    }

    function openMoveDocModal(caseItem, docId) {
        const modal = document.getElementById('move-doc-modal');
        const select = document.getElementById('move-doc-target-folder');
        const docIdInput = document.getElementById('move-doc-id');
        select.innerHTML = '';

        // Find all folders
        const folders = [];
        function findFolders(items) {
            items.forEach(item => {
                if(item.type === 'folder') {
                    folders.push(item);
                    findFolders(item.children);
                }
            });
        }
        findFolders(caseItem.documents);

        if (folders.length === 0) {
            showNotification('Keine Zielordner vorhanden.', 'error');
            return;
        }

        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.id;
            option.textContent = folder.name;
            select.appendChild(option);
        });

        docIdInput.value = docId;
        modal.style.display = 'block';
    }

    const moveDocModal = document.getElementById('move-doc-modal');
    moveDocModal.querySelector('.close-btn').addEventListener('click', () => moveDocModal.style.display = 'none');
    document.getElementById('move-doc-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const docId = document.getElementById('move-doc-id').value;
        const targetFolderId = document.getElementById('move-doc-target-folder').value;
        const caseItem = cases.find(c => c.id === currentCaseIdForEntry);

        const fileToMove = findAndRemove(caseItem.documents, docId);

        function findFolderAndAdd(items, folderId, file) {
            for (const item of items) {
                if (item.id === folderId) {
                    item.children.push(file);
                    return true;
                }
                if (item.type === 'folder') {
                    if (findFolderAndAdd(item.children, folderId, file)) return true;
                }
            }
            return false;
        }

        if (fileToMove) {
            findFolderAndAdd(caseItem.documents, targetFolderId, fileToMove);
            saveCases();
            showCaseDetail(caseItem.id);
            showNotification('Dokument erfolgreich verschoben.', 'success');
        }
        moveDocModal.style.display = 'none';
    });

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

    // --- Entry Management ---
    const entryModal = document.getElementById('entry-modal');
    const closeEntryModalBtn = entryModal.querySelector('.close-btn');
    const entryForm = document.getElementById('entry-form');
    const entryModalTitle = document.getElementById('entry-modal-title');
    const entryIdInput = document.getElementById('entry-id');
    let currentCaseIdForEntry = null;

    function renderEntries(caseItem) {
        const container = document.getElementById('entries-list-container');
        container.innerHTML = ''; // Clear previous entries

        if (!caseItem.entries || caseItem.entries.length === 0) {
            container.innerHTML = '<p>Noch keine Einträge vorhanden.</p>';
            return;
        }

        // Sort entries by date, newest first
        const sortedEntries = caseItem.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedEntries.forEach(entry => {
            const entryEl = document.createElement('div');
            entryEl.className = 'card'; // Reuse card style
            entryEl.style.marginBottom = '10px';
            entryEl.innerHTML = `
                <div class="section-header">
                    <h5>${entry.name} (${entry.date})</h5>
                    <div>
                        <button class="btn-icon btn-delete-entry" data-id="${entry.id}" title="Eintrag löschen">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                        </button>
                    </div>
                </div>
                <p>${entry.content.replace(/\n/g, '<br>')}</p>
                <div class="entry-documents-section">
                    <div class="section-header">
                        <h6>Dokumente zum Eintrag</h6>
                        <div>
                            <button class="btn-icon btn-import-file-entry" data-entry-id="${entry.id}" title="Datei importieren">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-upload" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>
                            </button>
                            <button class="btn-icon btn-new-folder-entry" data-entry-id="${entry.id}" title="Neuer Ordner">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder-plus" viewBox="0 0 16 16"><path d="m.5 3 .04.87a1.99 1.99 0 0 0-.342 1.311l.637 7A2 2 0 0 0 2.826 14H9v-1H2.826a1 1 0 0 1-.995-.91l-.637-7A1 1 0 0 1 2.19 4h11.62a1 1 0 0 1 .996 1.09L14.54 8h1.005l.256-2.819A2 2 0 0 0 13.81 3H9.828a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 6.172 1H2.5a2 2 0 0 0-2 2zm5.672-1a1 1 0 0 1 .707.293L7.586 3H2.19c-.24 0-.47.042-.683.12L1.5 2.98a1 1 0 0 1 1-1h2.672a1 1 0 0 1 .707.293z"/><path d="M13.5 10a.5.5 0 0 1 .5.5V12h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V13h-1.5a.5.5 0 0 1 0-1H13v-1.5a.5.5 0 0 1 .5-.5z"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="entry-documents-list" id="entry-docs-${entry.id}"></div>
                </div>
            `;

            // Render documents for this entry
            renderDocuments(caseItem, entryEl.querySelector(`#entry-docs-${entry.id}`), entry.documents);

            entryEl.querySelector('.btn-delete-entry').addEventListener('click', () => {
                if (confirm(`Sind Sie sicher, dass Sie den Eintrag "${entry.name}" löschen möchten?`)) {
                    // TODO: Also delete all associated imported files
                    const caseToUpdate = cases.find(c => c.id === currentCaseIdForEntry);
                    caseToUpdate.entries = caseToUpdate.entries.filter(e => e.id !== entry.id);
                    saveCases();
                    showCaseDetail(currentCaseIdForEntry);
                    showNotification('Eintrag gelöscht', 'success');
                }
            });

            entryEl.querySelector('.btn-import-file-entry').addEventListener('click', async () => {
                const result = await window.electronAPI.importFile(currentCaseIdForEntry);
                 if (result && !result.error) {
                    result.id = 'file_' + Date.now();
                    result.type = 'file';
                    entry.documents.push(result);
                    saveCases();
                    showCaseDetail(currentCaseIdForEntry);
                    showNotification('Datei zum Eintrag hinzugefügt', 'success');
                }
            });

            entryEl.querySelector('.btn-new-folder-entry').addEventListener('click', () => {
                const folderName = prompt('Bitte geben Sie einen Namen für den neuen Ordner ein:');
                if (folderName) {
                    const newFolder = {
                        id: 'folder_' + Date.now(),
                        type: 'folder',
                        name: folderName,
                        children: []
                    };
                    entry.documents.push(newFolder);
                    saveCases();
                    showCaseDetail(currentCaseIdForEntry);
                    showNotification('Ordner erfolgreich erstellt', 'success');
                }
            });

            container.appendChild(entryEl);
        });
    }

    function openEntryModal(caseId, entryId = null) {
        entryForm.reset();
        currentCaseIdForEntry = caseId;
        // For now, only new entry mode is implemented
        entryModalTitle.textContent = 'Neuer Eintrag';
        entryIdInput.value = '';
        document.getElementById('entry-date').value = new Date().toISOString().split('T')[0];
        entryModal.style.display = 'block';
    }

    function closeEntryModal() {
        entryModal.style.display = 'none';
    }

    closeEntryModalBtn.addEventListener('click', closeEntryModal);
    window.addEventListener('click', (event) => {
        if (event.target == entryModal) {
            closeEntryModal();
        }
    });

    entryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const caseItem = cases.find(c => c.id === currentCaseIdForEntry);
        if (!caseItem) return;

        const entryData = {
            id: Date.now(),
            date: document.getElementById('entry-date').value,
            name: document.getElementById('entry-name').value,
            content: document.getElementById('entry-content').value,
            documents: [] // Document attachment to be implemented later
        };

        caseItem.entries.push(entryData);
        saveCases();
        showCaseDetail(currentCaseIdForEntry); // Re-render detail view
        closeEntryModal();
        showNotification('Eintrag erfolgreich erstellt', 'success');
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
