import {
    select,
    tableBody,
    form,
    formError,
    addButton,
    closeDialogButton,
    cancelButton,
    message
} from './dom.js'
import { definitions } from './definitions.js'
import { rows, setRows, setLoanOptions, editingId } from './state.js'
import { showMessage } from './messages.js'
import { getLoanOptions, getRows, deleteRow, saveRow } from './api.js'
import { render } from './table.js'
import { openDialog, closeDialog } from './dialog.js'

const currentDb = () => {
    return select.value
}

const loadRows = async () => {
    const db = currentDb()
    const definition = definitions[db]
    addButton.textContent = `Add ${definition.singular}`

    try {
        if (db === 'loans') {
            setLoanOptions(await getLoanOptions())
        }

        setRows(await getRows(db))
        render()
    } catch (error) {
        showMessage(error.message, true)
    }
}

addButton.addEventListener('click', () => openDialog())
closeDialogButton.addEventListener('click', closeDialog)
cancelButton.addEventListener('click', closeDialog)

select.addEventListener('change', async () => {
    await loadRows()
    message.classList.add('hidden')
})

tableBody.addEventListener('click', async event => {
    const button = event.target.closest('button[data-action]')

    if (!button) {
        return
    }

    const row = rows.find(item => item.id === Number(button.dataset.id))

    if (!row) {
        return
    }

    if (button.dataset.action === 'edit') {
        if (currentDb() === 'loans') {
            try {
                setLoanOptions(await getLoanOptions())
            } catch (error) {
                showMessage(error.message, true)
                return
            }
        }

        return openDialog(row)
    }

    if (button.dataset.action === 'delete') {
        const definition = definitions[currentDb()]

        const title = row.title ||
            `${row.first_name || ''} ${row.last_name || ''}`.trim() ||
            row.book_title ||
            `${definition.singular} ${row.id}`

        if (!confirm(`Delete '${title}'? This action cannot be undone.`)) {
            return
        }

        try {
            await deleteRow(currentDb(), row.id)
            showMessage(`${definition.singular} deleted.`)
            await loadRows()
        } catch (error) {
            showMessage(error.message, true)
        }
    }
})

form.addEventListener('submit', async event => {
    event.preventDefault()
    formError.textContent = ''

    const definition = definitions[currentDb()]
    const body = Object.fromEntries(new FormData(form).entries())

    for (const field of definition.fields) {
        if (Object.hasOwn(body, field.name) && ['number', 'select', 'select-books', 'select-customers'].includes(field.type)) {
            body[field.name] = Number(body[field.name])
        }
    }

    try {
        await saveRow(currentDb(), editingId, body)
        closeDialog()
        showMessage(editingId
            ? `${definition.singular.charAt(0).toUpperCase() + definition.singular.slice(1)} updated.`
            : `${definition.singular.charAt(0).toUpperCase() + definition.singular.slice(1)} added.`
        )
        await loadRows()
    } catch (error) {
        formError.textContent = error.message
    }
})

loadRows()
