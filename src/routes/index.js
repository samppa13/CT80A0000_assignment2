import express from 'express'
import { databases } from '../db/db.js'
import { getConfig } from '../configs/config.js'

const router = express.Router()

const updateBookAvailability = (bookId) => {
    const activeLoan = databases.loans.prepare(`
        SELECT id
        FROM loans
        WHERE book_id = ? AND returned = 0
        LIMIT 1
    `).get(bookId)

    databases.books.prepare(`
        UPDATE books
        SET available = ?
        WHERE id = ?
    `).run(activeLoan ? 0 : 1, bookId)
}

// Päivitetään kirjojen saatavuus palvelimen käynnistyessä.
const books = databases.books.prepare('SELECT id FROM books').all()

for (const book of books) {
    updateBookAvailability(book.id)
}

router.get('/databases', (_request, response) => {
    response.json([
        { id: 'books', name: 'Books', description: 'Library books' },
        { id: 'customers', name: 'Customers', description: 'Library customers' },
        { id: 'loans', name: 'Loans', description: 'Loan and return records' }
    ])
})

router.get('/loan-options', (_request, response) => {
    response.json({
        books: databases.books.prepare(`
            SELECT id, title, author, available
            FROM books
            ORDER BY title
        `).all(),
        customers: databases.customers.prepare(`
            SELECT id, first_name, last_name, email
            FROM customers
            ORDER BY last_name, first_name
        `).all()
    })
})

router.get('/:database', getConfig, (request, response) => {
    if (request.params.database === 'loans') {
        const loans = databases.loans.prepare('SELECT * FROM loans ORDER BY id').all()
        const books = databases.books.prepare('SELECT id, title FROM books').all()
        const customers = databases.customers.prepare('SELECT id, first_name, last_name FROM customers').all()
        const bookMap = new Map(books.map(book => [book.id, book.title]))
        const customerMap = new Map(customers.map(customer => [
            customer.id,
            `${customer.first_name} ${customer.last_name}`
        ]))

        return response.json(loans.map(loan => ({
            ...loan,
            book_title: bookMap.get(loan.book_id)
                || `Unknown book (ID ${loan.book_id})`,
            customer_name: customerMap.get(loan.customer_id)
                || `Unknown customer (ID ${loan.customer_id})`
        })))
    }

    response.json(request.config.db.prepare(request.config.listSql).all())
})

router.post('/:database', getConfig, (request, response) => {
    try {
        const values = {}

        for (const field of request.config.fields) {
            const value = request.body[field.name]

            if (field.required && (value === undefined || String(value).trim() === '')) {
                return response.status(400).json({
                    error: `The "${field.label}" field is required`
                })
            }

            values[field.name] =
                field.type === 'number'
                || field.type === 'select'
                || field.name.endsWith('_id')
                    ? Number(value)
                    : value
        }

        if (request.params.database === 'loans') {
            const book = databases.books.prepare(`
                SELECT id, available
                FROM books
                WHERE id = ?
            `).get(values.book_id)

            if (!book) {
                return response.status(400).json({
                    error: 'The selected book was not found'
                })
            }
            if (book.available !== 1) {
                return response.status(409).json({
                    error: 'The selected book is not available for loan'
                })
            }

            const customer = databases.customers.prepare(
                'SELECT id FROM customers WHERE id = ?'
            ).get(values.customer_id)
            if (!customer) {
                return response.status(400).json({
                    error: 'The selected customer was not found'
                })
            }

            // Estetään kaksi samanaikaista lainausta.
            const createLoan = databases.loans.transaction(() => {
                const currentBook = databases.books.prepare(`
                    SELECT available
                    FROM books
                    WHERE id = ?
                `).get(values.book_id)
                if (!currentBook || currentBook.available !== 1) {
                    throw new Error(
                        'The selected book is not available for loan'
                    )
                }

                const result = databases.loans.prepare(`
                    INSERT INTO loans (book_id, customer_id, returned)
                    VALUES (@book_id, @customer_id, 0)
                `).run(values)

                databases.books.prepare(`
                    UPDATE books
                    SET available = 0
                    WHERE id = ?
                `).run(values.book_id)

                return result
            })

            const result = createLoan()
            const record = databases.loans.prepare(
                'SELECT * FROM loans WHERE id = ?'
            ).get(result.lastInsertRowid)

            return response.status(201).json(record)
        }

        const result = request.config.db.prepare(request.config.insertSql).run(values)
        const record = request.config.db.prepare(
            `SELECT * FROM ${request.config.table} WHERE id = ?`
        ).get(result.lastInsertRowid)

        response.status(201).json(record)
    } catch (error) {
        response.status(400).json({
            error: error.message.includes('UNIQUE')
                ? 'Email address is already used'
                : error.message.includes('not available')
                    ? error.message
                    : 'Failed to add the record'
        })
    }
})

