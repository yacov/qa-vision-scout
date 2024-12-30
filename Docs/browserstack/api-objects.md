# BrowserStack API Objects

## Browser Objects
A browser object is a plain object with the following properties:
- `os`: The operating system
- `os_version`: The operating system version
- `browser`: The browser name
- `browser_version`: The browser version
- `device`: The device name

## Worker Objects
Worker objects extend browser objects with:
- `id`: The worker id
- `status`: Current status ("running" or "queue")

## Project Objects
Project objects contain:
- `id`: Project id
- `name`: Project name
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `user_id`: User ID
- `group_id`: Group ID