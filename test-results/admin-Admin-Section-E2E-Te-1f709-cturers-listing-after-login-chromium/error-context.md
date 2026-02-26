# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "Sailing Yachts" [ref=e4] [cursor=pointer]:
        - /url: /
      - navigation [ref=e5]:
        - link "Browse" [ref=e6] [cursor=pointer]:
          - /url: /yachts
        - link "Compare" [ref=e7] [cursor=pointer]:
          - /url: /compare
        - link "Admin" [ref=e8] [cursor=pointer]:
          - /url: /admin
  - main [ref=e9]:
    - generic [ref=e11]:
      - generic [ref=e12]:
        - heading "Manage Manufacturers" [level=1] [ref=e13]
        - link "Back to Dashboard" [ref=e14] [cursor=pointer]:
          - /url: /admin
      - generic [ref=e15]:
        - generic [ref=e16]:
          - heading "Manufacturers List" [level=2] [ref=e17]
          - link "Add New Manufacturer" [ref=e18] [cursor=pointer]:
            - /url: /admin/manufacturers/new
        - alert [ref=e19]:
          - strong [ref=e20]: Error!
          - generic [ref=e21]: "Failed to fetch: 401"
  - contentinfo [ref=e22]:
    - generic [ref=e23]:
      - paragraph [ref=e24]: © 2026 Sailing Yachts Database. All rights reserved.
      - paragraph [ref=e25]: Data sourced from manufacturer specifications.
  - alert [ref=e26]
```