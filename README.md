# Rent-ALL – Local Rental Marketplace

## 1. Project Title and Team

### Project Title:
**Rent-ALL – Local Rental Marketplace**

### Team Members & Roles:
- **Frontend Developer:** Peter  
- **Backend Developer:** Jeremy  
- **Database Engineer:** Sage  
- **Presentation Manager & Cloud/Deployment Engineer:** Jeff  
- **Backend Developer (AI/Computer Vision Support):** Vishwash  

---

## 2. Problem Statement

Many people own items that are rarely used, while others need those same items temporarily but don’t want to purchase them. Existing rental platforms are often limited to specific categories (e.g., cars, tools) and lack flexible, local item sharing with strong trust systems.  

There is currently no simple, centralized platform for everyday users to safely rent items from each other across multiple categories.

---

## 3. Target Users

### Primary Users:
- Students and young adults who want to rent or lend items  
  *(e.g., tools, electronics, cameras, event supplies)*

### Secondary Users:
- Frequent renters/lenders who want to monetize unused items  
- Moderators/admins managing listings and disputes  

---

## 4. Proposed Solution

Rent-ALL is a web application that allows users to list items for rent, browse available items nearby, and securely communicate and transact with other users.

### Core User Flow:
1. User creates an account and lists an item (or browses available rentals).  
2. A renter selects an item, initiates a rental request, and chats with the owner.  
3. After the rental is completed, both users leave ratings and reviews.  

The platform focuses on trust, ease of use, and real-time communication.

---

## 5. Key Features with Priorities (MoSCoW)

### Must (Core Functionality)
- **User Accounts & Profiles** – Users create profiles with listed items, skills, and basic verification info.  
- **Browsing & Search Catalogue** – Users can browse, filter, and search available rental items.  
- **Rental Transactions** – Users can request, approve, and track rental agreements.  
- **Chat System** – Built-in messaging between renters and lenders.  
- **Category Sorting** – Items are organized into categories for easier navigation.  
- **Rating & Review System** – Users rate each other (1–5 stars) after transactions.  
- **Email Notifications** – Alerts for messages, rental updates, and confirmations.  

---

### Should (Important Enhancements)
- **Trust Rating System** – Combines ratings, response time, and history into a trust score.  
- **Badge System** – Rewards users based on Trust Rating System  
  *(e.g., “Top Lender”, “Reliable Renter”)*  
- **Smart Pricing Suggestions** – Suggests rental prices based on similar listings.  
- **Rental Bundling** – Users can group items together into packages.  

---

### Could (Nice to Have)
- **Map View of Listings** – Shows nearby rental items geographically.  
- **“For You” Page** – Personalized recommendations based on user activity.  

---

### Won’t (Out of Scope for This Quarter)
- **Computer Vision Damage Detection** – Too complex for timeline; may be explored later.  
- **Full AI Pricing Engine** – Only basic logic will be implemented initially.  
- **Subscription System (delivery/damage protection)** – Deferred for future expansion.  

---

## 6. Technical Direction

- **Frontend:** React  
- **Backend:** Node.js with Express (REST API)  
- **Database:** PostgreSQL  
- **Authentication:** JWT-based authentication  
- **Deployment:** AWS  
- **CI/CD:** GitHub Actions  

### Notes:
- Real-time chat may require WebSockets (potential complexity).  
- Email notifications will use a third-party service.  

---

## 7. Risks and Open Questions

### User Trust and Safety Concerns
Users may hesitate to rent items from strangers or worry about potential damage or misuse.  
→ *Mitigation:* Implement a rating/review system and basic profile verification to build trust.  

### Limited Development Timeline
The 8-week timeline may require reducing scope to ensure a functional MVP is delivered.  
→ *Mitigation:* Prioritize “Must” features and treat advanced features as stretch goals.  

### Complexity of Advanced Features (AI/Smart Systems)
Features such as smart pricing and damage detection may be difficult to implement accurately within the timeframe.  
→ *Mitigation:* Use simplified logic or mock implementations for MVP, with room for future improvement.  

---

## 8. AI Disclosure

AI tools (such as ChatGPT) were used to help brainstorm features, refine the project scope, and draft sections of this pitch document. All final decisions and structure were reviewed and adjusted by the team.
