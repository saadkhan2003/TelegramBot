# Product Requirements Document  
## Telegram Digital Store + Web Admin Control Panel

**Document version:** 1.0  
**Status:** Development-ready PRD  
**Product type:** Telegram commerce platform for authorized digital products  
**Primary interfaces:** Telegram Bot + Web Admin Control Panel  
**Recommended deployment:** VPS using Docker  
**Recommended stack:** TypeScript, NestJS, grammY, Next.js, PostgreSQL, Redis, BullMQ  
**Primary currency:** USD / USDT equivalent  
**Architecture:** Modular monolith initially, separated workers for asynchronous jobs

---

# 1. Product overview

The product is a complete digital-commerce platform built around Telegram.

Customers interact almost entirely through a Telegram bot. The business owner and staff manage the operation from a separate web-based control panel.

The system will support the sale and automatic delivery of legitimate digital products such as:

- software licenses
- activation links
- digital subscriptions
- redeemable codes
- gift codes
- access credentials where resale is permitted
- API credits
- hosting/VPS packages
- downloadable digital goods
- other authorized digital inventory

The system must not be tied specifically to ChatGPT, Claude, Cursor, CapCut, Gemini, or any particular brand. Products must be completely dynamic and created from the admin panel.

The platform should support:

```text
Telegram Customer
       │
       ▼
Telegram Bot
       │
       ▼
Backend API
       │
 ┌─────┼──────────────┐
 ▼     ▼              ▼
DB   Redis          Workers
 │                    │
 │                    ├── Payment verification
 │                    ├── Delivery
 │                    ├── Notifications
 │                    └── Scheduled jobs
 │
 └───── Business Logic
          │
          ├── Customers
          ├── Products
          ├── Inventory
          ├── Wallets
          ├── Orders
          ├── Deposits
          ├── Referrals
          ├── Support
          └── Analytics

Admin
 │
 ▼
Web Control Panel
 │
 └──────── Backend API
```

---

# 2. Product vision

The product should allow a business to operate a digital-goods store with minimal manual intervention.

A customer should be able to:

```text
Discover product
→ check stock
→ add wallet balance
→ purchase
→ receive product
→ view order
→ request support
```

without leaving Telegram.

The owner should be able to control the complete business from a browser without modifying source code.

---

# 3. Primary goals

The platform must provide four core capabilities.

### Customer commerce

Customers can browse, purchase and receive products directly through Telegram.

### Automated fulfilment

Preloaded inventory can be delivered immediately after payment.

### Financial accounting

Deposits, purchases, referral earnings, refunds and adjustments must be tracked through an auditable wallet ledger.

### Centralized administration

The business owner manages products, customers, money, inventory, orders and settings through a secure web dashboard.

---

# 4. User roles

## 4.1 Customer

Telegram customer who can:

- browse products
- purchase products
- deposit funds
- view wallet
- view purchase history
- receive digital goods
- generate referral links
- contact support
- submit warranty claims
- change language

---

## 4.2 Owner

Highest administrative role.

The owner can control every part of the system, including:

- payment settings
- administrators
- financial adjustments
- products
- inventory
- customers
- analytics
- integrations
- bot configuration

There should ideally be only one or a very small number of owner-level accounts.

---

## 4.3 Administrator

Can manage normal store operations but cannot access highly sensitive owner-only functions unless permission is granted.

---

## 4.4 Finance Manager

Can manage:

- deposits
- wallet transactions
- refunds
- financial reporting

Cannot see raw product credentials unless separately authorized.

---

## 4.5 Inventory Manager

Can:

- add products
- upload stock
- inspect stock
- disable inventory
- manage replacements

Should not automatically have access to financial configuration.

---

## 4.6 Support Agent

Can:

- view customers
- view orders
- respond to tickets
- process approved warranty replacements

Cannot:

- change receiving addresses
- modify admin accounts
- modify system secrets
- arbitrarily add wallet balance

---

## 4.7 Viewer

Read-only access to approved sections.

---

# 5. Major system components

The complete platform consists of:

```text
1. Telegram Bot
2. Backend API
3. Admin Web Application
4. PostgreSQL Database
5. Redis
6. Background Worker
7. Payment Verification Layer
8. Inventory Fulfilment Engine
9. Wallet Ledger Engine
10. Notification System
11. Audit Logging System
12. Backup System
13. Monitoring System
```

---

# 6. Telegram bot experience

# 6.1 First-time `/start`

When a customer opens the bot:

```text
🎉 Welcome to [STORE NAME]

Browse and purchase digital products instantly.

[ 🛒 Buy ]

[ 👤 Profile ]     [ 📦 Orders ]

[ 💰 Wallet ]      [ 🔗 Referral ]

[ 💬 Support ]

[ 🌐 Language ]
```

The backend must:

1. read the Telegram user ID
2. check whether the customer exists
3. create the customer if necessary
4. store username, first name and current language
5. process referral deep-link if present
6. display the main menu

---

# 7. Telegram user identity

The real customer identity must be based on:

```text
telegram_user_id
```

Never rely solely on Telegram username because usernames may change.

Store:

```text
telegram_user_id
telegram_username
telegram_first_name
telegram_last_name
telegram_language_code
preferred_language
created_at
last_seen_at
status
```

---

# 8. Main menu

Recommended menu:

```text
🛒 Buy

👤 Profile        📦 Purchase History

💰 Wallet         🔗 My Referral Link

🎫 Support

🌐 Language
```

Optional later:

```text
🔥 Deals
⭐ Featured
🔔 Notifications
🎁 Promotions
```

---

# 9. Product catalog

When the user taps `Buy`, the bot should show product categories.

Example:

```text
🛒 Product Catalog

Choose a category:

[ 🤖 AI Tools ]
[ 💻 Developer Tools ]

[ 🎨 Design ]
[ 🎬 Video Editing ]

[ 📺 Entertainment ]
[ 🔑 Licenses ]

[ 🔎 Search ]
[ 🏠 Main Menu ]
```

Categories are completely managed by administrators.

---

# 10. Category functionality

Admin can create:

```text
Name
Emoji
Description
Status
Sort order
Parent category
```

Categories can be:

```text
Active
Hidden
Disabled
```

The bot only displays active categories.

---

# 11. Product list

Selecting a category displays products.

Example:

```text
🤖 AI Tools

[ ChatGPT Plus ]
[ Claude Pro ]
[ Gemini Pro ]
[ Perplexity Pro ]

[ ← Back ]
[ 🏠 Main Menu ]
```

The system should support pagination.

Example:

```text
[ ◀ Previous ]  Page 2/6  [ Next ▶ ]
```

---

# 12. Product search

Search should support:

- exact match
- partial name
- keywords
- category
- aliases

Example:

Customer presses:

```text
🔎 Search
```

Bot asks:

```text
Enter product name:
```

Customer:

```text
cursor
```

Bot returns matching active products.

---

# 13. Product detail

Example:

```text
✨ Gemini Pro

💵 Price: $0.80
📦 Stock: 85
⚡ Delivery: Instant

📝 Activation link delivered after purchase.
Activate using your own email.

🛡 Warranty: 18 months

💰 Your Balance: $10.40

[ 🛒 Select Quantity ]

[ ← Back to Catalog ]
```

