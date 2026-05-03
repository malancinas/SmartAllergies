# Privacy Policy

**App name:** Local Allergies  
**Last updated:** 3 May 2026  
**Effective date:** 3 May 2026

---

## 1. Who We Are

Local Allergies ("we", "us", "our") is developed and operated by **[YOUR FULL NAME]**.

For questions about this Privacy Policy, contact us at: **[YOUR CONTACT EMAIL]**

We are the data controller for the personal data described in this policy. Where we use third-party processors, we remain responsible for ensuring your data is handled lawfully.

---

## 2. Scope

This Privacy Policy applies to the Local Allergies mobile application ("the App") available on the Apple App Store and Google Play Store, as well as any associated services we operate. It explains what personal data we collect, why we collect it, how we use and store it, who we share it with, and your rights under applicable data protection law, including the UK General Data Protection Regulation (UK GDPR) and, where applicable, the EU General Data Protection Regulation (EU GDPR).

By creating an account or using the App, you confirm that you have read and understood this policy. If you do not agree to this policy, you must not use the App.

---

## 3. Age Restrictions

The App is intended for users aged **17 and over**. We do not knowingly collect personal data from anyone under the age of 13. If you believe we have inadvertently collected data from a child under 13, please contact us immediately so we can delete it. Users between 13 and 17 should use the App only with the consent of a parent or legal guardian.

---

## 4. What Data We Collect and Why

### 4.1 Account Data

**What we collect:** Your name, email address, and — where you sign in via a third-party identity provider — an account identifier issued by Google or Apple.

**Why we collect it:** To create and secure your account, authenticate you when you log in, send you password-reset or account-security emails, and link your data across devices.

**Legal basis (UK/EU GDPR):** Performance of a contract (Article 6(1)(b)) — account data is necessary to provide the service.

**Storage:** Account credentials are processed and stored by our authentication infrastructure. Passwords are never stored in plain text.

---

### 4.2 Health and Symptom Data (Special Category)

**What we collect:** Symptom logs you enter yourself, including: symptom type (e.g. sneezing, itchy eyes, congestion — from a fixed set of 6 categories), severity score (1–10), time of day, whether medication was taken, and free-text medication name. These constitute **health data** under UK/EU GDPR Article 9.

**Why we collect it:** To display your personal symptom history, power the on-device statistical allergen profile (see Section 4.4), generate allergist-ready PDF exports (Pro), and calculate personalised risk scores for your daily dashboard.

**Legal basis:** Your **explicit consent** (Article 9(2)(a)) obtained at the point of first symptom log and during onboarding. You may withdraw this consent at any time by deleting your symptom logs in the App (Settings → Data & Privacy → Delete All Logs). Withdrawal does not affect processing carried out before withdrawal.

**Storage:** Symptom logs are stored **locally on your device** in an encrypted SQLite database. They are not uploaded to our servers.

---

### 4.3 Location Data

**What we collect:**  
- **GPS coordinates** obtained from your device when you open the App, used to fetch local pollen and air quality forecasts from third-party weather APIs. We do not store your raw GPS coordinates on our servers.  
- **Manually entered locations** (place names and approximate coordinates) you save within the App. These are stored locally on your device and in your account preferences.  
- **Location cells** (rounded to 1° of latitude/longitude, approximately 111 km precision): for Pro users accessing multi-source pollen data outside Europe, up to three location cells are stored per day within your account preferences to enforce fair-use rate limits.

**Why we collect it:** Location is essential to fetch accurate local pollen, air quality, and weather data. Without at least an approximate location, the core forecasting features cannot function.

**Legal basis:** Legitimate interests (Article 6(1)(f)) — providing accurate local pollen data is the core function of the App and cannot be delivered without location. We obtain your device's location permission before any GPS access. You may revoke location permission in your device Settings at any time; the App will then prompt you to enter a location manually.

**Storage:** GPS coordinates are used in real-time API requests and are not stored on our servers. Recent manually entered locations (up to 8) are stored in your account preferences.

---

### 4.4 Environmental Snapshot Data

