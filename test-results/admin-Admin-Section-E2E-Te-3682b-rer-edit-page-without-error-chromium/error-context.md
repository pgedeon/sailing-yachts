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
    - generic [ref=e10]:
      - heading "Admin Access Required" [level=1] [ref=e11]
      - paragraph [ref=e12]: Please log in to access the admin panel.
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Username
          - textbox "Username" [ref=e17]:
            - /placeholder: Enter username
        - generic [ref=e18]:
          - generic [ref=e19]: Password
          - textbox "Password" [ref=e20]:
            - /placeholder: Enter password
        - button "Login" [ref=e21] [cursor=pointer]
  - contentinfo [ref=e22]:
    - generic [ref=e23]:
      - paragraph [ref=e24]: © 2026 Sailing Yachts Database. All rights reserved.
      - paragraph [ref=e25]: Data sourced from manufacturer specifications.
  - alert [ref=e26]
```