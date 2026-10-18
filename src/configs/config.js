import { databases } from '../db/db.js'

const configs = {
    books: {
        db: databases.books,
        table: 'books',
        columns: ['id', 'title', 'author', 'year', 'genre', 'available'],
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'author', label: 'Author', type: 'text', required: true },
            { name: 'year', label: 'Publication year', type: 'number', required: true },
            { name: 'genre', label: 'Genre', type: 'text', required: true }
        ],
        listSql: 'SELECT * FROM books ORDER BY id',
        insertSql: `
            INSERT INTO books (title, author, year, genre)
            VALUES (@title, @author, @year, @genre)
        `,
        updateSql: `
            UPDATE books
            SET title = @title,
                author = @author,
                year = @year,
                genre = @genre
            WHERE id = @id
        `
    },

    customers: {
        db: databases.customers,
        table: 'customers',
        columns: ['id', 'first_name', 'last_name', 'email', 'joined_on'],
        fields: [
            { name: 'first_name', label: 'First name', type: 'text', required: true },
            { name: 'last_name', label: 'Last name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'joined_on', label: 'Joined date', type: 'date', required: true }
        ],
        listSql: 'SELECT * FROM customers ORDER BY id',
        insertSql: `
            INSERT INTO customers (first_name, last_name, email, joined_on)
            VALUES (@first_name, @last_name, @email, @joined_on)
        `,
        updateSql: `
            UPDATE customers
            SET first_name = @first_name,
                last_name = @last_name,
                email = @email,
                joined_on = @joined_on
            WHERE id = @id
        `
    },

    loans: {
        db: databases.loans,
        table: 'loans',
        columns: ['id', 'book_id', 'customer_id', 'returned'],
        fields: [
            { name: 'book_id', label: 'Book', type: 'select-books', required: true },
            { name: 'customer_id', label: 'Customer', type: 'select-customers', required: true },
            {
                name: 'returned',
                label: 'Returned',
                type: 'select',
                options: [
                    { value: '0', label: 'No' },
                    { value: '1', label: 'Yes' }
                ]
            }
        ],
        listSql: 'SELECT * FROM loans ORDER BY id',
        insertSql: `
            INSERT INTO loans (book_id, customer_id, returned)
            VALUES (@book_id, @customer_id, @returned)
        `,
        updateSql: `
            UPDATE loans
            SET book_id = @book_id,
                customer_id = @customer_id,
                returned = @returned
            WHERE id = @id
        `
    }
}

const getConfig = (request, response, next) => {
    const config = configs[request.params.database]

    if (!config) {
        return response.status(404).json({ error: 'Unknown database' })
    }

    request.config = config
    next()
}

export { getConfig }