Product detail information must come from the database.

---

# 14. Product fields

Each product should support:

```text
id
sku
name
slug
category_id
short_description
full_description

normal_price
sale_price

currency

delivery_type
delivery_speed

warranty_enabled
warranty_days

minimum_quantity
maximum_quantity

allow_custom_quantity

track_inventory
low_stock_threshold

status

featured
sort_order

created_at
updated_at
```

---

# 15. Product status

Possible statuses:

```text
DRAFT
ACTIVE
HIDDEN
OUT_OF_STOCK
DISABLED
ARCHIVED
```

---

# 16. Product fulfilment types

The platform must support different digital fulfilment methods.

```text
PRELOADED_ACCOUNT
LICENSE_KEY
ACTIVATION_LINK
REDEEM_CODE
TEXT_SECRET
FILE_DOWNLOAD
MANUAL_DELIVERY
API_FULFILMENT
SUPPLIER_FULFILMENT
CUSTOM
```

---

# 17. Inventory model

Each individual stock unit must be represented separately.

Example:

```text
Product:
Cursor Pro

Inventory Item:
INV-32941

Payload:
email@example.com
password
recovery information

Status:
AVAILABLE
```

---

# 18. Inventory statuses

Use:

```text
AVAILABLE
RESERVED
SOLD
DISABLED
EXPIRED
REPLACED
RETURNED
ERROR
```

---

# 19. Sensitive inventory storage

Credentials or sensitive digital information must be encrypted at rest.

For example:

```text
encrypted_payload
```

rather than storing plaintext credentials directly.

The encryption key must not be stored in the database itself.

It should come from environment secrets.

---

# 20. Inventory creation

Admin must be able to add inventory through:

### Manual entry

Single inventory item.

### Bulk paste

Example:

```text
user1@example.com|password1
user2@example.com|password2
user3@example.com|password3
```

### CSV import

CSV template configurable by fulfilment type.

### TXT upload

For simple code/key lists.

### API import

Future supplier integration.

---

# 21. Inventory validation

On import, validate:

- duplicate entries
- invalid fields
- missing credentials
- already sold items
- malformed URLs
- duplicate activation codes

Admin should receive an import summary:

```text
Uploaded: 100
Accepted: 95
Duplicates: 3
Invalid: 2
```

---

# 22. Inventory stock calculation

Stock must not simply be manually entered.

For inventory-tracked products:

```text
available_stock =
COUNT(inventory_items WHERE status = AVAILABLE)
```

Product stock displayed to customers should derive from real inventory.

---

# 23. Quantity selection

When the user selects a product:

```text
How many do you need?

[ 1 ] [ 2 ] [ 3 ]

[ 5 ] [ 10 ] [ ✏ Custom ]

[ ← Back ]
```

Buttons must respect:

```text
minimum_quantity
maximum_quantity
available_stock
```

---

# 24. Custom quantity

Bot requests:

```text
Enter quantity for Gemini Pro

Price per unit: $0.80
Available stock: 85

Type the number of units:
```

Backend validates:

```text
quantity > 0
quantity >= minimum_quantity
quantity <= maximum_quantity
quantity <= available_stock
```

---

# 25. Purchase confirmation

Before charging the customer:

```text
🧾 Confirm Purchase

Product: Gemini Pro
Quantity: 3

Unit price: $0.80
Total: $2.40

Wallet balance: $10.00
Balance after purchase: $7.60

[ ✅ Confirm Purchase ]

[ ❌ Cancel ]
```

This confirmation step should be mandatory.

---

# 26. Insufficient balance

If balance is insufficient:

```text
❌ Insufficient Balance

Product: Gemini Pro
Total: $2.40

Your Balance:
$1.00

Required:
$1.40 more

[ 💰 Top Up Wallet ]

[ ← Back to Product ]

[ 🛒 Catalog ]
```

---

# 27. Wallet architecture

Every customer receives an internal wallet.

The wallet must maintain:

```text
Current balance
Lifetime deposited
Lifetime spent
Lifetime refunded
Referral earnings
Manual adjustments
```

However, `balance` must not be the sole financial source of truth.

---

# 28. Ledger system

Every monetary movement creates a ledger transaction.

Example:

```text
+50.00 DEPOSIT
-28.00 ORDER_PURCHASE
+2.80 REFERRAL_COMMISSION
+5.00 REFUND
-2.00 ADMIN_ADJUSTMENT
```

Fields:

```text
id
wallet_id

type

amount
currency

direction

reference_type
reference_id

balance_before
balance_after

status

description

created_by
created_at
```

---

# 29. Wallet transaction types

```text
DEPOSIT
ORDER_PURCHASE
REFUND
REFERRAL_COMMISSION
PROMOTIONAL_CREDIT
ADMIN_CREDIT
ADMIN_DEBIT
CHARGEBACK
REVERSAL
```

---

# 30. Currency accuracy

Never use floating-point storage for financial values.

PostgreSQL fields should use something like:

```text
NUMERIC(18,8)
```

or integer smallest units where appropriate.

---

# 31. Wallet screen

Telegram example:

```text
💰 My Wallet

Balance:
$25.80

Total Deposited:
$100.00

Total Spent:
$78.20

Referral Earnings:
$4.00

Choose a method:

[ 💵 USDT ]

[ 💎 TON ]

[ ₿ Bitcoin ]

[ 🪙 Litecoin ]

[ 🔄 Refresh Balance ]

[ 🏠 Main Menu ]
```

Payment methods shown should be admin-configurable.

---

# 32. Payment networks

The data model must support an extensible network list.

Potential examples:

```text
USDT_BEP20
USDT_TRC20
USDT_ERC20
BTC
TON
LTC
```

The MVP does not need all of them enabled.

Recommended initial options:

```text
USDT BEP20
USDT TRC20
TON
```

---

# 33. Deposit flow

Customer chooses a payment method.

Example:

```text
💵 USDT — BEP20

Receiving Address:

0x...

Minimum Deposit:
$1

⚠ Send only USDT using the BEP20 network.

After transfer, send your transaction hash below.

[ ← Wallet ]
```

---

# 34. Transaction hash submission

After selecting a network, set user conversation state:

```text
WAITING_FOR_TXID
```

When the customer sends text, interpret it as a transaction hash.

---

# 35. Deposit verification

Never credit balance simply because a customer submits a transaction hash.

Verify:

```text
Transaction exists
Correct network
Transaction successful
Correct destination address
Correct token/asset
Correct amount
Minimum deposit satisfied
Required confirmations met
Transaction not previously used
```

---

# 36. Deposit statuses

```text
AWAITING_TXID
VERIFYING
PENDING_CONFIRMATIONS
CONFIRMED
CREDITED
FAILED
REJECTED
DUPLICATE
EXPIRED
MANUAL_REVIEW
```

---

# 37. Deposit record

Store:

```text
id
user_id
wallet_id

network_id

receiving_address
transaction_hash

reported_amount
verified_amount

status

block_number
confirmations

created_at
verified_at
credited_at
```

---

# 38. Duplicate transaction protection

Create a unique constraint on:

```text
network + transaction_hash
```

A blockchain transaction must never credit two users.

