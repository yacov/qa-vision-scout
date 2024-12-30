# Error Handling

All requests are pre-processed and validated. Errors are returned in a consistent format:

```json
{
  "message": "Validation Failed",
  "errors": [
    {
      "field": "type",
      "code": "required"
    }
  ]
}
```

Possible error codes:
- `required`
- `invalid`