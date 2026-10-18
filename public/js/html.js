export const escapeHtml = (value) => {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char])
}

export const displayValue = (db, key, value) => {
    if (key === 'book_title' || key === 'customer_name') {
        return `<span class="cell-main">${escapeHtml(value)}</span>`
    }

    if (['available', 'returned'].includes(key)) {
        const yes = Number(value) === 1
        const yesText = key === 'available' ? 'Available' : 'Yes'
        const noText = key === 'available' ? 'On loan' : 'No'

        return `<span class="pill ${yes ? '' : 'off'}">${yes ? yesText : noText}</span>`
    }

    if (db === 'books' && key === 'title') {
        return `<span class="cell-main">${escapeHtml(value)}</span>`
    }

    if (db === 'customers' && key === 'first_name') {
        return `<span class="cell-main">${escapeHtml(value)}</span>`
    }

    return escapeHtml(value)
}
