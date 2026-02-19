/**
 * Generic Resource Shortcuts Handler
 * 
 * Handles the "Refresh" button logic for resource selection fields created with
 * the `render_resource_field` macro.
 */

document.addEventListener('DOMContentLoaded', function () {
    // Event delegation for refresh buttons
    document.body.addEventListener('click', async function (e) {
        const btn = e.target.closest('.resource-refresh-btn');
        if (!btn) return;

        const endpoint = btn.dataset.refreshEndpoint;
        const targetId = btn.dataset.targetId;
        const select = document.getElementById(targetId);

        if (!endpoint || !select) return;

        // Visual feedback
        const icon = btn.querySelector('i');
        if (icon) icon.classList.add('fa-spin');
        btn.disabled = true;

        try {
            // Fetch validation token if available in global scope, otherwise try to find it in DOM
            const csrfToken = window.csrf_token || document.querySelector('input[name="csrf_token"]')?.value;

            const headers = { 'Content-Type': 'application/json' };
            if (csrfToken) headers['X-CSRFToken'] = csrfToken;

            const response = await fetch(endpoint, { headers });
            if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

            const data = await response.json();

            // Store current selection
            const currentVal = $(select).val();

            // Clear and repopulate
            // Logic differs slightly if it's a standard select or Select2
            // For safety, we treat it as a standard select that might be enhanced

            // 1. Clear options
            select.innerHTML = '';

            // 2. Add placeholder if needed (Select2 often needs an empty option for placeholder)
            if (select.dataset.placeholder || select.getAttribute('placeholder')) {
                select.add(new Option(select.dataset.placeholder || "", "", true, true));
            }

            // 3. Add new options
            // Expecting data to be a list of objects with 'id' and 'name' (or 'title', 'email')
            data.forEach(item => {
                const text = item.name || item.title || item.email || item.text || "Unknown";
                const id = item.id;
                select.add(new Option(text, id, false, false));
            });

            // 4. Restore selection if possible
            if (currentVal && data.some(i => i.id == currentVal)) {
                $(select).val(currentVal).trigger('change');
            } else {
                $(select).val("").trigger('change');
            }

            // 5. Trigger Select2 update if applicable
            if ($(select).hasClass("select2-hidden-accessible")) {
                $(select).trigger('change.select2');
            }

        } catch (error) {
            console.error('Error refreshing resource:', error);
            alert('Failed to refresh list. Please try again.');
        } finally {
            if (icon) icon.classList.remove('fa-spin');
            btn.disabled = false;
        }
    });
});
