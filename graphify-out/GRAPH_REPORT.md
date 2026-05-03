# Graph Report - C:\Users\POORNA CHANDRA D N\Downloads\Advance-Supply-Chain-DApp\Advance Supply Chain DApp  (2026-05-01)

## Corpus Check
- 60 files · ~92,977 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 110 nodes · 132 edges · 6 communities detected
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_KYC Storage|KYC Storage]]
- [[_COMMUNITY_Dashboard & Tracking|Dashboard & Tracking]]
- [[_COMMUNITY_Notification Storage|Notification Storage]]
- [[_COMMUNITY_Supply Chain Actions|Supply Chain Actions]]
- [[_COMMUNITY_Global Error Boundary|Global Error Boundary]]
- [[_COMMUNITY_Pinata Integration|Pinata Integration]]

## God Nodes (most connected - your core abstractions)
1. `getKYCUsers()` - 11 edges
2. `getNotifications()` - 10 edges
3. `useSupplyChainContract()` - 9 edges
4. `updateKYCUser()` - 7 edges
5. `saveNotifications()` - 7 edges
6. `saveKYCUsers()` - 6 edges
7. `GlobalErrorBoundary` - 5 edges
8. `addNotification()` - 5 edges
9. `UserManagement()` - 4 edges
10. `addKYCUser()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `UserManagement()` --calls--> `useSupplyChainContract()`  [INFERRED]
  components\Admin\UserManagement.js → hooks\useContract.js
- `ActivityChart()` --calls--> `useSupplyChainContract()`  [INFERRED]
  components\Dashboard\ActivityChart.js → hooks\useContract.js
- `RecentShipments()` --calls--> `useSupplyChainContract()`  [INFERRED]
  components\Dashboard\RecentShipments.js → hooks\useContract.js
- `CreateShipment()` --calls--> `useSupplyChainContract()`  [INFERRED]
  pages\create-shipment.js → hooks\useContract.js
- `Dashboard()` --calls--> `useSupplyChainContract()`  [INFERRED]
  pages\index.js → hooks\useContract.js

## Communities

### Community 0 - "KYC Storage"
Cohesion: 0.15
Nodes (22): UserManagement(), addKYCUser(), exportKYCData(), generateUserId(), getKYCStatistics(), getKYCStorageInfo(), getKYCUserByAddress(), getKYCUsers() (+14 more)

### Community 1 - "Dashboard & Tracking"
Cohesion: 0.12
Nodes (8): ActivityChart(), RecentShipments(), useSupplyChainContract(), CreateShipment(), Dashboard(), MyShipments(), TrackingPage(), TrackingDetails()

### Community 2 - "Notification Storage"
Cohesion: 0.3
Nodes (13): addNotification(), cleanupOldNotifications(), generateId(), getNotifications(), getNotificationsByType(), getRelativeTime(), getStorageInfo(), getUnreadCount() (+5 more)

### Community 3 - "Supply Chain Actions"
Cohesion: 0.17
Nodes (5): useApproveKYC(), useRegisterUser(), useRejectKYC(), AdminPanel(), KYCVerification()

### Community 4 - "Global Error Boundary"
Cohesion: 0.33
Nodes (1): GlobalErrorBoundary

### Community 5 - "Pinata Integration"
Cohesion: 0.5
Nodes (2): uploadFileToIPFS(), uploadMultipleFiles()

## Knowledge Gaps
- **Thin community `Global Error Boundary`** (6 nodes): `GlobalErrorBoundary.js`, `GlobalErrorBoundary`, `.componentDidCatch()`, `.constructor()`, `.getDerivedStateFromError()`, `.render()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pinata Integration`** (5 nodes): `getFromIPFS()`, `pinata.js`, `uploadFileToIPFS()`, `uploadJSONToIPFS()`, `uploadMultipleFiles()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useSupplyChainContract()` connect `Dashboard & Tracking` to `KYC Storage`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `UserManagement()` connect `KYC Storage` to `Dashboard & Tracking`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `useSupplyChainContract()` (e.g. with `UserManagement()` and `ActivityChart()`) actually correct?**
  _`useSupplyChainContract()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `Dashboard & Tracking` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._