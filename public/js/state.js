export let rows = []
export let editingId = null
export let loanOptions = { books: [], customers: [] }

export const setRows = (value) => {
    rows = value
}

export const setEditingId = (value) => {
    editingId = value
}

export const setLoanOptions = (value) => {
    loanOptions = value
}