---

# 39. Automatic wallet credit

Once verified:

```text
BEGIN TRANSACTION

lock deposit
check not already credited
create wallet ledger transaction
update cached wallet balance
mark deposit CREDITED

COMMIT
```

Then Telegram sends:

```text
✅ Deposit Confirmed

Amount:
$25.00

New Balance:
$42.80

[ 🛒 Start Shopping ]
[ 💰 Wallet ]
```

---

# 40. Future automatic deposit monitoring

V2 can eliminate manual TxID input.

Architecture:

```text
Customer assigned deposit address
        ↓
Blockchain watcher
        ↓
Transaction detected
        ↓
Confirmation threshold reached
        ↓
Automatic wallet credit
```

---

# 41. Order architecture

Order flow:

```text
Select product
   ↓
Select quantity
   ↓
Validate stock
   ↓
Validate wallet
   ↓
Confirm
   ↓
Reserve stock
   ↓
Debit wallet
   ↓
Create order
   ↓
Mark inventory sold
   ↓
Generate delivery
   ↓
Send Telegram delivery
```

---

# 42. Order statuses

```text
PENDING
AWAITING_PAYMENT
PROCESSING
FULFILLED
PARTIALLY_FULFILLED
FAILED
CANCELLED
REFUNDED
PARTIALLY_REFUNDED
UNDER_REVIEW
```

Wallet purchases generally move quickly:

```text
PENDING
→ PROCESSING
→ FULFILLED
```

---

# 43. Atomic checkout

Checkout must execute inside a PostgreSQL transaction.

Conceptually:

```text
BEGIN;

LOCK user wallet;

VERIFY balance;

LOCK required inventory rows;

VERIFY inventory availability;

CREATE order;

CREATE order items;

CREATE wallet debit;

UPDATE cached wallet balance;

MARK inventory as SOLD;

CREATE delivery;

COMMIT;
```

If any critical operation fails:

```text
ROLLBACK;
```

---

# 44. Concurrency protection

Suppose only one product unit remains and two users purchase simultaneously.

Use row locking such as:

```text
SELECT ...
FOR UPDATE SKIP LOCKED
```

where appropriate.

Only one transaction should acquire the inventory item.

---

# 45. Inventory reservation

For longer processing flows:

```text
AVAILABLE
→ RESERVED
→ SOLD
```

Reservation should have:

```text
reserved_for_order_id
reserved_at
reservation_expires_at
```

Expired reservations return to `AVAILABLE`.

---

# 46. Instant delivery

After successful order fulfilment:

```text
✅ Purchase Successful

Order:
#ORD-10291

Product:
Gemini Pro

Quantity:
1

Paid:
$0.80

━━━━━━━━━━

Your Delivery:

Activation Link:
https://...

━━━━━━━━━━

Warranty:
Until 26 March 2028

Please save your information securely.

[ 📦 View Order ]
[ 🛒 Buy Again ]
[ 💬 Support ]
```

---

# 47. Delivery records

Do not attach sensitive fulfilment data directly only to `orders`.

Use dedicated delivery records:

```text
id
order_item_id
inventory_item_id

encrypted_delivery_payload

delivery_method

telegram_message_id

delivered_at
viewed_at

status
```

---

# 48. Purchase history

Telegram:

```text
📦 Purchase History

#ORD-10291
Gemini Pro
$0.80
26 Sep 2026
✅ Completed

#ORD-10215
Cursor Pro
$28
20 Sep 2026
✅ Completed
```

Support pagination.

---

# 49. Order details

Selecting an order:

```text
📦 Order #ORD-10291

Status:
Completed

Product:
Gemini Pro

Quantity:
1

Paid:
$0.80

Purchased:
26 Sep 2026

Warranty:
Active

[ 🔐 View Delivery ]

[ 🛡 Warranty / Support ]

[ 🏠 Main Menu ]
```

---

# 50. Secure delivery viewing

Sensitive credentials should not be repeatedly printed without control.

Possible approach:

```text
View Delivery
```

reveals information in Telegram.

If practical, warn:

```text
Do not forward this message.
```

For highly sensitive products, future versions can use temporary secure links.

---

# 51. Refund system

Refund types:

```text
FULL_REFUND
PARTIAL_REFUND
WALLET_CREDIT
REPLACEMENT
```

Admin must provide:

```text
reason
amount
operator
notes
```

Every refund creates wallet ledger entries and audit logs.

---

# 52. Warranty system

Products can have:

```text
warranty_enabled
warranty_duration
warranty_terms
```

Customers select:

```text
🛡 Warranty / Support
```

Then:

```text
What is wrong?

[ Cannot Login ]

[ Activation Failed ]

[ Product Disabled ]

[ Credentials Changed ]

[ Other ]
```

---

# 53. Warranty claim

Store:

```text
id
user_id
order_id
order_item_id

reason
customer_message

status

assigned_admin_id

resolution
replacement_inventory_id

created_at
resolved_at
```

Statuses:

```text
OPEN
UNDER_REVIEW
NEED_CUSTOMER_INFO
APPROVED
REJECTED
REPLACED
REFUNDED
CLOSED
```

---

# 54. Replacement process

Admin selects:

```text
Approve Replacement
```

The system:

1. selects a valid available inventory item
2. associates it with the warranty claim
3. marks previous item as `REPLACED`
4. marks new item `SOLD`
5. sends replacement to customer
6. records admin action
7. closes claim when appropriate

---

# 55. Referral system

Each customer receives:

```text
https://t.me/YourBot?start=ref_<ID>
```

When a new user opens that link, record the referral relationship.

---

# 56. Referral configuration

Admin settings:

```text
Enabled
Commission percentage
Commission type
Minimum qualifying order
First-order only
All orders
Maximum commission
Commission delay
Fraud hold period
```

---

# 57. Referral calculation

Example:

```text
Purchase:
$20

Commission:
10%

Referral earning:
$2
```

Wallet transaction:

```text
+2.00
REFERRAL_COMMISSION
```

---

# 58. Referral abuse protection

Prevent:

```text
Self-referral
Circular referrals
Same Telegram account
Duplicate commission
Refunded-order commissions
Repeated referral manipulation
```

Referral commissions should be reversible if the related order is refunded.

---

# 59. Profile

Telegram profile:

```text
👤 Customer Profile

Username:
@username

Balance:
$25.80

Total Deposited:
$100

Total Spent:
$78.20

Orders:
14

Referrals:
3

Referral Earnings:
$4.00

Member Since:
12 Aug 2026

[ 🔗 Referral Link ]

[ 🏠 Main Menu ]
```

---

# 60. Language system

The system must use translation keys from the beginning.

Example:

```text
en
ur
zh
ru
vi
```

Instead of hardcoded strings:

```typescript
"Buy"
```

use:

```typescript
t("menu.buy")
```

---

# 61. Translation management

Translation table:

```text
key
language_code
value
updated_at
```

Example:

```text
menu.buy
```

English:

```text
Buy
```

Urdu:

```text
خریدیں
```

Admin should be able to update translations through the control panel.

---

# 62. Support system

Telegram support menu:

```text
💬 Support

How can we help?

[ 📦 Order Problem ]

[ 💰 Deposit Problem ]

[ 🛡 Warranty ]

[ ❓ Product Question ]

[ ✉ Other ]

[ 👤 Contact Human Support ]

[ 🏠 Main Menu ]
```

---

# 63. Support tickets

Ticket statuses:

```text
OPEN
ASSIGNED
WAITING_CUSTOMER
WAITING_ADMIN
RESOLVED
CLOSED
```

Priority:

```text
LOW
NORMAL
HIGH
URGENT
```

---

# 64. Support conversation

The customer can send text after selecting ticket type.

The bot associates messages with the active ticket.

Admin sees them from the web control panel.

Admin replies from the dashboard.

The customer receives the response through Telegram.

---

# 65. Admin control panel

The web control panel should live on a subdomain such as:

```text
admin.example.com
```

The owner should not need Telegram admin commands for normal operations.

---

# 66. Admin authentication

Admin authentication must support:

```text
Email
Password
2FA
Session management
Logout all sessions
Password reset
Optional IP restrictions
```

---

# 67. Dashboard

The first screen should provide an overview.

Cards:

```text
Today Revenue
Today Orders
Deposits
Refunds
Gross Profit
Customers
New Customers
Active Products
Available Inventory
Low Stock Products
Out-of-Stock Products
Open Tickets
Warranty Claims
Pending Deposits
```

---

# 68. Dashboard charts

Charts:

```text
Revenue by day
Orders by day
Deposits by day
New customers
Top-selling products
Top categories
Refund rate
Warranty rate
Referral sales
```

Filters:

```text
Today
Yesterday
7 Days
30 Days
Month
Custom Range
```

---

# 69. Product management page

Admin sees:

```text
Product
Category
Price
Sale Price
Stock
Status
Orders
Revenue
Updated
```

Actions:

```text
Create
Edit
Duplicate
Disable
Archive
View Inventory
```

---

# 70. Product editor

Sections:

### General

```text
Name
SKU
Category
Description
Short description
```

### Pricing

```text
Regular price
Sale price
Currency
```

### Fulfilment

```text
Delivery type
Instant/manual
Instructions
```

### Inventory

```text
Track inventory
Minimum quantity
Maximum quantity
Low-stock threshold
```

### Warranty

```text
Enabled
Duration
Terms
```

### Visibility

```text
Active
Featured
Sort order
```

---

# 71. Inventory control panel

Inventory page should support filters:

```text
Product
Status
Supplier
Purchase cost
Created date
Sold date
Order
```

Actions:

```text
Add stock
Bulk upload
Export
Disable
Replace
Inspect
Delete unused stock
```

Sensitive fields should only be visible to permitted roles.

---

# 72. Bulk inventory screen

Admin:

```text
Choose Product

Import Type:
CSV
TXT
Paste

Delimiter:
|

Preview:
10 rows

[ Validate ]
```

After validation:

```text
Valid: 9
Duplicate: 1

[ Import Valid Items ]
```

---

# 73. Customer management

Columns:

```text
Telegram ID
Username
Balance
Deposited
Spent
Orders
Referrals
Status
Joined
Last Seen
```

Search by:

```text
Telegram ID
Username
Internal customer ID
Order ID
Transaction
```

---

# 74. Customer profile in admin

Tabs:

```text
Overview
Orders
Wallet
Deposits
Referrals
Tickets
Warranty
Audit
Notes
```

Admin actions depending on permissions:

```text
Freeze customer
Unfreeze
Add note
Adjust wallet
Send Telegram message
Open order
Review referral activity
```

---

# 75. Customer statuses

```text
ACTIVE
FROZEN
BLOCKED
UNDER_REVIEW
```

Frozen customers cannot create new orders.

---

# 76. Wallet management

Admin can inspect the complete wallet ledger.

Filters:

```text
Customer
Transaction type
Amount
Date
Reference
Created by
```

---

# 77. Manual wallet adjustment

Only privileged administrators.

Form:

```text
Customer
Credit/Debit
Amount
Reason
Internal note
```

System creates:

```text
ADMIN_CREDIT
```

or:

```text
ADMIN_DEBIT
```

Never directly edit wallet balance.

---

# 78. Deposit management

Deposit list:

```text
Deposit ID
Customer
Network
TxID
Amount
Status
Confirmations
Date
```

Admin can:

```text
View blockchain verification result
Retry verification
Send to manual review
Reject
```

Manual credit should require elevated permission and audit logging.

---

# 79. Orders admin page

Columns:

```text
Order
Customer
Product
Quantity
Amount
Status
Delivery
Date
```

Filters:

```text
Date
Product
Customer
Status
Amount
Category
```

---

# 80. Order details in admin

Display:

```text
Order ID
Customer
Products
Pricing
Wallet debit
Inventory assigned
Delivery data
Warranty
Support tickets
Referral commission
Refund history
Audit history
```

Actions:

```text
Resend delivery
Replace item
Refund
Add note
Open support ticket
Mark for review
```

---

# 81. Referral management

Dashboard:

```text
Total referrals
Referral orders
Commission paid
Top referrers
Conversion rate
Suspicious activity
```

Admins can:

```text
Disable referral
Freeze commission
Reverse commission
View referral tree
```

---

# 82. Support dashboard

Columns:

```text
Ticket
Customer
Category
Priority
Status
Assigned To
Last Message
Created
```

Support agent opens ticket and sees the full Telegram conversation.

---

# 83. Warranty dashboard

Columns:

```text
Claim
Order
Product
Customer
Reason
Warranty expiration
Status
Assigned admin
```

Actions:

```text
Approve
Reject
Ask question
Replace
Refund
Close
```

---

# 84. Notifications

The system supports transactional notifications.

Examples:

```text
Deposit confirmed
Order completed
Order failed
Wallet credited
Referral commission
Low stock
Warranty response
Support reply
Refund processed
```

---

# 85. Broadcasts

Owner can send Telegram broadcasts.

Filters:

```text
All customers
Language
Purchased product
Never purchased
High-value customer
Joined after date
Joined before date
```

Broadcast system must queue messages and obey Telegram API limits.

---

# 86. Broadcast preview

Before sending:

```text
Audience:
2,314 customers

Message:
...

[ Send Test ]

[ Schedule ]

[ Send Now ]
```

---

# 87. Broadcast reporting

Track:

```text
Queued
Sent
Failed
Blocked Bot
```

---

# 88. Coupon system

Recommended but can be delayed until after MVP.

Coupon fields:

```text
code
type
value
minimum_order
maximum_discount
usage_limit
per_user_limit
starts_at
expires_at
eligible_products
eligible_categories
```

Types:

```text
PERCENTAGE
FIXED
```

---

# 89. Promotions

Admin may create:

```text
Flash sale
Featured product
Category sale
Customer-specific discount
Referral campaign
```

---

# 90. Supplier management

Recommended from the beginning at database level.

Supplier:

```text
id
name
contact
telegram
email
notes
status
```

Inventory can optionally reference a supplier.

---

# 91. Inventory cost tracking

Each inventory item should optionally store:

```text
purchase_cost
supplier_id
purchase_reference
```

This allows actual profit calculation.

Example:

```text
Cost:
$14

Selling price:
$28

Gross profit:
$14
```

---

