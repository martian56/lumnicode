# 🪐 LUMNICODE DEVELOPER GUIDELINES

---

## 🚀 General Development Principles

### Code Quality Standards
- Write **clean, readable, and maintainable** code.  
- Follow the **DRY** (Don’t Repeat Yourself) principle.  
- Use **meaningful** variable and function names.  
- Keep functions **small** and focused on a **single responsibility**.  
- Comment **complex logic** and business rules.  
- Maintain **consistent formatting** and style across the codebase.  
- Keep it **simple** — don’t over-engineer or over-complicate.

---

## 🧩 Architecture Principles
- Follow **separation of concerns**.  
- Use **dependency injection** where appropriate.  
- Implement **proper error handling** and **logging**.  
- Design for **scalability and maintainability**, but don’t over-engineer — we want to move fast.  
- Follow **RESTful API** design principles.  
- Use **environment variables** for configuration.

---

## 💻 Coding Principles

### Linters
Always use linters to maintain code quality and style consistency.

### Language-Specific Standards
- **Java:** Use **Spring Boot** for REST APIs.  
- **Python:**  
  - Use **Pydantic** for data validation and serialization.  
  - Follow the **PEP8** style guide.  
- **JavaScript/TypeScript:**  
  - Use **TypeScript** with **strong typing**.  
- **Frontend:**  
  - Use **React** as the primary framework.

---

### Git Workflow
- Use our **official repositories**.  
- Always **use branches** for new features.  
- **Main branch:** `main`  
- **Development branch:** `develop`  
- **Commit frequently** and push to GitHub.  
- Write **full, descriptive commit messages**.

**Branch naming conventions:**
```

feature/feature_name
hotfix/fix_name
release/release_version

````

---

### Testing & Documentation
- Write **tests**, focusing on **critical points** (not 100% coverage yet).  
- Document architecture, design, and decisions in **Google Docs**.  
- Include **README** files in all projects.  
- Use **logs** for every feature and flow.

---

## 🔒 Security Guidelines
- **Never store cleartext passwords** anywhere.  
- Implement **proper session management**.  
- Apply **strict CORS** policies.  
- **Encrypt** all sensitive data — *security > performance.*

---

## 🌐 API Design

All APIs must follow **REST** principles and use **JWT tokens** for security.

---

### ✅ Request Format
```json
{
  "data": {
    // Payload as JSON fields
  },
  "metadata": {
    "requestId": "req-12345",
    "timestamp": "2025-07-20T10:30:00Z",
    "source": "user-service"
  }
}
````

---

### 🟢 Success Response

```json
{
  "success": true,
  "data": {
    // Response payload as JSON object
  },
  "metadata": {
    "requestId": "req-12345",
    "timestamp": "2025-07-20T10:30:01Z",
    "processingTime": 150
  }
}
```

---

### 🔴 Failure Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "metadata": {
    "requestId": "req-12345",
    "timestamp": "2025-07-20T10:30:01Z"
  }
}
```

---

## 🧠 Final Notes

* Keep the system **modular**, **secure**, and **easy to extend**.
* Prioritize **readability over cleverness**.
* Always think about the **next developer** who will read your code.

> “Simplicity is the soul of efficiency.” — Austin Freeman

```
