document.addEventListener('DOMContentLoaded', () => {
    // Port Scanner Elements
    const scanBtn = document.getElementById('scan-btn');
    const targetInput = document.getElementById('target-input');
    const resultsBody = document.getElementById('results-body');
    const targetDisplay = document.getElementById('target-display');

    // Stats elements
    const totalScannedEl = document.getElementById('total-scanned');
    const openPortsEl = document.getElementById('open-ports');
    const scanTimeEl = document.getElementById('scan-time');

    // Network Map Elements
    const netScanBtn = document.getElementById('net-scan-btn');
    const netResultsBody = document.getElementById('net-results-body');
    const tabs = document.querySelectorAll('.tab-btn');
    const views = document.querySelectorAll('.view-section');

    // Tab Switching Logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            views.forEach(v => {
                v.classList.remove('active');
                v.style.display = 'none';
            });

            tab.classList.add('active');
            const targetView = document.getElementById(`${tab.dataset.tab}-view`);
            targetView.classList.add('active');
            targetView.style.display = 'flex';
        });
    });

    scanBtn.addEventListener('click', startScan);
    if (netScanBtn) netScanBtn.addEventListener('click', startNetworkScan);

    // Allow 'Enter' key to trigger scan
    targetInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startScan();
    });

    async function startScan() {
        const target = targetInput.value.trim();
        if (!target) return;

        // UI Reset
        resetUI();
        setLoading(true, scanBtn);
        targetDisplay.textContent = `Scanning: ${target}...`;

        const startTime = performance.now();

        try {
            const response = await fetch('/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ target: target }),
            });

            const data = await response.json();
            const endTime = performance.now();

            if (response.ok) {
                renderResults(data);
                updateStats(data.results, endTime - startTime);
                targetDisplay.textContent = `Target: ${data.target} (${data.ip})`;
            } else {
                showError(data.error || 'Unknown error occurred', resultsBody);
            }

        } catch (error) {
            showError('Failed to connect to scanner server.', resultsBody);
            console.error(error);
        } finally {
            setLoading(false, scanBtn);
        }
    }

    async function startNetworkScan() {
        netResultsBody.innerHTML = '';
        setLoading(true, netScanBtn, "Scanning Subnet...");

        try {
            const response = await fetch('/scan_network', { method: 'POST' });
            const data = await response.json();

            if (response.ok) {
                renderNetworkResults(data);
            }
        } catch (error) {
            console.error(error);
            netResultsBody.innerHTML = `<tr><td colspan="4" style="color: var(--danger); text-align: center;">Scan Failed</td></tr>`;
        } finally {
            setLoading(false, netScanBtn, "Scan Network");
        }
    }

    function renderNetworkResults(data) {
        if (!data.hosts || data.hosts.length === 0) {
            netResultsBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem;">No active devices found.</td></tr>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        data.hosts.forEach(host => {
            const row = document.createElement('tr');
            const isSelf = host.type.includes('You');
            row.innerHTML = `
                <td style="font-family: monospace; ${isSelf ? 'color: var(--success); font-weight: bold;' : ''}">${host.ip}</td>
                <td><span class="status-badge open">ACTIVE</span></td>
                <td>${host.type}</td>
                <td>
                    <button class="action-btn" onclick="document.getElementById('target-input').value = '${host.ip}'; document.querySelector('[data-tab=scanner]').click();" style="border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: var(--text-main); font-size: 0.7em; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Scan Ports</button>
                </td>
            `;
            fragment.appendChild(row);
        });
        netResultsBody.appendChild(fragment);
    }

    function resetUI() {
        resultsBody.innerHTML = '';
        totalScannedEl.textContent = '0';
        openPortsEl.textContent = '0';
        scanTimeEl.textContent = '0ms';
    }

    function setLoading(isLoading, btn, text = null) {
        const btnText = btn.querySelector('.btn-text');
        // Handle case where btnText might be null if using a simpler button for net scan
        const targetText = btnText || btn;

        if (isLoading) {
            btn.disabled = true;
            btn.style.opacity = '0.7';
            if (text) targetText.textContent = text;
            else targetText.textContent = 'Scanning...';
            document.body.classList.add('scanning');
        } else {
            btn.disabled = false;
            btn.style.opacity = '1';
            let defaultText = btn === scanBtn ? 'Initialize Scan' : 'Scan Network';
            if (text) targetText.textContent = text;
            else targetText.textContent = defaultText;
            document.body.classList.remove('scanning');
        }
    }

    function renderResults(data) {
        if (!data.results || data.results.length === 0) {
            resultsBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem;">No open ports found.</td></tr>`;
            return;
        }

        const fragment = document.createDocumentFragment();

        data.results.forEach(result => {
            const row = document.createElement('tr');
            const statusClass = result.status.toLowerCase() === 'open' ? 'open' : 'closed';

            row.innerHTML = `
                <td style="font-family: monospace; color: var(--primary);">${result.port}</td>
                <td>${result.service}</td>
                <td><span class="status-badge ${statusClass}">${result.status.toUpperCase()}</span></td>
                <td style="color: var(--text-muted); font-size: 0.8em; font-family: monospace;">${result.banner || '-'}</td>
            `;
            fragment.appendChild(row);
        });

        resultsBody.appendChild(fragment);
    }

    function updateStats(results, timeMs) {
        totalScannedEl.textContent = results.length;
        const openCount = results.filter(r => r.status === 'Open').length;
        openPortsEl.textContent = openCount;
        scanTimeEl.textContent = `${Math.round(timeMs)}ms`;
    }

    function showError(msg, targetElement) {
        const target = targetElement || resultsBody;
        target.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--danger); padding: 2rem;">Error: ${msg}</td></tr>`;
        if (targetDisplay) targetDisplay.textContent = 'Scan Failed';
    }
});