router.put('/:database/:id', getConfig, (request, response) => {
    try {
        const id = Number(request.params.id)
        const database = request.params.database
        const config = request.config
        const existing = config.db.prepare(
            `SELECT * FROM ${config.table} WHERE id = ?`
        ).get(id)

        if (!existing) {
            return response.status(404).json({
                error: 'The record was not found'
            })
        }

        const values = { id }

        for (const field of config.fields) {
            const value = request.body[field.name]

            if (field.required &&(value === undefined || String(value).trim() === '')) {
                return response.status(400).json({
                    error: `The "${field.label}" field is required`
                })
            }

            values[field.name] =
                field.type === 'number' ||
                field.type === 'select' ||
                field.name.endsWith('_id')
                    ? Number(value)
                    : value
        }

        if (database === 'loans') {
            const book = databases.books.prepare(`
                SELECT id, available
                FROM books
                WHERE id = ?
            `).get(values.book_id)
            if (!book) {
                return response.status(400).json({
                    error: 'The selected book was not found'
                })
            }

            const customer = databases.customers.prepare(
                'SELECT id FROM customers WHERE id = ?'
            ).get(values.customer_id)
            if (!customer) {
                return response.status(400).json({
                    error: 'The selected customer was not found'
                })
            }

            const updateLoan = databases.loans.transaction(() => {
                if (Number(values.returned) === 0) {
                    const activeLoan = databases.loans.prepare(`
                        SELECT id
                        FROM loans
                        WHERE book_id = ?
                          AND returned = 0
                          AND id != ?
                        LIMIT 1
                    `).get(values.book_id, id)

                    if (activeLoan || (values.book_id !== existing.book_id && book.available !== 1)) {
                        throw new Error(
                            'The selected book is not available for loan'
                        )
                    }
                }

                databases.loans.prepare(config.updateSql).run(values)
                updateBookAvailability(existing.book_id)

                if (existing.book_id !== values.book_id) {
                    updateBookAvailability(values.book_id)
                }
            })

            updateLoan()
        }
        else {
            config.db.prepare(config.updateSql).run(values)

            if (database === 'books') {
                updateBookAvailability(id)
            }
        }

        const record = config.db.prepare(
            `SELECT * FROM ${config.table} WHERE id = ?`
        ).get(id)
        response.json(record)
    } catch (error) {
        response.status(400).json({
            error: error.message.includes('UNIQUE')
                ? 'Email address is already used'
                : error.message.includes('not available')
                    ? error.message
                    : 'Failed to update the record'
        })
    }
})

router.delete('/:database/:id', (request, response) => {
    const id = Number(request.params.id)
    const database = request.params.database
    const config = {
        books: {
            db: databases.books,
            table: 'books'
        },
        customers: {
            db: databases.customers,
            table: 'customers'
        },
        loans: {
            db: databases.loans,
            table: 'loans'
        }
    }[database]
    if (!config) {
        return response.status(404).json({
            error: 'Unknown database'
        })
    }

    const existing = config.db.prepare(
        `SELECT * FROM ${config.table} WHERE id = ?`
    ).get(id)

    if (!existing) {
        return response.status(404).json({
            error: 'The record was not found'
        })
    }
    if (database === 'books') {
        databases.loans.prepare(
            'DELETE FROM loans WHERE book_id = ?'
        ).run(id)
    }
    if (database === 'customers') {
        databases.loans.prepare(
            'DELETE FROM loans WHERE customer_id = ?'
        ).run(id)
    }

    config.db.prepare(
        `DELETE FROM ${config.table} WHERE id = ?`
    ).run(id)

    if (database === 'loans') {
        updateBookAvailability(existing.book_id)
    }

    response.status(204).end()
})

export default router
