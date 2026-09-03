---
status: accepted
---

# Native Bridge uses async Request-Response over JSON

We have decided to model the communication between the Lit web application and the mobile Native WebView wrappers (Android/iOS) as an asynchronous Request-Response system using Promises and a unique Correlation ID for every message. 
All payloads are serialized JSON strings, and the communication is scoped under a global namespace: `window.LitLionAppBridge`.

We chose this over a simpler "fire-and-forget" event system because it future-proofs the architecture. Any fire-and-forget action can be modeled as a Request-Response where the response is ignored, but upgrading a fire-and-forget system to handle responses later would require painful, coordinated releases across Web, Android, and iOS. Serializing JSON strings mitigates parsing bugs common in older Android `addJavascriptInterface` implementations.
