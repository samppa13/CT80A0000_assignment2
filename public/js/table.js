import { definitions } from './definitions.js'
import {
    select,
    tableHead,
    tableBody,
    tableTitle,
    dbDescription,
    recordCount,
    emptyState
} from './dom.js'
import { rows } from './state.js'
import { escapeHtml, displayValue } from './html.js'

export const render = () => {
    const db = select.value
    const definition = definitions[db]

    tableTitle.textContent = definition.title
    dbDescription.textContent = definition.description
    recordCount.textContent = `${rows.length} ${definition.plural}`

    tableHead.innerHTML = `<tr>${definition.columns.map(([, label]) =>
        `<th>${escapeHtml(label)}</th>`
    ).join('')}<th>Actions</th></tr>`

    tableBody.innerHTML = rows.map(row => `<tr>
        ${definition.columns.map(([key]) =>
            `<td>${displayValue(db, key, row[key])}</td>`
        ).join('')}
        <td>
            <div class="row-actions">
                <button class="small-button" data-action="edit" data-id="${row.id}">Edit</button>
                <button class="small-button delete" data-action="delete" data-id="${row.id}">Delete</button>
            </div>
        </td>
    </tr>`).join('')

    emptyState.textContent = `There are no ${definition.plural} in this database yet.`
    emptyState.classList.toggle('hidden', rows.length > 0)
}