**What we collect:** When you log a symptom, the App automatically records the pollen levels (grass, tree, weed in grains/m³) and air quality readings (PM2.5, PM10, ozone, NO₂, SO₂, UV index, dust) at your current location and date. This environmental snapshot is linked to each symptom log entry.

**Why we collect it:** The on-device statistical allergen profile (Pro feature) uses these paired environment–symptom records to compute Pearson correlations and partial regression coefficients, identifying which environmental factors are most associated with your symptoms. This processing happens entirely on your device.

**Legal basis:** Your explicit consent (Article 9(2)(a)) — the same consent you provide for symptom data governs environmental snapshots, as they are captured and processed solely in the context of your symptom log.

**Storage:** Stored locally on your device alongside your symptom logs. Not transmitted to our servers.

---

### 4.5 Statistical Allergen Model ("Personal Allergen Model") — On-Device Processing

**How it works:** The Local Allergies Pro "Personal allergen model" is a **statistical analysis engine that runs entirely on your device**. It uses Pearson correlation and ordinary least-squares (OLS) regression to quantify relationships between your logged symptoms and the environmental conditions (pollen, air quality) recorded alongside each log. The model requires at least 7 days of logged data for basic insights and 14 days for advanced analysis. No data from other users is used to generate your profile, and your personal data is not uploaded to any server for model computation.

**Important accuracy notice:** The results produced by the allergen model are **statistical indicators based on your own logged data only**. They are not a medical diagnosis and can be affected by incomplete logging, lifestyle factors not captured in the App, and the inherent limitations of statistical correlation on small datasets. See Section 8 of our Terms and Conditions for a full accuracy disclaimer.

**Storage:** Model outputs (correlation scores, trigger rankings) are stored locally on your device. They are not uploaded to our servers.

---

### 4.6 Subscription and Purchase Data

**What we collect:** Your subscription status (Free or Pro), entitlement identifiers, and purchase confirmation tokens managed by RevenueCat.

**Why we collect it:** To determine which features you have access to, and to process and verify your Pro subscription.

**Legal basis:** Performance of a contract (Article 6(1)(b)).

**Storage:** Subscription status is stored locally on your device and synced with RevenueCat's servers. We do not store your payment card details — all billing is handled by the Apple App Store or Google Play Store. See RevenueCat's privacy policy for details of their data practices.

---

### 4.7 App Preferences and Settings

**What we collect:** Your in-app preferences including: theme (light/dark), notification schedules and alert thresholds, allergen profile selections, language preference, and onboarding completion status.

**Why we collect it:** To personalise and persist your experience across sessions.

**Legal basis:** Legitimate interests (Article 6(1)(f)) — storing preferences is necessary for the App to function as expected between sessions.

**Storage:** Stored locally on your device using encrypted AsyncStorage. Preference data is not uploaded to our servers.

---

### 4.8 Device and Diagnostic Data

**What we collect:** We do not collect device identifiers, crash logs, analytics events, or advertising identifiers.

**Third-party SDKs** included in the App (RevenueCat, Google Sign-In, Apple Sign-In) may collect limited device diagnostic information in accordance with their own privacy policies. We do not control or receive this data.

---

## 5. How We Use Your Data — Summary

| Data Type | Primary Use | Transferred Externally? |
|---|---|---|
| Account (name, email) | Authentication, account management | Auth provider only |
| Symptom logs | History, on-device allergen model, PDF export | No (on-device only) |
| Environmental snapshots | On-device allergen model | No |
| GPS coordinates | Real-time pollen/AQ API requests | Third-party weather APIs (no account link) |
| Subscription status | Feature gating | RevenueCat |
| Settings/preferences | App personalisation | No |

---

## 6. Third-Party Services and Processors

We work with the following third-party services. Where they process your personal data on our behalf, we have entered into appropriate data processing agreements.

