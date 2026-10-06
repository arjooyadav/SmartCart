import API from "../axios";

// One endpoint powers both the chat assistant and natural-language search — a chat
// message and a search sentence are the same kind of input, so they share this call.
// Returns { reply, interpreted, products: [{ product, reasons, score }] }.
export const askAssistant = async (message) => (await API.post("/ai/chat", { message })).data;
