export const getLoanOptions = async () => {
    const response = await fetch('/api/loan-options')

    if (!response.ok) {
        throw new Error('Failed to load book and customer options.')
    }

    return response.json()
}

export const getRows = async (db) => {
    const response = await fetch(`/api/${db}`)

    if (!response.ok) {
        throw new Error('Failed to load data.')
    }

    return response.json()
}

export const deleteRow = async (db, id) => {
    const response = await fetch(`/api/${db}/${id}`, {
        method: 'DELETE'
    })

    if (!response.ok) {
        throw new Error('Failed to delete the item.')
    }
}

export const saveRow = async (db, id, body) => {
    const response = await fetch(`/api/${db}${id ? `/${id}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })

    const result = response.status === 204 ? null : await response.json()

    if (!response.ok) {
        throw new Error(result?.error || 'Failed to save the item.')
    }
}