# 92. Profitability reports

Calculate:

```text
Revenue
- Inventory Cost
- Refunds
- Referral Commission
- Payment Costs
= Gross Contribution
```

This is better than reporting revenue alone.

---

# 93. API supplier fulfilment

Future products can use:

```text
fulfilment_type = SUPPLIER_API
```

Flow:

```text
Customer purchases
     ↓
Your order created
     ↓
Supplier API called
     ↓
Supplier provisions product
     ↓
Your backend receives result
     ↓
Customer receives delivery
```

---

# 94. Supplier API safety

Supplier fulfilment must have:

```text
Timeout handling
Retry limits
Idempotency
Response validation
Failure queue
Manual review
```

Never continuously retry indefinitely.

---

# 95. Admin role-based access control

Permissions should be granular.

Examples:

```text
products.view
products.edit

inventory.view
inventory.credentials_view
inventory.create

orders.view
orders.refund

wallets.view
wallets.adjust

deposits.view
deposits.override

support.manage

admins.manage

settings.manage
```

---

# 96. Audit logs

Every sensitive admin action must generate an audit record.

Store:

```text
admin_id
action
resource_type
resource_id
before_data
after_data
ip_address
user_agent
timestamp
```

Audit examples:

```text
Changed product price
Viewed sensitive inventory
Adjusted customer wallet
Refunded order
Changed receiving address
Added administrator
Disabled customer
Approved replacement
```

---

# 97. Security requirements

Mandatory:

```text
HTTPS
Admin 2FA
Secure password hashing
Rate limiting
CSRF protection
Secure cookies
SameSite cookie settings
Content Security Policy
SQL injection protection
Input validation
Output escaping
Encryption at rest for sensitive inventory
Secret management
Audit logging
Database backups
Session rotation
Login throttling
```

---

# 98. Telegram bot token security

The Telegram bot token must exist only in server-side secrets.

Example environment variable:

```text
TELEGRAM_BOT_TOKEN=
```

Never expose it in:

```text
Telegram messages
Frontend code
Git repository
Application logs
Screenshots
Admin API responses
```

If a token becomes exposed, regenerate it immediately.

---

# 99. Crypto secret security

If the system ever manages private keys, they require significantly stronger security.

For the first version, preferably use:

- public receiving addresses
- external wallet infrastructure
- blockchain APIs

Avoid storing hot-wallet private keys unnecessarily.

---

# 100. Authentication architecture

Admin authentication:

```text
Login
 ↓
Password verification
 ↓
2FA verification
 ↓
Create server session
 ↓
Secure HttpOnly cookie
```

Session records:

```text
admin_id
session_id
ip
user_agent
created_at
last_active
expires_at
revoked_at
```

---

# 101. Rate limiting

Protect:

```text
Admin login
Telegram webhook
Deposit TxID submission
Search
Support message creation
API endpoints
```

---

# 102. Backend architecture

Recommended backend:

```text
NestJS
TypeScript
```

Modules:

```text
AuthModule
AdminModule
CustomerModule
TelegramModule

CategoryModule
ProductModule
InventoryModule

WalletModule
DepositModule
PaymentModule

OrderModule
DeliveryModule

ReferralModule

SupportModule
WarrantyModule

NotificationModule
BroadcastModule

SupplierModule

LocalizationModule
AnalyticsModule

AuditModule
SettingsModule
```

---

# 103. Telegram framework

Recommended:

```text
grammY
```

Reasons:

- mature Telegram support
- middleware
- inline keyboard support
- conversations
- TypeScript-friendly
- maintainable architecture

---

# 104. Admin frontend

Recommended:

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
```

The control panel should be desktop-first but fully responsive.

---

# 105. Database

Recommended:

```text
PostgreSQL
```

ORM:

```text
Prisma
```

---

# 106. Redis

Redis responsibilities:

```text
Conversation state
Rate limiting
Caching
Job queues
Distributed locks where necessary
Temporary reservations
```

---

# 107. Background jobs

Recommended:

```text
BullMQ
```

Workers process:

```text
Deposit verification
Telegram delivery
Broadcasts
Supplier fulfilment
Reservation expiry
Scheduled notifications
Low-stock checks
Backup notifications
Retryable jobs
```

---

# 108. Database entities

Core database model:

```text
users
user_preferences

admins
roles
permissions
admin_roles
role_permissions
admin_sessions

categories
products
product_translations

inventory_items
inventory_imports
suppliers

wallets
wallet_transactions

payment_networks
deposit_addresses
deposits

orders
order_items
deliveries
refunds

referrals
referral_commissions

support_tickets
support_messages

warranty_claims
replacements

notifications
broadcasts
broadcast_deliveries

translations

system_settings

audit_logs
```

---

# 109. User table

Important fields:

```text
id UUID
telegram_user_id BIGINT UNIQUE
telegram_username
first_name
last_name

preferred_language

status

referred_by_user_id

created_at
updated_at
last_seen_at
```

---

# 110. Wallet table

```text
id
user_id UNIQUE
currency
cached_balance
created_at
updated_at
```

---

# 111. Wallet transaction table

```text
id
wallet_id

type
direction

amount

reference_type
reference_id

balance_before
balance_after

description

status

created_by_admin_id

created_at
```

---

# 112. Product table

```text
id
category_id
sku

name
slug

description
short_description

price
sale_price

currency

delivery_type
delivery_speed

warranty_enabled
warranty_days

min_quantity
max_quantity

allow_custom_quantity

track_inventory
low_stock_threshold

status

featured
sort_order

created_at
updated_at
```

---

# 113. Inventory table

```text
id
product_id
supplier_id

encrypted_payload

status

purchase_cost

reserved_order_id
reserved_at

sold_order_item_id
sold_at

expires_at

created_at
updated_at
```

---

# 114. Orders table

```text
id
order_number
user_id

subtotal
discount
total

currency

status

wallet_transaction_id

created_at
completed_at
cancelled_at
```

---

# 115. Order item table

```text
id
order_id
product_id

product_name_snapshot
unit_price
quantity
total

warranty_days_snapshot

status
```

Snapshots ensure historic orders remain correct if product information changes later.

---

# 116. Deposit table

```text
id
user_id
wallet_id

payment_network_id

deposit_address
transaction_hash

reported_amount
verified_amount

status

verification_data JSONB

created_at
verified_at
credited_at
```

---

# 117. Referral table

```text
id
referrer_user_id
referred_user_id

source

created_at
```

Unique constraint on:

```text
referred_user_id
```

so a user has only one original referrer.

---

# 118. Support ticket table

```text
id
ticket_number

user_id
order_id nullable

category
priority
status

assigned_admin_id

created_at
updated_at
closed_at
```

---

# 119. System settings

Settings examples:

```text
store_name
store_logo

support_username

default_language

referrals_enabled
referral_rate

minimum_deposit

maintenance_mode

telegram_notifications

low_stock_notifications
```

Sensitive secrets should not be stored in generic settings if environment-secret storage is more appropriate.

---

# 120. API design

Version APIs:

```text
/api/v1/
```

Recommended endpoint groups:

```text
/api/v1/admin/auth
/api/v1/admin/dashboard

