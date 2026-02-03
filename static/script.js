document.addEventListener('DOMContentLoaded', () => {
    const scanBtn = document.getElementById('scan-btn');
    const targetInput = document.getElementById('target-input');
    const resultsBody = document.getElementById('results-body');
    const targetDisplay = document.getElementById('target-display');

    // Stats elements
    const totalScannedEl = document.getElementById('total-scanned');
    const openPortsEl = document.getElementById('open-ports');
    const scanTimeEl = document.getElementById('scan-time');

    scanBtn.addEventListener('click', startScan);

    // Allow 'Enter' key to trigger scan
    targetInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startScan();
    });

    async function startScan() {
        const target = targetInput.value.trim();
        if (!target) return;

        // UI Reset
        resetUI();
        setLoading(true);
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
                showError(data.error || 'Unknown error occurred');
            }

        } catch (error) {
            showError('Failed to connect to scanner server.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function resetUI() {
        resultsBody.innerHTML = '';
        totalScannedEl.textContent = '0';
        openPortsEl.textContent = '0';
        scanTimeEl.textContent = '0ms';
    }

    function setLoading(isLoading) {
        if (isLoading) {
            scanBtn.disabled = true;
            scanBtn.style.opacity = '0.7';
            scanBtn.querySelector('.btn-text').textContent = 'Scanning...';
            document.body.classList.add('scanning');
        } else {
            scanBtn.disabled = false;
            scanBtn.style.opacity = '1';
            scanBtn.querySelector('.btn-text').textContent = 'Initialize Scan';
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

    function showError(msg) {
        resultsBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--danger); padding: 2rem;">Error: ${msg}</td></tr>`;
        targetDisplay.textContent = 'Scan Failed';
    }
});
