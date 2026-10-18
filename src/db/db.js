import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, 'data')
fs.mkdirSync(dataDir, { recursive: true })

const databases = {
    books: new Database(path.join(dataDir, 'books.db')),
    customers: new Database(path.join(dataDir, 'customers.db')),
    loans: new Database(path.join(dataDir, 'loans.db'))
}

for (const database of Object.values(databases)) {
    database.pragma('journal_mode = WAL')
}

databases.books.exec(`
    CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        year INTEGER NOT NULL,
        genre TEXT NOT NULL,
        available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1))
    )
`)
databases.customers.exec(`
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        joined_on TEXT NOT NULL
    )
`)
databases.loans.exec(`
    CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        returned INTEGER NOT NULL DEFAULT 0 CHECK (returned IN (0, 1))
    )
`)

const seed = (db, countsql, insertsql, rows) => {
    if (db.prepare(countsql).get().count === 0) {
        const insert = db.prepare(insertsql)
        const transaction = db.transaction((items) =>
            items.forEach(item =>
                insert.run(...item)
            )
        )
        transaction(rows)
    }
}

seed(
    databases.books,
    'SELECT COUNT(*) AS count FROM books',
    'INSERT INTO books (title, author, year, genre, available) VALUES (?, ?, ?, ?, ?)',
    [
        ['Tuntematon sotilas', 'Väinö Linna', 1954, 'sotaromaani', 1],
        ['Seitsemän veljestä', 'Aleksis Kivi', 1870, 'romaani', 1],
        ['Sinuhe egyptiläinen', 'Mika Waltari', 1945, 'historiallinen romaani', 1],
        ['Rikos ja rangaistus', 'Fjodor Dostojevski', 1866, 'romaani', 1]
    ]
)
seed(
    databases.customers,
    'SELECT COUNT(*) AS count FROM customers',
    'INSERT INTO customers (first_name, last_name, email, joined_on) VALUES (?, ?, ?, ?)',
    [
        ['Matti', 'Meikäläinen', 'masa@gmail.com', '2025-01-12'],
        ['Samppa', 'Lajunen', 'samppa@gmail.com', '2025-02-15'],
        ['Valtteri', 'Virtanen', 'valtteri.virtanen@gmail.com', '2025-10-10'],
        ['Heikki', 'Heikkinen', 'heikki_heikkinen@gmail.com', '2025-12-12']
    ]
)
seed(
    databases.loans,
    'SELECT COUNT(*) AS count FROM loans',
    `INSERT INTO loans (book_id, customer_id, returned)
     VALUES (?, ?, ?)`,
    [
        [2, 1, 0],
        [3, 4, 1],
        [4, 2, 0],
        [1, 3, 0]
    ]
)


export { databases }