/api/v1/admin/products
/api/v1/admin/categories
/api/v1/admin/inventory

/api/v1/admin/customers

/api/v1/admin/orders
/api/v1/admin/refunds

/api/v1/admin/wallets
/api/v1/admin/deposits

/api/v1/admin/referrals

/api/v1/admin/support
/api/v1/admin/warranty

/api/v1/admin/broadcasts

/api/v1/admin/reports

/api/v1/admin/settings

/api/v1/telegram/webhook
```

---

# 121. Example product APIs

```text
GET    /api/v1/admin/products
POST   /api/v1/admin/products
GET    /api/v1/admin/products/:id
PATCH  /api/v1/admin/products/:id
DELETE /api/v1/admin/products/:id
```

Delete should usually archive products rather than permanently delete historical records.

---

# 122. Inventory APIs

```text
GET  /api/v1/admin/inventory
POST /api/v1/admin/inventory

POST /api/v1/admin/inventory/import
POST /api/v1/admin/inventory/validate-import

PATCH /api/v1/admin/inventory/:id
```

---

# 123. Customer APIs

```text
GET   /api/v1/admin/customers
GET   /api/v1/admin/customers/:id

PATCH /api/v1/admin/customers/:id/status

POST /api/v1/admin/customers/:id/wallet-adjustment
POST /api/v1/admin/customers/:id/message
```

---

# 124. Order APIs

```text
GET /api/v1/admin/orders

GET /api/v1/admin/orders/:id

POST /api/v1/admin/orders/:id/refund
POST /api/v1/admin/orders/:id/resend-delivery
POST /api/v1/admin/orders/:id/replace
```

---

# 125. Webhook processing

Telegram webhook endpoint:

```text
POST /api/v1/telegram/webhook
```

Verify Telegram webhook secret where supported/configured.

Webhook processing should return quickly.

Long tasks should be sent to background workers.

---

# 126. Idempotency

Critical operations require idempotency protection.

Especially:

```text
Purchase
Deposit credit
Refund
Referral commission
Supplier fulfilment
Wallet adjustment
```

The same request must not process financial effects twice.

---

# 127. Error handling

Standard API error structure:

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient wallet balance"
  }
}
```

Do not expose internal stack traces to customers.

---

# 128. Customer Telegram error handling

Friendly error:

```text
⚠ Something went wrong while processing your order.

No money was deducted.

Please try again.

[ Try Again ]
[ Support ]
```

Only say that no money was deducted when the system has verified that condition.

---

# 129. Maintenance mode

Admin can enable:

```text
Maintenance Mode
```

Bot response:

```text
🔧 The store is temporarily under maintenance.

Existing orders remain accessible.

Please try again shortly.
```

Owner and administrators may optionally bypass maintenance.

---

# 130. Low-stock alerts

Admin can configure threshold per product.

Example:

```text
Cursor Pro

Available stock:
4

Threshold:
5

⚠ Low Stock
```

Notify through:

- admin dashboard
- optional Telegram admin notification
- optional email

---

# 131. Out-of-stock behavior

Product may:

```text
remain visible but disabled
```

or:

```text
be hidden automatically
```

depending on configuration.

Example:

```text
Cursor Pro
❌ Out of Stock
```

---

# 132. Analytics

Track:

```text
Gross revenue
Net revenue
Order count
Average order value
Customer lifetime spend
Inventory cost
Gross margin
Refund value
Referral cost
Deposit volume
Top products
Top categories
Repeat purchase rate
```

---

# 133. Reporting filters

Reports support:

```text
Date range
Product
Category
Customer
Supplier
Payment network
Order status
```

---

# 134. Exporting

Admin should be able to export:

```text
Orders CSV
Wallet transactions CSV
Deposits CSV
Customers CSV
Inventory CSV
Profit report CSV
```

Sensitive credentials must not be included in generic exports.

---

# 135. Admin notifications

Alert examples:

```text
Large deposit
Large purchase
Low stock
Failed blockchain verification
Repeated failed TxIDs
Manual fulfilment needed
Warranty claim
Refund request
Supplier API failure
```

---

# 136. Suspicious activity controls

Flag examples:

```text
Repeated invalid TxIDs
Multiple deposit claims using same hash
Extreme order volume
Referral abuse
Multiple failed purchases
Rapid support abuse
```

The system should flag activity for review rather than automatically accusing customers.

---

# 137. Scheduled jobs

Examples:

```text
Release expired reservations
Recheck pending deposits
Close expired sessions
Archive old notification jobs
Check low stock
Expire promotional campaigns
Process scheduled broadcasts
```

---

# 138. Logging

Application logs should capture:

```text
timestamp
service
level
request ID
user/admin ID
event
```

Never log:

```text
passwords
bot token
private keys
full credentials
authentication secrets
```

---

# 139. Monitoring

Recommended:

```text
Sentry
Uptime Kuma
Structured application logs
Docker health checks
```

Monitor:

```text
API health
Telegram webhook
PostgreSQL
Redis
Workers
Queue backlog
Disk usage
Backup completion
```

---

# 140. Backup strategy

At minimum:

```text
Daily PostgreSQL backup
Encrypted
Retention policy
Off-server copy
Restore testing
```

Recommended retention:

```text
7 daily
4 weekly
3 monthly
```

Adjust based on storage budget.

---

# 141. File storage

Use S3-compatible object storage for:

```text
product files
reports
imports
exports
attachments
```

Potential providers:

```text
Cloudflare R2
Backblaze B2
MinIO
AWS S3
```

For a single VPS MVP, MinIO or direct storage can work, but remote backups are still recommended.

---

# 142. Deployment architecture

Recommended Docker Compose services:

```text
nginx
admin-web
api
telegram-bot
worker
postgres
redis
```

Optional:

```text
minio
uptime-kuma
```

---

# 143. Domains

Example:

```text
admin.example.com
api.example.com
```

Telegram communicates with:

```text
api.example.com/api/v1/telegram/webhook
```

---

# 144. HTTPS

Use:

```text
Caddy
```

or:

```text
Nginx + Let's Encrypt
```

Caddy is simpler for automatic TLS.

---

# 145. Environment separation

Maintain:

```text
development
staging
production
```

Production data should not be copied casually into development.

---

# 146. Configuration management

Use environment variables for:

```text
DATABASE_URL
REDIS_URL
TELEGRAM_BOT_TOKEN

SESSION_SECRET

ENCRYPTION_KEY

BLOCKCHAIN_API_KEYS

SENTRY_DSN
```

Commit:

```text
.env.example
```

Never commit `.env`.

---

# 147. Development repository

Recommended:

```text
telegram-store/
│
├── apps/
│   ├── api/
│   ├── admin-web/
│   ├── telegram-bot/
│   └── worker/
│
├── packages/
│   ├── database/
│   ├── shared/
│   ├── payments/
│   ├── inventory/
│   ├── localization/
│   └── config/
│
├── infra/
│
├── docker-compose.yml
│
├── .env.example
│
└── README.md
```

---

# 148. Non-functional requirements

## Performance

Typical Telegram button response:

```text
< 1 second
```

when no slow external service is involved.

Normal admin APIs:

```text
p95 < 500ms
```

where practical.

---

## Availability

Target MVP:

