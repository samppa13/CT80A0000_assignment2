export const definitions = {
    books: {
        title: 'Books',
        description: 'Library books',
        singular: 'book',
        plural: 'books',
        columns: [
            ['id', 'ID'],
            ['title', 'Book title'],
            ['author', 'Author'],
            ['year', 'Year'],
            ['genre', 'Genre'],
            ['available', 'Availability']
        ],
        fields: [
            { name: 'title', label: 'Book title', type: 'text', required: true },
            { name: 'author', label: 'Author', type: 'text', required: true },
            { name: 'year', label: 'Publication year', type: 'number', required: true },
            { name: 'genre', label: 'Genre', type: 'text', required: true }
        ]
    },

    customers: {
        title: 'Customers',
        description: 'Library customers',
        singular: 'customer',
        plural: 'customers',
        columns: [
            ['id', 'ID'],
            ['first_name', 'First name'],
            ['last_name', 'Last name'],
            ['email', 'Email'],
            ['joined_on', 'Registration date']
        ],
        fields: [
            { name: 'first_name', label: 'First name', type: 'text', required: true },
            { name: 'last_name', label: 'Last name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'joined_on', label: 'Registration date', type: 'date', required: true }
        ]
    },

    loans: {
        title: 'Loans',
        description: 'Loan and return information',
        singular: 'loan',
        plural: 'loans',
        columns: [
            ['id', 'ID'],
            ['book_title', 'Book title'],
            ['customer_name', 'Borrower'],
            ['returned', 'Returned']
        ],
        fields: [
            { name: 'book_id', label: 'Book', type: 'select-books', required: true },
            { name: 'customer_id', label: 'Customer', type: 'select-customers', required: true },
            {
                name: 'returned',
                label: 'Returned',
                type: 'select',
                options: [['0', 'No'], ['1', 'Yes']]
            }
        ]
    }
}
