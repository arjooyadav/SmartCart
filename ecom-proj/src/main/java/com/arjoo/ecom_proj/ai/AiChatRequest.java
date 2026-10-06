package com.arjoo.ecom_proj.ai;

/** Body of POST /api/ai/chat. email is optional today; later increments (personalisation) will use it. */
public class AiChatRequest {
    private String message;
    private String email;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