```text
99.5%+
```

Higher availability can be pursued later.

---

## Scalability

The first architecture should comfortably support:

```text
thousands of customers
hundreds of products
hundreds of thousands of inventory items
large order history
```

without redesigning the core database.

---

# 149. Accessibility

Admin panel should support:

```text
keyboard navigation
readable contrast
responsive layouts
clear form errors
```

---

# 150. Telegram conversation states

Potential states:

```text
IDLE

SEARCHING_PRODUCT

WAITING_CUSTOM_QUANTITY

WAITING_TXID

CREATING_SUPPORT_TICKET
WAITING_SUPPORT_MESSAGE

CREATING_WARRANTY_CLAIM
WAITING_WARRANTY_MESSAGE
```

Temporary states belong primarily in Redis.

---

# 151. Bot navigation rule

Every Telegram screen should offer a predictable way to return.

Prefer:

```text
← Back
🏠 Main Menu
```

Avoid trapping users in conversation states.

---

# 152. Telegram callback design

Use compact callback identifiers.

Example:

```text
cat:12
prod:173
qty:173:3
order_confirm:abc
wallet:usdt_bep20
```

Do not expose secrets in callback data.

---

# 153. Customer data privacy

Store only data required to operate the business.

Do not unnecessarily collect:

```text
government IDs
addresses
phone numbers
```

unless the business genuinely needs them.

---

# 154. Legal product restrictions

The platform itself can support legitimate digital goods, but the merchant using it must have authorization to distribute the products offered.

Admin should be able to define:

```text
Product terms
Warranty terms
Refund policy
Terms of service
Privacy policy
```

---

# 155. Policy acceptance

Optional at first start:

```text
By using this store you agree to:

Terms of Service
Privacy Policy
Refund Policy

[ ✅ Continue ]
```

Store policy-version acceptance.

---

# 156. Admin settings pages

Recommended sections:

```text
General
Branding
Telegram
Payments
Referrals
Orders
Inventory
Support
Warranty
Notifications
Languages
Security
Administrators
Integrations
Backups
```

---

# 157. Branding settings

Admin changes:

```text
Store name
Logo
Welcome text
Support handle
Footer
Default language
```

No code changes required.

---

# 158. Bot command setup

Supported commands:

```text
/start
/menu
/buy
/wallet
/orders
/profile
/support
/language
```

Buttons remain the primary interaction method.

---

# 159. Administrative Telegram notifications

Optionally create a private admin notification channel.

Examples:

```text
💰 Deposit Confirmed
$250 USDT
Customer #...

🛒 New Large Order
$180

⚠ Product Low Stock
Cursor Pro
2 remaining
```

Do not expose customer secrets unnecessarily.

---

# 160. Searchable identifiers

Generate human-friendly IDs:

```text
ORD-2026-000123
DEP-2026-000040
TKT-2026-000091
WAR-2026-000021
```

Internally use UUIDs.

---

# 161. Database integrity

Use foreign keys.

Use unique constraints.

Examples:

```text
users.telegram_user_id UNIQUE

products.sku UNIQUE

deposit(network_id, transaction_hash) UNIQUE

wallet.user_id UNIQUE
```

---

# 162. Soft deletion

Historical resources should normally use:

```text
archived_at
```

rather than physical deletion.

Never break old orders when a product is removed.

---

# 163. Financial reconciliation

Admin report:

```text
Starting wallet liabilities
+ Deposits
+ Promotional credits
+ Referral credits
- Purchases
- Debits
- Refund corrections
= Current customer wallet liability
```

This is important once the store has meaningful volume.

---

# 164. Security around wallet changes

Any manual wallet change above a configurable threshold can optionally require owner approval.

Example:

```text
Finance Manager requests +$500 adjustment
      ↓
Owner approval required
```

Useful for larger operations.

---

# 165. Refund audit

Refund flow:

```text
Admin requests refund
      ↓
Validate original transaction
      ↓
Create refund record
      ↓
Credit wallet
      ↓
Record audit
      ↓
Notify customer
```

---

# 166. Manual fulfilment products

Not every product must be instant.

Product:

```text
delivery_type = MANUAL_DELIVERY
```

After purchase:

```text
✅ Order Received

Your order requires manual processing.

Order:
#ORD-...

Estimated processing:
Up to X hours.
```

Admin receives a fulfilment task.

---

# 167. Manual fulfilment dashboard

Queue:

```text
Order
Customer
Product
Purchased
SLA
Status
Assigned Staff
```

Admin submits delivery payload.

Customer receives it automatically.

---

# 168. Outbound Telegram message queue

Do not send large broadcast batches directly from request handlers.

Use background jobs.

Queue should support:

```text
retry
backoff
failure tracking
rate limiting
```

---

# 169. Notifications center

Admin control panel should have:

```text
Bell icon
```

showing:

```text
New ticket
Low stock
Deposit problem
Warranty claim
Supplier failure
```

---

# 170. Admin dashboard responsiveness

Desktop:

- sidebar
- cards
- tables
- charts

Mobile/tablet:

- collapsible sidebar
- responsive cards
- scrollable tables

The control panel should still be usable from a phone for emergency operations.

---

# 171. Design direction

The dashboard should feel like a modern SaaS control panel.

Recommended visual characteristics:

```text
Clean
Dense but readable
Fast
Minimal animations
Good tables
Strong search/filtering
Clear financial indicators
Dark/light mode optional
```

Do not over-design with unnecessary gradients or excessive motion.

---

# 172. Global admin search

Search bar should locate:

```text
Customer
Telegram username
Order
Deposit
Product
Ticket
TxID
```

Example:

```text
ORD-10291
```

directly opens the order.

---

# 173. Activity feed

Dashboard can contain:

```text
4:31 PM
Order #... completed

4:29 PM
Deposit $20 confirmed

4:20 PM
Cursor Pro stock added +20

4:15 PM
Warranty claim opened
```

---

# 174. Product sales metrics

Each product page should show:

```text
Units sold
Revenue
Inventory remaining
Average selling price
Average purchase cost
Gross margin
Refund rate
Warranty rate
```

---

# 175. Customer segmentation

Later support:

```text
New
Repeat buyer
VIP
High spender
Dormant
Referral customer
```

Initially these can be calculated dynamically.

---

# 176. Admin notes

Allow internal notes on:

```text
Customer
Order
Deposit
Support ticket
Warranty claim
```

Never send internal notes to customers.

---

# 177. Testing strategy

Testing must include:

### Unit tests

For:

```text
wallet calculations
pricing
referral calculations
deposit rules
inventory selection
```

### Integration tests

For:

```text
database transactions
checkout
deposit credit
refund
inventory reservation
```

### End-to-end tests

For:

```text
Telegram customer flows
Admin product creation
Inventory upload
Purchase fulfilment
```

---

# 178. Critical concurrency tests

Must test:

```text
Two customers buying last item
Duplicate purchase callback
Duplicate TxID submission
Repeated refund request
Repeated referral commission job
Webhook retry
```

---

# 179. Security testing

Test:

```text
Admin brute force
Unauthorized role access
IDOR
SQL injection
XSS
CSRF
Webhook spoofing
Sensitive data leakage
Secret logging
Session theft protections
```

