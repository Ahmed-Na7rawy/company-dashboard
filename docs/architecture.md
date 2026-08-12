# Architecture & Data Flow System Design

The **Enterprise Executive BI Dashboard** is built on an asynchronous, multithreaded architecture designed to process multi-period financial transactions without degrading main-thread rendering performance.

---

## 🏗️ System Architecture & Data Flow Diagram

```mermaid
flowchart TD
    subgraph Browser Main Thread (UI & Interaction)
        User[User Interaction / Filter Change] --> AppRouter[App.tsx View Router]
        
        %% Code Splitting Path
        AppRouter -->|Dynamic Import| LazyWrapper["lazyWithRetry() Helper"]
        LazyWrapper -->|Fetch Chunk| AsyncChunk["Lazy Chunk Loading (Suspense / Skeleton)"]
        AsyncChunk --> UIComponent["Active View Component (e.g. CeoView)"]
        
        %% Data Pipeline Path
        UIComponent --> CustomHook["useXxxData Hook (State & Parameters)"]
        CustomHook --> WorkerClient["Web Worker Client Manager"]
        WorkerClient -->|postMessage: Params & Query| WebWorker
        
        UIReceive["UI Component Re-render (60 FPS Unblocked)"]
    end

    subgraph Background ES Web Worker Thread
        WebWorker["dataWorker.ts (Background Thread)"]
        WebWorker --> CacheCheck{"Cache API Hit?"}
        CacheCheck -- Yes --> CachedData["Retrieve Aggregated JSON"]
        CacheCheck -- No --> DataProc["Execute Dataset Filtering & Aggregations"]
        DataProc --> CacheSave["Save Result to Cache API"]
        CacheSave --> WebWorker
        CachedData --> WebWorker
        WebWorker -->|postMessage: Processed Aggregations| WorkerClient
    end

    WorkerClient --> UIReceive

    style WebWorker fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff
    style CacheCheck fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff
    style LazyWrapper fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#fff
```

---

## 💡 Why This Architecture Exists (The Problem Solved)

In traditional single-threaded web applications, filtering tens of thousands of corporate transaction records inside React state calculations forces the browser's main thread to freeze. This results in **UI jank**, dropped frames, unresponsive dropdown filters, and degraded user experience during executive data analysis.

To solve this, our architecture completely isolates heavy data manipulation:

1. **Multithreaded Execution**: Transaction filtering, search indexing, and multi-period financial calculations run on a separate background CPU thread via native **ES Web Workers**. The browser interface remains completely fluid and responsive at 60 FPS while background calculations complete.
2. **On-Demand Code Splitting**: Using our `lazyWithRetry()` helper, large visualization libraries (Recharts, Plotly, Leaflet) are loaded asynchronously only when the user navigates to a specific department view, shrinking the initial JavaScript bundle footprint.
3. **Smart Cache API Storage**: Repeated filter calculations and aggregated responses are cached directly in the browser's Cache API, eliminating redundant background thread processing for identical queries.
