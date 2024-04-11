const API_KEY = "AIzaSyDJNarpTj13i9GpP67KlJTPBEN3tRXyknQ";

export const SIGNUP_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`
export const LOGIN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`

const BACKEND_API_ORIGIN = "http://localhost:8082"
export const SYMBOL_URL = `${BACKEND_API_ORIGIN}/symbols`
export const WATCHLIST_URL = `${BACKEND_API_ORIGIN}/watchlists`
export const WATCHLIST_SYMBOL_URL = `${BACKEND_API_ORIGIN}/watchlist-symbols`
export const QUOTE_URL = `${BACKEND_API_ORIGIN}/quotes`

