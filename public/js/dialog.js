import { definitions } from './definitions.js'
import {
    select,
    dialog,
    formFields,
    dialogTitle,
    dialogDetails,
    formError
} from './dom.js'
import { setEditingId, loanOptions } from './state.js'
import { escapeHtml } from './html.js'


export const openDialog = (row = null) => {
    setEditingId(row ? row.id : null)

    const definition = definitions[select.value]
    dialogTitle.textContent = row
        ? `Edit ${definition.singular}`
        : `Add ${definition.singular}`
    dialogDetails.textContent =
        `${definition.singular} details`.toUpperCase()
    formError.textContent = ''

    const fields = definition.fields.filter(field =>
        !(select.value === 'loans' && !row && field.name === 'returned')
    )

    formFields.innerHTML = fields.map(field => {
        const value = row
            ? row[field.name]
            : (field.type === 'date' && field.name === 'joined_on'
                ? new Date().toISOString().slice(0, 10)
                : ''
            )

        let input
        if (field.type === 'select') {
            input = `<select id="field-${field.name}" name="${field.name}">
                ${field.options.map(([optionValue, label]) =>
                    `<option value="${optionValue}" ${
                        String(value ?? field.options[0][0]) === optionValue
                            ? 'selected'
                            : ''
                    }>${escapeHtml(label)}</option>`
                ).join('')}
            </select>`
        }
        else if (field.type === 'select-books') {
            input = `<select id="field-${field.name}" name="${field.name}" required>
                <option value="">Select a book</option>
                ${loanOptions.books.map(book => {
                    const selected = String(value ?? '') === String(book.id)
                    const unavailable = Number(book.available) !== 1

                    return `<option
                        value="${book.id}"
                        ${selected ? 'selected' : ''}
                        ${unavailable && !selected ? 'disabled' : ''}
                    >${escapeHtml(book.title)} — ${escapeHtml(book.author)} (ID ${book.id})${unavailable ? ' (On loan)' : ''}</option>`
                }).join('')}
            </select>`
        }
        else if (field.type === 'select-customers') {
            input = `<select id="field-${field.name}" name="${field.name}" required>
                <option value="">Select a customer</option>
                ${loanOptions.customers.map(customer =>
                    `<option value="${customer.id}" ${
                        String(value ?? '') === String(customer.id)
                            ? 'selected'
                            : ''
                    }>${escapeHtml(customer.first_name)} ${escapeHtml(customer.last_name)} (ID ${customer.id})</option>`
                ).join('')}
            </select>`
        }
        else {
            input = `<input
                id="field-${field.name}"
                name="${field.name}"
                type="${field.type}"
                value="${escapeHtml(value ?? '')}"
                ${field.required ? 'required' : ''}
                ${field.type === 'number' ? 'min="0" step="1"' : ''}
            >`
        }

        const fullWidth =
            field.name === 'email'
            || field.name.includes('title')
            || field.name.includes('name')

        return `<div class="field ${fullWidth ? 'full' : ''}">
            <label for="field-${field.name}">${escapeHtml(field.label)}</label>
            ${input}
        </div>`
    }).join('')

    dialog.showModal()
}


export const closeDialog = () => {
    const dialogElement = document.querySelector('#recordDialog')
    dialogElement.close()
}