### 6.1 RevenueCat
**Purpose:** Subscription management and entitlement verification.  
**Data involved:** Device identifiers, purchase tokens, subscription status.  
**Privacy policy:** [https://www.revenuecat.com/privacy](https://www.revenuecat.com/privacy)

### 6.2 Open-Meteo
**Purpose:** Pollen and weather forecast data.  
**Data involved:** Your approximate location coordinates (sent as API query parameters to retrieve local forecasts). No account data is transmitted.  
**Privacy policy:** [https://open-meteo.com/en/terms](https://open-meteo.com/en/terms)

### 6.3 Google Pollen API (Pro)
**Purpose:** Multi-source pollen data and heatmap tile overlays for Pro users.  
**Data involved:** Your location coordinates sent as API query parameters. No account data is transmitted.  
**Operated by:** Google LLC. Google's privacy policy applies: [https://policies.google.com/privacy](https://policies.google.com/privacy)

### 6.4 Google Sign-In / Apple Sign-In
**Purpose:** Third-party authentication.  
**Data involved:** An identity token issued by Google or Apple confirming your account identity. We do not receive your Google or Apple password.  
**Policies:** [https://policies.google.com/privacy](https://policies.google.com/privacy) | [https://www.apple.com/legal/privacy](https://www.apple.com/legal/privacy)

---

## 7. International Data Transfers

The majority of your personal data is stored **locally on your device** and is not transferred internationally. Where data is transferred to third-party services (as described in Section 6), those transfers are governed by the safeguards described in each third party's applicable data transfer mechanism (Standard Contractual Clauses or equivalent UK adequacy framework).

---

## 8. Data Retention

| Data | Retention period |
|---|---|
| Account data | Until you delete your account |
| Symptom logs and environmental snapshots | Until you delete them manually or delete your account |
| Subscription records | As required by RevenueCat and applicable law (typically 7 years for financial records) |
| Locally stored preferences and settings | Until you uninstall the App or delete your account |

---

## 9. Your Rights Under UK/EU GDPR

You have the following rights regarding your personal data. To exercise any right, contact us at **[YOUR CONTACT EMAIL]**.

| Right | What it means |
|---|---|
| **Access** | Request a copy of the personal data we hold about you |
| **Rectification** | Ask us to correct inaccurate data |
| **Erasure ("right to be forgotten")** | Ask us to delete your data. You can delete symptom logs and your account directly within the App. |
| **Data portability** | Request your data in a machine-readable format |
| **Restriction** | Ask us to restrict processing while a dispute is resolved |
| **Object** | Object to processing based on legitimate interests |
| **Withdraw consent** | Withdraw consent for health data processing at any time, without affecting prior lawful processing |
| **Complain** | Lodge a complaint with the Information Commissioner's Office (ICO): [https://ico.org.uk](https://ico.org.uk) |

We will respond to rights requests within **30 days**. We may ask you to verify your identity before processing a request.

---

## 10. Data Security

We implement the following technical and organisational measures to protect your data:

- Symptom logs, environmental snapshots, and preferences are stored in encrypted on-device storage.
- Account authentication tokens are stored in secure, sandboxed storage.
- Communications between the App and our servers use TLS/HTTPS encryption.
- We do not store payment card information.
- Access to our backend systems is restricted to authorised personnel only.

No method of electronic transmission or storage is 100% secure. In the event of a data breach that is likely to affect your rights and freedoms, we will notify you and the relevant supervisory authority as required by law.

---

## 11. Tracking and Advertising

We do not use advertising identifiers (such as Apple's IDFA or Google's GAID). We do not track you across apps or websites owned by other companies. We do not serve behavioural advertising. The App does not contain any advertising SDKs.

---

## 12. Cookies and Similar Technologies

As a mobile application, the App does not use cookies. Some third-party services integrated in the App (such as Google APIs) may use similar session-level technologies; these are governed by their own privacy policies.

---

## 13. Changes to This Policy

We may update this policy from time to time. When we make material changes, we will:

1. Update the "Last updated" date at the top of this document.
2. Display an in-app notice the next time you open the App.

Continued use of the App after a policy update constitutes acceptance of the revised terms. If you do not agree with any changes, you should stop using the App and delete your account.

The current version of this policy is always available in the App under Settings → Legal → Privacy Policy.

---

## 14. Contact Us

If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:

**Email:** [YOUR CONTACT EMAIL]

For complaints relating to UK data protection law, you may contact the Information Commissioner's Office (ICO) at [https://ico.org.uk](https://ico.org.uk) or by telephone on 0303 123 1113.
