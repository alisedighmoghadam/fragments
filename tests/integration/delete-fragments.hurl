# tests/integration/delete-fragment.hurl

# POST a new text fragment to delete later
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Delete`

# Expect HTTP 201 Created and capture Location
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.type" == "text/plain"
jsonpath "$.size" == 6
[Captures]
url: header "Location"

# DELETE the fragment as an authorized user
DELETE {{url}}
[BasicAuth]
user1@email.com:password1

# Expect HTTP 200 OK
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"

# Try to GET the deleted fragment
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Expect HTTP 404 Not Found
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"


# Attempt to DELETE as an unauthenticated user
DELETE {{url}}

# Expect HTTP 401 Unauthorized
HTTP/1.1 401
[Asserts]
jsonpath "$.status" == "error"

# Attempt to DELETE a non-existent fragment
DELETE http://localhost:8080/v1/fragments/non-existent-id
[BasicAuth]
user1@email.com:password1

# Expect HTTP 404 Not Found
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"