---

# 180. Backup restore testing

A backup is useless unless restoration is tested.

At scheduled intervals:

```text
Restore backup into isolated environment
Verify tables
Verify record counts
Verify application startup
```

---

# 181. MVP scope

For the first production version, implement:

```text
Telegram authentication

Main menu

Categories
Catalog
Product details
Search

Quantity selection

Customer profile

Wallet ledger

USDT deposit
TxID verification

Orders
Atomic checkout

Inventory management

Automatic delivery

Purchase history

Referral system

Language framework

Support link/basic tickets

Admin authentication
2FA

Dashboard

Products
Categories
Inventory
Customers
Orders
Deposits
Wallet transactions
Referrals
Basic support

Roles
Audit logs

Settings

Docker deployment
Backups
Monitoring
```

---

# 182. MVP exclusions

Do not delay first release for:

```text
Advanced supplier marketplace
Complex AI recommendations
Native mobile app
Multi-vendor marketplace
Advanced loyalty points
Blockchain smart contracts
Multi-region infrastructure
Advanced fraud ML
Complicated accounting ERP
Public developer marketplace
```

---

# 183. V2 scope

After the core business works reliably, add:

```text
Automatic deposit detection

More cryptocurrency networks

Supplier APIs

Advanced support tickets

Warranty automation

Coupons

Promotions

Scheduled broadcasts

Advanced analytics

Supplier profitability

Customer segmentation

Automated replacement

Advanced fraud rules

Reseller program

Public API

Web storefront

Telegram Mini App

Multiple stores

Multi-currency accounting
```

---

# 184. V3 possibilities

The same backend could eventually become a SaaS where multiple merchants create their own Telegram stores.

Architecture:

```text
Merchant
  ↓
Create Store
  ↓
Connect Telegram Bot Token
  ↓
Add Products
  ↓
Upload Inventory
  ↓
Configure Payments
  ↓
Launch
```

At that point it becomes a multi-tenant Telegram commerce platform.

Do not build multi-tenancy into the initial implementation unless that business direction is confirmed.

---

# 185. Development phases

## Phase 1 — Foundation

Build:

```text
Monorepo
NestJS
Next.js
PostgreSQL
Redis
Prisma
Docker Compose
Authentication
RBAC
Audit framework
```

---

## Phase 2 — Telegram foundation

Implement:

```text
Bot webhook
/start
Customer creation
Main menu
Language system
Conversation state
```

---

## Phase 3 — Commerce catalog

Implement:

```text
Categories
Products
Search
Product detail
Stock display
Quantity
```

---

## Phase 4 — Admin catalog

Implement:

```text
Category management
Product management
Inventory management
Bulk imports
```

---

## Phase 5 — Wallet

Implement:

```text
Wallet
Ledger
Wallet UI
Admin transactions
Manual adjustments
```

---

## Phase 6 — Deposits

Implement:

```text
Payment networks
Deposit instructions
TxID capture
Blockchain verification abstraction
Deposit states
Wallet credit
```

---

## Phase 7 — Checkout

Implement:

```text
Purchase confirmation
Atomic checkout
Inventory locking
Wallet debit
Order creation
```

---

## Phase 8 — Delivery

Implement:

```text
Delivery records
Telegram delivery
History
View delivery
```

---

## Phase 9 — Referral system

Implement:

```text
Deep linking
Attribution
Commission
Wallet credit
Admin reporting
```

---

## Phase 10 — Operations

Implement:

```text
Support
Warranty basics
Refunds
Notifications
Low stock
```

---

## Phase 11 — Analytics

Implement:

```text
Dashboard metrics
Charts
Profit
Exports
```

---

## Phase 12 — Production hardening

Implement:

```text
2FA
Rate limiting
Encryption
Monitoring
Backups
Error tracking
Security testing
Load testing
```

---

# 186. Definition of done for MVP

The MVP is production-ready only when the following complete scenario works:

```text
Admin logs into control panel

↓

Admin creates category

↓

Admin creates product

↓

Admin uploads inventory

↓

Customer opens Telegram bot

↓

Customer selects language

↓

Customer browses catalog

↓

Customer selects product

↓

Customer selects quantity

↓

Customer has insufficient balance

↓

Customer opens wallet

↓

Customer selects USDT network

↓

Customer submits valid transaction

↓

Blockchain transaction verified

↓

Wallet credited

↓

Customer returns to product

↓

Customer confirms purchase

↓

Wallet debited atomically

↓

Inventory locked and sold

↓

Order created

↓

Product delivered through Telegram

↓

Customer sees order in purchase history

↓

Admin sees order/revenue/customer

↓

Referral commission is applied if applicable

↓

Customer can request support

↓

All critical administrative actions appear in audit logs
```

If this complete flow works reliably, the core platform is operational.

---

# 187. Important engineering principles

The coding agent should follow these rules throughout development:

```text
Never hardcode products.

Never hardcode prices.

Never trust customer-submitted payment information.

Never change balances without ledger entries.

Never fulfil an order outside a controlled transaction.

Never deliver the same inventory item twice.

Never expose secrets in Telegram.

Never store sensitive inventory unencrypted.

Never give every admin full permissions.

Never perform silent financial corrections.

Never delete financial history.

Never rely solely on Telegram username.

Never allow webhook retries to duplicate financial operations.
```

---

# 188. Recommended final technology stack

### Frontend

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
```

### Backend

```text
NestJS
TypeScript
REST API
```

### Telegram

```text
grammY
```

### Database

```text
PostgreSQL
Prisma
```

### Queue/cache

```text
Redis
BullMQ
```

### Infrastructure

```text
Docker
Docker Compose
Caddy or Nginx
```

### Monitoring

```text
Sentry
Uptime Kuma
```

### Storage

```text
S3-compatible storage
```

### Production deployment

```text
VPS
```

---

# 189. Recommended final product architecture

```text
                       INTERNET
                           │
                           ▼
                     Caddy / Nginx
                    HTTPS + Routing
                     /           \
                    /             \
                   ▼               ▼
           Admin Next.js       NestJS API
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
             ▼                     ▼                     ▼
        Telegram Bot           PostgreSQL              Redis
             │                                           │
             │                                           ▼
             │                                        BullMQ
             │                                           │
             │                                      Background
             │                                        Workers
             │                                           │
             │                         ┌─────────────────┼───────────────┐
             │                         ▼                 ▼               ▼
             │                      Payments         Delivery       Notifications
             │
             ▼
          CUSTOMER
```

---

# 190. Product direction recommendation

Do not build this as:

> “a bot that sells AI accounts.”

Build it as:

> **a reusable Telegram digital-commerce platform with wallet, inventory, automatic fulfilment and a full administrative control system.**

That distinction matters.

The first version can power one store, but the architecture will already support:

```text
AI tools
software licenses
gift codes
API credits
hosting
VPS
digital downloads
subscriptions
activation links
membership access
other authorized digital inventory
```

without rebuilding the system each time.

For your first production release, the highest-priority path is:

**Admin panel → products → inventory → wallet → verified deposits → atomic orders → automatic delivery → purchase history → referrals → support → security and audit.**

That gives you a complete end-to-end system rather than simply cloning the visible Telegram interface.