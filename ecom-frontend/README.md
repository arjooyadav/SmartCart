# Telusko store – React frontend

    npm install
    npm run dev          # http://localhost:5173  (backend expected on http://localhost:8080)

Set a different backend with `VITE_API_URL=https://your-host/api` in a `.env` file.

## Pages
| Route | Who | What |
|---|---|---|
| `/` | everyone | Hero, category filter, product grid (sample products if the DB is empty) |
| `/product/:id` | everyone | Product detail, add to cart |
| `/login` | everyone | Sign in / create account |
| `/cart` | signed-in users | Cart + checkout (reduces stock) |
| `/admin` | admin | Dashboard: stock, availability, edit, delete |
| `/add_product`, `/product/update/:id` | admin | Product forms |

Admins (arjoo, mandeep, tabish) are defined in `src/Context/AuthContext.jsx`; anyone else signs up as a shopper.
Auth is front-end only for now – see the note at the top of that file.
